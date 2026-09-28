"""
Unit Tests for FactoryPulse AI - Smart Alerts & Financial ROI Cost Analysis (Phase 8)
Subtitle: AI Maintenance Co-Pilot for Textile MSMEs

Verifies:
1. Economic formulas: Net Savings = Catastrophic Loss - Proactive Cost
2. ROI Multiples (> 7x for textile machinery assets)
3. Fleet-wide ROI aggregate calculation
4. WhatsApp alert formatting in English, Tamil, and Hindi
5. SQLite Table 6 (alerts) dispatch & acknowledgment
6. SQLite Table 7 (cost_analysis) calculation & persistence
"""

import unittest
import os
import sys
import sqlite3

# Ensure repo root is in python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

from backend.app.services.alert_cost_engine import (
    calculate_machine_roi,
    get_fleet_roi_summary,
    format_whatsapp_alert_message,
    dispatch_smart_alert,
    acknowledge_alert,
    get_all_alerts,
    record_cost_analysis,
    MACHINE_ECONOMICS,
    DB_PATH
)


class TestAlertAndCostEngine(unittest.TestCase):

    def test_machine_roi_equations(self):
        """Verify mathematical integrity of the Financial ROI calculator."""
        # WVE-03 Air Jet Weaving Loom
        roi = calculate_machine_roi("WVE-03")
        self.assertEqual(roi["machine_id"], "WVE-03")
        self.assertGreater(roi["net_savings_inr"], 50000.0)
        self.assertGreater(roi["roi_multiple"], 7.0)
        self.assertGreater(roi["downtime_saved_hrs"], 15.0)

        # Expected:
        # Catastrophic: 24h * 2500 + 52000 = 60000 + 52000 = 112,000 INR
        # Preventive: 2.5h * 2500 + 3500 = 6250 + 3500 = 9,750 INR
        # Net savings: 112000 - 9750 = 102,250 INR
        # ROI: 102250 / 9750 = ~10.49x
        self.assertAlmostEqual(roi["total_catastrophic_loss_inr"], 112000.0, places=0)
        self.assertAlmostEqual(roi["total_preventive_cost_inr"], 9750.0, places=0)
        self.assertAlmostEqual(roi["net_savings_inr"], 102250.0, places=0)
        self.assertAlmostEqual(roi["roi_multiple"], 10.49, places=1)

    def test_custom_roi_simulation(self):
        """Verify custom what-if financial parameters can be applied."""
        custom_roi = calculate_machine_roi(
            machine_id="SPN-01",
            custom_hourly_loss=5000.0,
            custom_unplanned_hrs=30.0,
            custom_catastrophic_cost=80000.0,
            custom_preventive_cost=5000.0,
            custom_preventive_hrs=3.0
        )
        # Catastrophic: 30 * 5000 + 80000 = 230,000
        # Preventive: 3 * 5000 + 5000 = 20,000
        # Savings: 210,000 INR | ROI: 210000 / 20000 = 10.5x
        self.assertEqual(custom_roi["total_catastrophic_loss_inr"], 230000.0)
        self.assertEqual(custom_roi["total_preventive_cost_inr"], 20000.0)
        self.assertEqual(custom_roi["net_savings_inr"], 210000.0)
        self.assertEqual(custom_roi["roi_multiple"], 10.5)

    def test_fleet_roi_summary(self):
        """Ensure fleet ROI summary aggregates all 6 textile plant assets."""
        summary = get_fleet_roi_summary()
        self.assertEqual(summary["machines_analyzed"], 6)
        self.assertGreater(summary["fleet_total_net_savings_inr"], 400000.0)
        self.assertGreater(summary["fleet_total_downtime_saved_hrs"], 80.0)
        self.assertGreater(summary["fleet_composite_roi_multiple"], 8.0)

    def test_whatsapp_formatting_multilingual(self):
        """Ensure WhatsApp text formats correctly with markdown stars and emojis."""
        msg_en = format_whatsapp_alert_message(
            machine_id="WVE-03",
            alert_title="Excessive Vibration",
            severity="Critical",
            top_factor="Vibration",
            deviation_pct=244.4,
            diagnosed_fault="Bearing Wear",
            rul_hours=14.0,
            language="en"
        )
        self.assertIn("CRITICAL ALERT", msg_en)
        self.assertIn("WVE-03", msg_en)
        self.assertIn("+244.4%", msg_en)

        msg_ta = format_whatsapp_alert_message(
            machine_id="WVE-03",
            alert_title="தாங்கி தேய்மானம்",
            severity="Critical",
            top_factor="அதிர்வு",
            deviation_pct=244.4,
            diagnosed_fault="தாங்கி தேய்மானம்",
            rul_hours=14.0,
            language="ta"
        )
        self.assertIn("தொழிற்சாலை எச்சரிக்கை", msg_ta)
        self.assertIn("WVE-03", msg_ta)

        msg_hi = format_whatsapp_alert_message(
            machine_id="WVE-03",
            alert_title="बेयरिंग खराबी",
            severity="Critical",
            top_factor="कंपन",
            deviation_pct=244.4,
            diagnosed_fault="बेयरिंग घिसाव",
            rul_hours=14.0,
            language="hi"
        )
        self.assertIn("फैक्ट्री अलर्ट", msg_hi)
        self.assertIn("WVE-03", msg_hi)

    def test_alert_dispatch_and_acknowledgment(self):
        """Test dispatching and acknowledging an alert in SQLite Table 6."""
        if not os.path.exists(DB_PATH):
            self.skipTest("Database not found")

        # 1. Dispatch
        alert = dispatch_smart_alert(
            machine_id="CMP-06",
            alert_title="Pneumatic Pressure Fluctuations",
            severity="Warning",
            language="en"
        )
        self.assertIsNotNone(alert["alert_id"])
        self.assertFalse(alert["is_acknowledged"])

        # 2. Acknowledge
        ack = acknowledge_alert(alert["alert_id"], technician="R. K. Sharma")
        self.assertEqual(ack["status"], "success")
        self.assertTrue(ack["is_acknowledged"])
        self.assertEqual(ack["acknowledged_by"], "R. K. Sharma")

    def test_cost_analysis_persistence(self):
        """Verify cost analysis inserts into SQLite Table 7."""
        if not os.path.exists(DB_PATH):
            self.skipTest("Database not found")

        record = record_cost_analysis("DYE-04")
        self.assertIsNotNone(record["id"])
        self.assertGreater(record["net_savings_inr"], 100000.0)


if __name__ == "__main__":
    unittest.main()
