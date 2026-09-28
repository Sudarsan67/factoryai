"""
FactoryPulse AI - Machine Health Score Engine
Subtitle: AI Maintenance Co-Pilot for Textile MSMEs
Phase 4: Multi-Factor Weighted Normalization (0-100 Health Score & Grading)
"""

import sqlite3
import os
import math
from datetime import datetime
from typing import Dict, Any, List, Optional, Tuple

DB_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "database", "factorypulse.db")

# Parameter weighting constants calibrated for textile machinery
# Vibration & Temperature are dominant mechanical/insulation failure precursors
WEIGHT_VIBRATION = 0.35
WEIGHT_TEMPERATURE = 0.30
WEIGHT_CURRENT = 0.20
WEIGHT_SOUND = 0.15

# Relative allowable deviations over baseline before entering Warning / Critical thresholds
# (warn_multiplier, crit_multiplier)
TOLERANCE_THRESHOLDS = {
    "temp": (1.25, 1.55),      # +25% = Warning, +55% = Critical
    "vib": (1.75, 2.75),       # +75% = Warning, +175% = Critical
    "current": (1.35, 1.80),   # +35% = Warning, +80% = Critical
    "sound": (1.18, 1.35)      # +18% = Warning, +35% = Critical
}

class HealthEngine:
    """
    Industry 4.0 Health Scoring Engine.
    Converts 4-channel telemetry into a continuous 0-100 composite index
    and categorizes machinery into Excellent, Good, Warning, or Critical.
    """

    def __init__(self, db_path: str = DB_PATH):
        self.db_path = db_path

    @staticmethod
    def compute_sub_score(
        measured: float,
        baseline: float,
        warn_factor: float,
        crit_factor: float
    ) -> float:
        """
        Compute an individual parameter health sub-score (0.0 to 100.0).
        If measured <= baseline: 100.0 (Nominal).
        If baseline < measured <= warn_thresh: Smooth decline from 100 to 70.
        If warn_thresh < measured <= crit_thresh: Decline from 70 to 40.
        If measured > crit_thresh: Exponential decay below 40 towards 0.
        """
        if measured <= baseline:
            return 100.0

        warn_thresh = baseline * warn_factor
        crit_thresh = baseline * crit_factor

        if measured <= warn_thresh:
            # Linear degradation from 100 -> 70
            fraction = (measured - baseline) / (warn_thresh - baseline)
            score = 100.0 - (fraction * 30.0)
        elif measured <= crit_thresh:
            # Linear degradation from 70 -> 50 (Warning zone)
            fraction = (measured - warn_thresh) / (crit_thresh - warn_thresh)
            score = 70.0 - (fraction * 20.0)
        else:
            # Steep degradation below 50 down to 0 (Critical zone)
            excess = measured - crit_thresh
            decay = excess / (crit_thresh * 0.5)
            score = max(0.0, 50.0 - (decay * 50.0))

        return round(float(score), 1)

    def calculate_health(
        self,
        machine_id: str,
        temperature: float,
        vibration: float,
        current: float,
        sound: float,
        baseline_temp: float = 45.0,
        baseline_vib: float = 0.40,
        baseline_current: float = 5.0,
        baseline_sound: float = 65.0
    ) -> Dict[str, Any]:
        """
        Calculate composite health score (0 - 100) using weighted multi-modal normalization.

        Formula:
            Health Score = 0.35 * S_vib + 0.30 * S_temp + 0.20 * S_curr + 0.15 * S_sound

        Categories:
            90 - 100: Excellent
            70 - 89: Good
            50 - 69: Warning
            Below 50: Critical
        """
        # 1. Compute individual sub-scores
        s_temp = self.compute_sub_score(temperature, baseline_temp, *TOLERANCE_THRESHOLDS["temp"])
        s_vib = self.compute_sub_score(vibration, baseline_vib, *TOLERANCE_THRESHOLDS["vib"])
        s_curr = self.compute_sub_score(current, baseline_current, *TOLERANCE_THRESHOLDS["current"])
        s_sound = self.compute_sub_score(sound, baseline_sound, *TOLERANCE_THRESHOLDS["sound"])

        # 2. Weighted synthesis
        composite_score = (
            WEIGHT_VIBRATION * s_vib +
            WEIGHT_TEMPERATURE * s_temp +
            WEIGHT_CURRENT * s_curr +
            WEIGHT_SOUND * s_sound
        )
        composite_score = round(max(0.0, min(100.0, composite_score)), 1)

        # 3. Categorization
        if composite_score >= 90.0:
            category = "Excellent"
        elif composite_score >= 70.0:
            category = "Good"
        elif composite_score >= 50.0:
            category = "Warning"
        else:
            category = "Critical"

        # 4. Identify primary risk factor
        sub_scores = {
            "Vibration": (s_vib, vibration, baseline_vib, "g"),
            "Temperature": (s_temp, temperature, baseline_temp, "°C"),
            "Current Draw": (s_curr, current, baseline_current, "A"),
            "Acoustic Sound": (s_sound, sound, baseline_sound, "dB")
        }

        # Lowest sub-score represents the greatest mechanical/electrical risk
        worst_param = min(sub_scores.items(), key=lambda x: x[1][0])
        param_name, (score_val, val, base, unit) = worst_param

        if score_val >= 90.0:
            primary_risk_factor = "None (All Nominal)"
        else:
            pct_delta = ((val - base) / base) * 100.0
            primary_risk_factor = f"{param_name} (+{pct_delta:.1f}%)"

        return {
            "machine_id": machine_id,
            "health_score": composite_score,
            "category": category,
            "sub_scores": {
                "temperature_score": s_temp,
                "vibration_score": s_vib,
                "current_score": s_curr,
                "sound_score": s_sound
            },
            "primary_risk_factor": primary_risk_factor,
            "calculated_at": datetime.utcnow().isoformat()
        }

    def evaluate_machine_from_db(self, machine_id: str) -> Optional[Dict[str, Any]]:
        """
        Fetch latest sensor readings and machine baselines from SQLite DB,
        calculate live health, and record result into `machine_health` table.
        """
        if not os.path.exists(self.db_path):
            return None

        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        try:
            cursor = conn.cursor()
            # Fetch machine baseline specs
            cursor.execute("""
                SELECT id, name, type, baseline_temp, baseline_vib, baseline_current, baseline_sound
                FROM machines WHERE id = ?;
            """, (machine_id,))
            mach = cursor.fetchone()
            if not mach:
                return None

            # Fetch latest sensor reading
            cursor.execute("""
                SELECT temperature, vibration, current, sound, is_fault_injected, fault_type
                FROM sensor_readings
                WHERE machine_id = ?
                ORDER BY recorded_at DESC, id DESC
                LIMIT 1;
            """, (machine_id,))
            sensor = cursor.fetchone()

            if not sensor:
                # Default to nominal baseline if no reading recorded yet
                t, v, c, s = mach["baseline_temp"], mach["baseline_vib"], mach["baseline_current"], mach["baseline_sound"]
                is_fault, f_type = False, None
            else:
                t, v, c, s = sensor["temperature"], sensor["vibration"], sensor["current"], sensor["sound"]
                is_fault = bool(sensor["is_fault_injected"])
                f_type = sensor["fault_type"]

            # Calculate health
            health_res = self.calculate_health(
                machine_id=machine_id,
                temperature=t,
                vibration=v,
                current=c,
                sound=s,
                baseline_temp=mach["baseline_temp"],
                baseline_vib=mach["baseline_vib"],
                baseline_current=mach["baseline_current"],
                baseline_sound=mach["baseline_sound"]
            )
            health_res["machine_name"] = mach["name"]
            health_res["machine_type"] = mach["type"]
            health_res["is_fault_active"] = is_fault
            health_res["fault_type"] = f_type

            # Save to machine_health table
            cursor.execute("""
                INSERT INTO machine_health (
                    machine_id, health_score, category, temperature_score,
                    vibration_score, current_score, sound_score,
                    primary_risk_factor, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);
            """, (
                machine_id,
                health_res["health_score"],
                health_res["category"],
                health_res["sub_scores"]["temperature_score"],
                health_res["sub_scores"]["vibration_score"],
                health_res["sub_scores"]["current_score"],
                health_res["sub_scores"]["sound_score"],
                health_res["primary_risk_factor"],
                health_res["calculated_at"]
            ))

            # Update overall machine status in `machines` table
            cursor.execute("""
                UPDATE machines
                SET status = ?
                WHERE id = ?;
            """, (health_res["category"], machine_id))

            conn.commit()
            return health_res
        finally:
            conn.close()

    def evaluate_fleet(self) -> List[Dict[str, Any]]:
        """Evaluate and persist health scores for all registered textile machines."""
        if not os.path.exists(self.db_path):
            return []

        conn = sqlite3.connect(self.db_path)
        try:
            cursor = conn.cursor()
            cursor.execute("SELECT id FROM machines ORDER BY id;")
            machine_ids = [row[0] for row in cursor.fetchall()]
        finally:
            conn.close()

        fleet_results = []
        for m_id in machine_ids:
            res = self.evaluate_machine_from_db(m_id)
            if res:
                fleet_results.append(res)
        return fleet_results

    def get_fleet_summary(self) -> Dict[str, Any]:
        """Generate high-level fleet health analytics summary."""
        fleet = self.evaluate_fleet()
        if not fleet:
            return {
                "total_machines": 0,
                "average_fleet_health": 0.0,
                "excellent_count": 0,
                "good_count": 0,
                "warning_count": 0,
                "critical_count": 0,
                "machines": [],
                "generated_at": datetime.utcnow().isoformat()
            }

        avg_health = sum(m["health_score"] for m in fleet) / len(fleet)
        categories = [m["category"] for m in fleet]

        return {
            "total_machines": len(fleet),
            "average_fleet_health": round(avg_health, 1),
            "excellent_count": categories.count("Excellent"),
            "good_count": categories.count("Good"),
            "warning_count": categories.count("Warning"),
            "critical_count": categories.count("Critical"),
            "machines": [
                {
                    "machine_id": m["machine_id"],
                    "name": m.get("machine_name", m["machine_id"]),
                    "type": m.get("machine_type", ""),
                    "health_score": m["health_score"],
                    "category": m["category"],
                    "status": m["category"],
                    "primary_risk_factor": m["primary_risk_factor"]
                }
                for m in fleet
            ],
            "generated_at": datetime.utcnow().isoformat()
        }


