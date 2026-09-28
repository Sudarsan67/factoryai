"""
Unit Tests for FactoryPulse AI - AI Health Score Engine (Phase 4)
Verifies:
- 0-100 Health Score range
- 4 Categories: Excellent (90-100), Good (70-89), Warning (50-69), Critical (<50)
- Weighted multi-factor normalization
- Primary risk factor identification
- SQLite machine_health persistence & fleet summary
"""

import unittest
import os
from backend.app.services.health_engine import (
    HealthEngine,
    WEIGHT_VIBRATION,
    WEIGHT_TEMPERATURE,
    WEIGHT_CURRENT,
    WEIGHT_SOUND
)

class TestHealthEngine(unittest.TestCase):

    def setUp(self):
        self.engine = HealthEngine()

    def test_weights_sum_to_one(self):
        """Verify the multi-modal weights normalize to 1.0."""
        total_weight = WEIGHT_VIBRATION + WEIGHT_TEMPERATURE + WEIGHT_CURRENT + WEIGHT_SOUND
        self.assertAlmostEqual(total_weight, 1.0, places=5)

    def test_excellent_category(self):
        """Nominal readings should yield an Excellent score (90-100)."""
        res = self.engine.calculate_health(
            machine_id="SPN-01",
            temperature=42.0,   # baseline: 45.0
            vibration=0.38,     # baseline: 0.40
            current=5.0,        # baseline: 5.0
            sound=64.0,         # baseline: 65.0
            baseline_temp=45.0,
            baseline_vib=0.40,
            baseline_current=5.0,
            baseline_sound=65.0
        )
        self.assertGreaterEqual(res["health_score"], 90.0)
        self.assertLessEqual(res["health_score"], 100.0)
        self.assertEqual(res["category"], "Excellent")
        self.assertEqual(res["primary_risk_factor"], "None (All Nominal)")

    def test_good_category(self):
        """Slight degradation should yield Good category (70-89)."""
        res = self.engine.calculate_health(
            machine_id="WVE-03",
            temperature=52.0,   # +8.3% over 48.0
            vibration=0.62,     # +37% over 0.45
            current=6.6,        # +10% over 6.0
            sound=72.0,         # +5.8% over 68.0
            baseline_temp=48.0,
            baseline_vib=0.45,
            baseline_current=6.0,
            baseline_sound=68.0
        )
        self.assertGreaterEqual(res["health_score"], 70.0)
        self.assertLess(res["health_score"], 90.0)
        self.assertEqual(res["category"], "Good")

    def test_warning_category(self):
        """Bearing wear parameters should yield Warning category (50-69)."""
        res = self.engine.calculate_health(
            machine_id="WVE-03",
            temperature=62.0,   # Elevated
            vibration=1.05,     # Warning vibration (2.3x baseline)
            current=7.5,        # Elevated
            sound=78.0,         # Elevated sound
            baseline_temp=48.0,
            baseline_vib=0.45,
            baseline_current=6.0,
            baseline_sound=68.0
        )
        self.assertGreaterEqual(res["health_score"], 50.0)
        self.assertLess(res["health_score"], 70.0)
        self.assertEqual(res["category"], "Warning")
        self.assertIn("Vibration", res["primary_risk_factor"])

    def test_critical_category(self):
        """Severe thermal overload should drop health score below 50 (Critical)."""
        res = self.engine.calculate_health(
            machine_id="MTR-05",
            temperature=88.5,   # Critical (+92% over 46°C)
            vibration=2.15,     # Critical (+411% over 0.42g)
            current=14.5,       # Critical (+178% over 5.2A)
            sound=96.0,         # Critical (+47% over 65dB)
            baseline_temp=46.0,
            baseline_vib=0.42,
            baseline_current=5.2,
            baseline_sound=65.0
        )
        self.assertLess(res["health_score"], 50.0)
        self.assertEqual(res["category"], "Critical")

    def test_fleet_evaluation(self):
        """Verify fleet evaluation across database machines."""
        summary = self.engine.get_fleet_summary()
        self.assertGreaterEqual(summary["total_machines"], 6)
        self.assertGreaterEqual(summary["average_fleet_health"], 0.0)
        self.assertLessEqual(summary["average_fleet_health"], 100.0)
        total_categorized = (
            summary["excellent_count"] +
            summary["good_count"] +
            summary["warning_count"] +
            summary["critical_count"]
        )
        self.assertEqual(total_categorized, summary["total_machines"])

if __name__ == "__main__":
    unittest.main()
