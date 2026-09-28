"""
FactoryPulse AI - Explainable AI (XAI) Engine Service (Phase 6)
Subtitle: AI Maintenance Co-Pilot for Textile MSMEs

Explanation logic:
- Exact percentage deviations: ((actual - normal) / normal) * 100
- Multi-channel physical root cause attribution
- Natural language explanation generation with maintenance engineering rationales
- Prescriptive action checklists for plant technicians
"""

import os
import json
import sqlite3
from datetime import datetime
from typing import Dict, Any, List, Optional, Tuple

DB_PATH = os.path.join(os.path.dirname(__file__), "../../database/factorypulse.db")

# Default baseline profiles for textile MSME machinery
DEFAULT_BASELINES: Dict[str, Dict[str, Any]] = {
    "SPN-01": {
        "name": "Spinning Machine (Rotor/Ring)",
        "type": "Spinning Machine",
        "location": "Ring Spinning Shed A",
        "temp": 42.0,
        "vib": 0.40,
        "current": 5.5,
        "sound": 64.0
    },
    "WVE-03": {
        "name": "Air Jet Weaving Loom",
        "type": "Weaving Loom",
        "location": "Weaving Shed B",
        "temp": 48.0,
        "vib": 0.45,
        "current": 6.0,
        "sound": 68.0
    },
    "KNT-02": {
        "name": "Circular Knitting Machine",
        "type": "Knitting Machine",
        "location": "Knitting Unit 1",
        "temp": 44.0,
        "vib": 0.35,
        "current": 4.2,
        "sound": 60.0
    },
    "DYE-04": {
        "name": "High-Temp Dyeing Machine",
        "type": "Dyeing Machine",
        "location": "Wet Processing Bay",
        "temp": 52.0,
        "vib": 0.50,
        "current": 7.0,
        "sound": 66.0
    },
    "MTR-05": {
        "name": "Carding Main Drive Motor (25HP)",
        "type": "Industrial Motor",
        "location": "Blowroom Section",
        "temp": 46.0,
        "vib": 0.42,
        "current": 5.2,
        "sound": 65.0
    },
    "CMP-06": {
        "name": "Pneumatic Loom Compressor",
        "type": "Compressor",
        "location": "Utility Plant",
        "temp": 50.0,
        "vib": 0.48,
        "current": 8.0,
        "sound": 70.0
    }
}


def get_machine_baseline(machine_id: str) -> Dict[str, Any]:
    """Retrieve baseline sensor parameters from SQLite database or fallback catalog."""
    if os.path.exists(DB_PATH):
        try:
            conn = sqlite3.connect(DB_PATH)
            cursor = conn.cursor()
            cursor.execute(
                """
                SELECT id, name, type, baseline_temp, baseline_vib, baseline_current, baseline_sound, location_section
                FROM machines WHERE id = ?
                """,
                (machine_id,)
            )
            row = cursor.fetchone()
            conn.close()
            if row:
                return {
                    "id": row[0],
                    "name": row[1],
                    "type": row[2],
                    "temp": float(row[3]),
                    "vib": float(row[4]),
                    "current": float(row[5]),
                    "sound": float(row[6]),
                    "location": row[7]
                }
        except Exception as e:
            print(f"[!] Warning: error reading baseline from DB: {e}")

    # Fallback to default
    if machine_id in DEFAULT_BASELINES:
        base = DEFAULT_BASELINES[machine_id].copy()
        base["id"] = machine_id
        return base

    # Generic textile machinery baseline
    return {
        "id": machine_id,
        "name": f"Textile Asset {machine_id}",
        "type": "Textile Machinery",
        "temp": 45.0,
        "vib": 0.40,
        "current": 5.0,
        "sound": 65.0,
        "location": "Production Floor"
    }


def compute_sensor_deviation(
    sensor_name: str,
    actual: float,
    normal: float,
    unit: str,
    weight_factor: float
) -> Dict[str, Any]:
    """
    Calculate deviation percentage: ((actual - normal) / normal) * 100.
    Determines severity level and human status message.
    """
    dev_pct = round(((actual - normal) / normal) * 100.0, 1)

    if dev_pct <= 15.0:
        severity = "Nominal"
        status_msg = f"{sensor_name} is within healthy operating tolerance ({actual:.2f} {unit} vs {normal:.2f} {unit} normal)."
    elif dev_pct <= 50.0:
        severity = "Elevated"
        status_msg = f"{sensor_name} is elevated by +{dev_pct:.1f}% above baseline ({actual:.2f} {unit})."
    elif dev_pct <= 100.0:
        severity = "Warning"
        status_msg = f"{sensor_name} is +{dev_pct:.1f}% higher than baseline ({actual:.2f} {unit}), indicating abnormal stress."
    else:
        severity = "Critical"
        status_msg = f"{sensor_name} is severely elevated by +{dev_pct:.1f}% ({actual:.2f} {unit} vs {normal:.2f} {unit} baseline)!"

    # Raw risk points based on positive excess
    raw_risk = max(0.0, dev_pct) * weight_factor

    return {
        "sensor_name": sensor_name,
        "actual_value": round(actual, 2),
        "normal_value": round(normal, 2),
        "unit": unit,
        "deviation_percent": dev_pct,
        "severity": severity,
        "status_message": status_msg,
        "_raw_risk": raw_risk
    }


