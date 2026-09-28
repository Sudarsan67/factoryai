"""
Unit Tests for FactoryPulse AI - Failure Prediction Engine (Phase 5)
Verifies:
1. Model loading & serialization integrity
2. 4-channel input parsing (Temperature, Vibration, Current, Sound)
3. 3-class probability distribution (Healthy, Warning, Critical)
4. RUL curve calculation and fault diagnosis
5. SQLite failure_predictions persistence
"""

import unittest
import os
import sys
import sqlite3

# Ensure repo root is in python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

from backend.app.services.prediction_engine import (
    load_model,
    predict_machine_telemetry,
    diagnose_probable_fault,
    estimate_rul_hours,
    DB_PATH
)


class TestFailurePredictionEngine(unittest.TestCase):

    def setUp(self):
        self.model = load_model()

    def test_model_loaded(self):
        """Test model is deserialized with expected properties."""
        self.assertIsNotNone(self.model)
        self.assertEqual(len(self.model.trees), 35)
        self.assertIn("vibration", self.model.feature_names)
        self.assertIn("temperature", self.model.feature_names)

    def test_healthy_telemetry_inference(self):
        """Healthy baseline inputs should classify as Healthy with low failure risk."""
        result = predict_machine_telemetry(
            machine_id="TEST-HEALTHY",
            temperature=44.0,
            vibration=0.35,
            current=4.2,
            sound=64.0,
            persist=False
        )
        self.assertEqual(result["prediction_label"], "Healthy")
        self.assertLess(result["failure_probability"], 0.35)
        self.assertGreater(result["probabilities"]["healthy"], 0.60)
        self.assertGreater(result["estimated_rul_hours"], 500)
        self.assertEqual(result["predicted_fault"], "Normal Operating Dynamics")

    def test_critical_vibration_telemetry_inference(self):
        """Severe vibration & current inputs should classify as Critical or Warning."""
        result = predict_machine_telemetry(
            machine_id="TEST-CRITICAL-BEARING",
            temperature=76.0,
            vibration=2.25,
            current=12.5,
            sound=94.0,
            persist=False
        )
        self.assertIn(result["prediction_label"], ["Warning", "Critical"])
        self.assertGreater(result["failure_probability"], 0.60)
        self.assertLess(result["estimated_rul_hours"], 120)
        self.assertIn(result["predicted_fault"], ["Bearing Wear", "Motor Overheating", "High Current Draw", "Excessive Noise & Cavitation"])

    def test_probabilities_sum_to_one(self):
        """Probabilities across all 3 classes must sum to ~1.0."""
        result = predict_machine_telemetry(
            machine_id="TEST-PROB-SUM",
            temperature=58.0,
            vibration=1.1,
            current=7.5,
            sound=78.0,
            persist=False
        )
        probs = result["probabilities"]
        total = probs["healthy"] + probs["warning"] + probs["critical"]
        self.assertAlmostEqual(total, 1.0, places=2)
        for key in ["healthy", "warning", "critical"]:
            self.assertGreaterEqual(probs[key], 0.0)
            self.assertLessEqual(probs[key], 1.0)

    def test_database_persistence(self):
        """Prediction records should successfully write to failure_predictions in SQLite."""
        if not os.path.exists(DB_PATH):
            self.skipTest("Database not found")

        result = predict_machine_telemetry(
            machine_id="SPN-01",
            temperature=65.0,
            vibration=1.45,
            current=9.2,
            sound=82.0,
            persist=True
        )

        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        cursor.execute(
            """
            SELECT machine_id, failure_probability, predicted_fault 
            FROM failure_predictions 
            WHERE machine_id = 'SPN-01'
            ORDER BY predicted_at DESC LIMIT 1
            """
        )
        row = cursor.fetchone()
        conn.close()

        self.assertIsNotNone(row)
        self.assertEqual(row[0], "SPN-01")
        self.assertAlmostEqual(row[1], result["failure_probability"], places=2)


if __name__ == "__main__":
    unittest.main()