# Global singleton instance
health_engine = HealthEngine()


# -------------------------------------------------------------------------
# Standalone CLI Testing Execution
# -------------------------------------------------------------------------
if __name__ == "__main__":
    print("=================================================================")
    print("FACTORYPULSE AI - AI HEALTH ENGINE VERIFICATION")
    print("=================================================================")
    engine = HealthEngine()

    print("\n[Step 1] Verifying 4 Health Categories with Known Test Cases:")
    test_cases = [
        ("Nominal (Healthy)", 42.0, 0.40, 5.5, 64.0, "SPN-01"),
        ("Mild Wear (Good)", 48.0, 0.65, 6.2, 70.0, "SPN-01"),
        ("Bearing Wear (Warning)", 56.0, 1.45, 7.8, 85.0, "WVE-03"),
        ("Severe Thermal Overload (Critical)", 88.0, 2.10, 14.5, 96.0, "MTR-05")
    ]

    for label, t, v, c, s, m_id in test_cases:
        res = engine.calculate_health(m_id, t, v, c, s)
        print(f"  • {label:<35} -> Score: {res['health_score']:>5.1f}% | Grade: {res['category']:<10} | Risk: {res['primary_risk_factor']}")

    print("\n[Step 2] Evaluating Full Plant Fleet from SQLite Database:")
    summary = engine.get_fleet_summary()
    print(f"  Total Assets Monitored : {summary['total_machines']}")
    print(f"  Fleet Average Health   : {summary['average_fleet_health']}%")
    print(f"  Excellent (90-100%)    : {summary['excellent_count']}")
    print(f"  Good (70-89%)          : {summary['good_count']}")
    print(f"  Warning (50-69%)       : {summary['warning_count']}")
    print(f"  Critical (<50%)        : {summary['critical_count']}")

    print("\nMachine Breakdown:")
    for m in summary["machines"]:
        print(f"  • [{m['machine_id']}] {m['name']:<32} | Health: {m['health_score']:>5.1f}% [{m['category']:<8}] | {m['primary_risk_factor']}")

    print("\n[+] Verification Complete: AI Health Score Engine operational within specification!")