def diagnose_root_cause_and_actions(
    machine_type: str,
    dev_map: Dict[str, float],
    top_sensor: str,
    top_dev: float
) -> Tuple[str, str, str]:
    """
    Determine physical root cause, technical maintenance rationale,
    and prescriptive action based on sensor correlation patterns.
    """
    v_dev = dev_map.get("Vibration", 0.0)
    t_dev = dev_map.get("Temperature", 0.0)
    c_dev = dev_map.get("Current", 0.0)
    s_dev = dev_map.get("Sound", 0.0)

    # 1. Bearing Wear Signature (High Vibration + Acoustic High Frequencies)
    if v_dev >= 75.0 and (s_dev >= 20.0 or v_dev > t_dev):
        root_cause = "Bearing Degradation & Raceway Spalling"
        rationale = (
            f"Vibration levels (+{v_dev:.1f}%) combined with sound elevation (+{s_dev:.1f}%) "
            "indicate mechanical friction and micro-spalling on the inner/outer bearing raceways. "
            "High frequency harmonic resonance is propagating through the spindle assembly."
        )
        actions = (
            "1. Inspect drive bearing housing using acoustic probe.\n"
            "2. Verify grease condition; check for metallic flake contamination.\n"
            "3. Re-lubricate with ISO VG 220 high-temperature synthetic grease.\n"
            "4. If vibration exceeds 1.8g RMS during test spin, schedule bearing replacement during scheduled shift stop."
        )

    # 2. Motor Overheating Signature (High Temperature + Current Draw)
    elif t_dev >= 40.0 and c_dev >= 25.0:
        root_cause = "Motor Stator Thermal Overload & Insulation Stress"
        rationale = (
            f"Temperature increase of +{t_dev:.1f}% paired with +{c_dev:.1f}% current draw indicates electrical over-torque "
            "and winding resistance heat buildup. Continuous operation at this level will degrade Class F coil insulation."
        )
        actions = (
            "1. Check motor cooling fan cowl and air intake grills for lint/fiber accumulation.\n"
            "2. Measure 3-phase resistance and current balance using clamp multimeter.\n"
            "3. Inspect mechanical drive belts for overtension or slippage.\n"
            "4. Reduce machine RPM setpoint by 10% until stator surface temperature stabilizes below 60°C."
        )

    # 3. High Electrical Current / Mechanical Jam
    elif c_dev >= 50.0:
        root_cause = "Mechanical Over-Torque & Phase Load Surge"
        rationale = (
            f"Current draw is +{c_dev:.1f}% over baseline. The motor is drawing heavy inductive load "
            "overcoming excessive resistance in the yarn delivery gear train or loom beat-up mechanism."
        )
        actions = (
            "1. Manually rotate machine flywheel to feel for mechanical binding or tight spots.\n"
            "2. Inspect gearbox oil level and viscosity.\n"
            "3. Verify tensioners and yarn guides are free from wrapped selvage threads."
        )

    # 4. Acoustic Noise / Gear Chattering
    elif s_dev >= 30.0 and v_dev >= 25.0:
        root_cause = "Gear Tooth Backlash & Acoustic Resonance"
        rationale = (
            f"Acoustic emissions (+{s_dev:.1f}%) accompanied by vibration (+{v_dev:.1f}%) "
            "exhibit classic gear tooth pitting, insufficient backlash clearance, or pneumatic nozzle chattering."
        )
        actions = (
            "1. Open transmission inspection hatch; check timing belt teeth and spur gears.\n"
            "2. Verify pneumatic nozzle regulator pressure is dialed to rated bar rating.\n"
            "3. Tighten acoustic dampening mountings and panel fasteners."
        )

    # 5. Misalignment & Coupling Wear
    elif v_dev >= 50.0 and c_dev >= 20.0:
        root_cause = "Shaft Misalignment & Coupling Offset"
        rationale = (
            f"Combined vibration (+{v_dev:.1f}%) and current (+{c_dev:.1f}%) point to radial or angular "
            "misalignment between the electric motor shaft and the drive cylinder coupling."
        )
        actions = (
            "1. Perform laser alignment check between motor and main drive shaft.\n"
            "2. Inspect flexible coupling spider element for elastomeric fatigue or cracking.\n"
            "3. Torque motor foot mounting bolts to factory specifications (85 Nm)."
        )

    # 6. Mechanical Component Looseness
    elif v_dev >= 60.0:
        root_cause = "Structural Component Looseness & Anchor Slack"
        rationale = (
            f"Substantial vibration spike of +{v_dev:.1f}% without proportional thermal rise "
            "points to foundation bolt slackness, loose belt guards, or frame harmonic resonance."
        )
        actions = (
            "1. Torque all anchor bolts on machine base plate.\n"
            "2. Inspect sheet metal covers and safety guards for missing rubber dampers.\n"
            "3. Re-tighten motor bracket retaining nuts."
        )

    else:
        root_cause = "Nominal Dynamics (No Significant Anomaly)"
        rationale = (
            "All physical parameters are operating within standard textile mill tolerances. "
            "Thermal equilibrium and mechanical balance are stable."
        )
        actions = (
            "1. Continue standard operating shift schedule.\n"
            "2. Log routine visual inspection at next 8-hour shift change."
        )

    return root_cause, rationale, actions


