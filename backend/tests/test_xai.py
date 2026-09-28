"""
Unit Tests for FactoryPulse AI - Explainable AI (XAI) Engine (Phase 6)
Subtitle: AI Maintenance Co-Pilot for Textile MSMEs

Verifies:
1. Deviation percentage calculation: ((actual - normal) / normal) * 100
2. Physical root-cause attribution logic
3. Normalized sensor contribution weights (sum to 1.0)
4. Natural language explanation string generation
5. Severity categorization (Nominal, Elevated, Warning, Critical)
6. SQLite database integration & baseline lookups
"""

import unittest
import os
import sys
import sqlite3

# Ensure repo root is in python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

from backend.app.services.xai_engine import (
    get_machine_baseline,
    compute_sensor_deviation,
    explain_machine_telemetry,
    explain_machine_from_db,
    DEFAULT_BASELINES,
    DB_PATH
)


class TestExplainableAIEngine(unittest.TestCase):

    def test_baseline_lookup(self):
        """Ensure all 6 textile machines have registered baselines."""
        for machine_id in ["SPN-01", "WVE-03", "KNT-02", "DYE-04", "MTR-05", "CMP-06"]:
            base = get_machine_baseline(machine_id)
            self.assertEqual(base["id"], machine_id)
            self.assertGreater(base["temp"], 30.0)
            self.assertGreater(base["vib"], 0.2)
            self.assertGreater(base["current"], 3.0)
            self.assertGreater(base["sound"], 50.0)

    def test_deviation_formula_exactness(self):
        """Formula ((actual - normal) / normal) * 100 must be mathematically exact."""
        # Baseline vib = 0.40, Actual = 1.00 -> (1.00 - 0.40) / 0.40 * 100 = 150.0%
        item = compute_sensor_deviation("Vibration", 1.00, 0.40, "g", 1.5)
        self.assertAlmostEqual(item["deviation_percent"], 150.0, places=1)
        self.assertEqual(item["severity"], "Critical")

        # Baseline temp = 50.0, Actual = 60.0 -> (60.0 - 50.0) / 50.0 * 100 = 20.0%
        item2 = compute_sensor_deviation("Temperature", 60.0, 50.0, "°C", 1.3)
        self.assertAlmostEqual(item2["deviation_percent"], 20.0, places=1)
        self.assertEqual(item2["severity"], "Elevated")

    def test_nominal_telemetry_explanation(self):
        """Normal telemetry should result in Nominal status, is_at_risk=False, and healthy summary."""
        exp = explain_machine_telemetry(
            machine_id="WVE-03",
            temperature=48.5,
            vibration=0.46,
            current=6.1,
            sound=69.0
        )
        self.assertFalse(exp["is_at_risk"])
        self.assertEqual(exp["risk_level"], "Nominal")
        self.assertIn("within normal parameters", exp["human_readable_summary"].lower())
        self.assertEqual(len(exp["sensor_deviations"]), 4)

    def test_bearing_wear_attribution(self):
        """High vibration spike on loom should trigger Bearing Degradation diagnosis."""
        exp = explain_machine_telemetry(
            machine_id="WVE-03",
            temperature=54.0,
            vibration=1.55,  # 0.45 baseline -> +244.4%
            current=6.8,
            sound=84.0
        )
        self.assertTrue(exp["is_at_risk"])
        self.assertEqual(exp["top_contributing_sensor"], "Vibration")
        self.assertGreater(exp["top_deviation_percent"], 200.0)
        self.assertIn("Bearing", exp["diagnosed_root_cause"])
        self.assertIn("Machine at risk", exp["human_readable_summary"])
        self.assertIn("244", exp["human_readable_summary"])
        self.assertIn("Inspect drive bearing", exp["immediate_prescriptive_action"])

    def test_motor_overheating_attribution(self):
        """Elevated temperature + current should diagnose Motor Stator Thermal Overload."""
        exp = explain_machine_telemetry(
            machine_id="MTR-05",  # Carding Motor (baseTemp=46, baseCurrent=5.2)
            temperature=78.0,     # +69.6%
            vibration=0.52,
            current=9.5,          # +82.7%
            sound=70.0
        )
        self.assertTrue(exp["is_at_risk"])
        self.assertIn("Motor", exp["diagnosed_root_cause"])
        self.assertIn("insulation", exp["technical_rationale"].lower())
        self.assertIn("cooling fan", exp["immediate_prescriptive_action"].lower())

    def test_contribution_weights_sum_to_one(self):
        """Contribution weights across 4 channels must sum to approximately 1.0 (100%)."""
        exp = explain_machine_telemetry(
            machine_id="SPN-01",
            temperature=62.0,
            vibration=1.1,
            current=8.5,
            sound=78.0
        )
        total_weight = sum(item["contribution_weight"] for item in exp["sensor_deviations"])
        self.assertAlmostEqual(total_weight, 1.0, places=2)

    def test_sqlite_fallback_and_query(self):
        """Verify DB integration works or safely falls back if table is empty."""
        exp = explain_machine_from_db("SPN-01")
        self.assertIsNotNone(exp)
        self.assertEqual(exp["machine_id"], "SPN-01")
        self.assertEqual(len(exp["sensor_deviations"]), 4)


if __name__ == "__main__":
    unittest.main()