def explain_machine_telemetry(
    machine_id: str,
    temperature: float,
    vibration: float,
    current: float,
    sound: float,
    persist_explanation: bool = False
) -> Dict[str, Any]:
    """
    Main XAI evaluation engine:
    1. Compares raw sensor inputs against baseline.
    2. Calculates ((actual - normal) / normal) * 100 for all 4 channels.
    3. Normalizes contribution weights (sum = 1.0).
    4. Diagnoses root cause and produces human-readable explanation:
       "Machine at risk: Vibration is 245% above normal, indicating bearing wear."
    5. Formulates technical rationale and step-by-step prescriptive actions.
    """
    baseline = get_machine_baseline(machine_id)

    # 4-channel deviation calculations with sensor domain weighting factors
    # Vibration: 1.5x (highest mechanical indicator in spinning/weaving)
    # Temperature: 1.3x (thermal insulation stress)
    # Current: 1.2x (electrical load / motor torque)
    # Sound: 1.0x (acoustic signature)
    dev_items = [
        compute_sensor_deviation("Vibration", vibration, baseline["vib"], "g", 1.5),
        compute_sensor_deviation("Temperature", temperature, baseline["temp"], "°C", 1.3),
        compute_sensor_deviation("Current", current, baseline["current"], "A", 1.2),
        compute_sensor_deviation("Sound", sound, baseline["sound"], "dB", 1.0),
    ]

    total_risk = sum(item["_raw_risk"] for item in dev_items)
    
    # Calculate normalized contribution weights
    for item in dev_items:
        if total_risk > 0.001:
            item["contribution_weight"] = round(item["_raw_risk"] / total_risk, 3)
        else:
            item["contribution_weight"] = 0.25
        del item["_raw_risk"]

    # Sort to find primary contributing factor
    sorted_by_dev = sorted(dev_items, key=lambda x: x["deviation_percent"], reverse=True)
    top_sensor_item = sorted_by_dev[0]
    top_sensor = top_sensor_item["sensor_name"]
    top_dev = top_sensor_item["deviation_percent"]

    # Map for easy lookup in diagnostic rules
    dev_map = {item["sensor_name"]: item["deviation_percent"] for item in dev_items}

    # Determine risk level
    is_at_risk = any(item["severity"] in ["Warning", "Critical"] for item in dev_items)
    has_critical = any(item["severity"] == "Critical" for item in dev_items)
    has_warning = any(item["severity"] == "Warning" for item in dev_items)
    has_elevated = any(item["severity"] == "Elevated" for item in dev_items)

    if has_critical:
        risk_level = "Critical"
    elif has_warning:
        risk_level = "Warning"
    elif has_elevated:
        risk_level = "Elevated"
    else:
        risk_level = "Nominal"

    # Root cause diagnosis & prescriptive actions
    root_cause, rationale, actions = diagnose_root_cause_and_actions(
        baseline["type"],
        dev_map,
        top_sensor,
        top_dev
    )

    # Human-readable summary formulation
    if is_at_risk:
        summary = (
            f"Machine at risk: {top_sensor} is {top_dev:+.1f}% above normal "
            f"({top_sensor_item['actual_value']} {top_sensor_item['unit']} vs {top_sensor_item['normal_value']} {top_sensor_item['unit']}), "
            f"indicating {root_cause.lower()}."
        )
    elif risk_level == "Elevated":
        summary = (
            f"Machine showing early stress: {top_sensor} is elevated by {top_dev:+.1f}% above normal. "
            f"Monitor trend closely to prevent transition to warning state."
        )
    else:
        summary = (
            "Machine operating within normal parameters. "
            "All sensor readings are within healthy baseline tolerances (±15%)."
        )

    explanation = {
        "machine_id": machine_id,
        "machine_name": baseline["name"],
        "machine_type": baseline["type"],
        "location": baseline.get("location", "Plant Floor"),
        "is_at_risk": is_at_risk,
        "risk_level": risk_level,
        "top_contributing_sensor": top_sensor,
        "top_deviation_percent": top_dev,
        "diagnosed_root_cause": root_cause,
        "human_readable_summary": summary,
        "technical_rationale": rationale,
        "immediate_prescriptive_action": actions,
        "sensor_deviations": dev_items,
        "generated_at": datetime.utcnow().isoformat()
    }

    # Optionally persist or update failure_predictions with XAI details
    if persist_explanation and os.path.exists(DB_PATH):
        try:
            conn = sqlite3.connect(DB_PATH)
            cursor = conn.cursor()
            cursor.execute(
                """
                UPDATE failure_predictions
                SET xai_primary_factor = ?,
                    xai_explanation_json = ?
                WHERE machine_id = ?
                  AND id = (SELECT id FROM failure_predictions WHERE machine_id = ? ORDER BY predicted_at DESC LIMIT 1)
                """,
                (
                    top_sensor,
                    json.dumps({
                        "summary": summary,
                        "deviations": dev_items,
                        "root_cause": root_cause
                    }),
                    machine_id,
                    machine_id
                )
            )
            conn.commit()
            conn.close()
        except Exception as e:
            print(f"[!] Warning: failed to update XAI in DB: {e}")

    return explanation


def explain_machine_from_db(machine_id: str) -> Dict[str, Any]:
    """Fetch latest sensor telemetry from SQLite and compute XAI explanation."""
    if not os.path.exists(DB_PATH):
        baseline = get_machine_baseline(machine_id)
        return explain_machine_telemetry(
            machine_id,
            baseline["temp"],
            baseline["vib"],
            baseline["current"],
            baseline["sound"]
        )

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute(
        """
        SELECT temperature, vibration, current, sound
        FROM sensor_readings
        WHERE machine_id = ?
        ORDER BY recorded_at DESC
        LIMIT 1
        """,
        (machine_id,)
    )
    row = cursor.fetchone()
    conn.close()

    if not row:
        baseline = get_machine_baseline(machine_id)
        return explain_machine_telemetry(
            machine_id,
            baseline["temp"],
            baseline["vib"],
            baseline["current"],
            baseline["sound"]
        )

    return explain_machine_telemetry(
        machine_id=machine_id,
        temperature=float(row[0]),
        vibration=float(row[1]),
        current=float(row[2]),
        sound=float(row[3]),
        persist_explanation=True
    )


def explain_fleet() -> List[Dict[str, Any]]:
    """Generate XAI explanations for all machinery assets in the textile plant."""
    results = []
    for machine_id in DEFAULT_BASELINES.keys():
        results.append(explain_machine_from_db(machine_id))
    return results


if __name__ == "__main__":
    print("[*] Running Explainable AI (XAI) Engine Diagnostic Demo...")
    sample = explain_machine_telemetry(
        machine_id="WVE-03",
        temperature=58.0,
        vibration=1.55,
        current=7.5,
        sound=84.0
    )
    print(f"\n[+] Machine: {sample['machine_id']} ({sample['machine_name']})")
    print(f"[+] Summary: {sample['human_readable_summary']}")
    print(f"[+] Top Factor: {sample['top_contributing_sensor']} ({sample['top_deviation_percent']:+.1f}%)")
    print(f"[+] Root Cause: {sample['diagnosed_root_cause']}")
    print("\n[-] Sensor Deviations:")
    for dev in sample["sensor_deviations"]:
        print(f"    • {dev['sensor_name']}: {dev['actual_value']} {dev['unit']} vs {dev['normal_value']} {dev['unit']} "
              f"({dev['deviation_percent']:+.1f}%) | Weight: {dev['contribution_weight']:.1%} | Severity: {dev['severity']}")
    print(f"\n[-] Prescriptive Actions:\n{sample['immediate_prescriptive_action']}")
