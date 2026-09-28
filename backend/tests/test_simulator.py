"""
Unit Tests for FactoryPulse AI - IoT Sensor Simulator (Phase 3)
Verifies physical bounds, 6 machine types, 6 fault types, and healthy vs fault conditions.
"""

import unittest
import os
import sqlite3
from backend.app.services.iot_simulator import (
    IoTSimulatorEngine,
    TEXTILE_MACHINE_PROFILES,
    FAULT_SIGNATURES
)

class TestIoTSimulatorEngine(unittest.TestCase):

    def setUp(self):
        self.sim = IoTSimulatorEngine()
        self.sim.clear_all_faults()

    def test_all_six_machines_configured(self):
        """Verify all 6 textile machine types are properly registered."""
        expected_types = {
            "Spinning Machine",
            "Weaving Loom",
            "Knitting Machine",
            "Dyeing Machine",
            "Industrial Motor",
            "Compressor"
        }
        actual_types = {p.machine_type for p in self.sim.profiles.values()}
        self.assertEqual(expected_types, actual_types)
        self.assertEqual(len(self.sim.profiles), 6)

    def test_all_six_fault_types_configured(self):
        """Verify all 6 fault types are defined with valid signature delta envelopes."""
        expected_faults = {
            "Motor Overheating",
            "Bearing Wear",
            "High Current Draw",
            "Excessive Noise",
            "Misalignment",
            "Loose Components"
        }
        self.assertEqual(set(FAULT_SIGNATURES.keys()), expected_faults)
        for fault_name, sig in FAULT_SIGNATURES.items():
            self.assertIn("temp_delta", sig)
            self.assertIn("vib_delta", sig)
            self.assertIn("current_delta", sig)
            self.assertIn("sound_delta", sig)

    def test_sensor_bounds_healthy_condition(self):
        """Verify healthy condition readings stay within bounds."""
        for _ in range(20):  # Test across multiple simulation ticks
            readings = self.sim.tick(save_to_db=False)
            self.assertEqual(len(readings), 6)
            for r in readings:
                self.assertFalse(r["is_fault_injected"])
                self.assertIsNone(r["fault_type"])
                # Sensor limits:
                # Temperature: 35°C - 90°C
                # Vibration: 0.1g - 2.5g
                # Current: 2A - 15A
                # Sound: 50dB - 100dB
                self.assertGreaterEqual(r["temperature"], 35.0)
                self.assertLessEqual(r["temperature"], 90.0)
                self.assertGreaterEqual(r["vibration"], 0.10)
                self.assertLessEqual(r["vibration"], 2.50)
                self.assertGreaterEqual(r["current"], 2.0)
                self.assertLessEqual(r["current"], 15.0)
                self.assertGreaterEqual(r["sound"], 50.0)
                self.assertLessEqual(r["sound"], 100.0)

    def test_fault_injection_bearing_wear(self):
        """Verify Bearing Wear injects high vibration and elevated sound."""
        m_id = "WVE-03"
        self.sim.inject_fault(m_id, "Bearing Wear")
        # Let thermal and vibration state converge over several ticks
        for _ in range(5):
            readings = self.sim.tick(save_to_db=False)

        wve = next(x for x in readings if x["machine_id"] == m_id)
        self.assertTrue(wve["is_fault_injected"])
        self.assertEqual(wve["fault_type"], "Bearing Wear")
        # Bearing wear should exhibit high vibration (> 1.0g) compared to 0.45g baseline
        self.assertGreater(wve["vibration"], 1.0)
        # Verify strict clamping is maintained
        self.assertLessEqual(wve["vibration"], 2.50)

    def test_fault_injection_motor_overheating(self):
        """Verify Motor Overheating causes rapid temperature buildup & high current."""
        m_id = "MTR-05"
        self.sim.inject_fault(m_id, "Motor Overheating")
        for _ in range(10):
            readings = self.sim.tick(save_to_db=False)

        mtr = next(x for x in readings if x["machine_id"] == m_id)
        self.assertTrue(mtr["is_fault_injected"])
        self.assertEqual(mtr["fault_type"], "Motor Overheating")
        self.assertGreater(mtr["temperature"], 65.0)
        self.assertGreater(mtr["current"], 7.0)

    def test_fault_injection_high_current_draw(self):
        """Verify High Current Draw injects current escalation."""
        m_id = "CMP-06"
        self.sim.inject_fault(m_id, "High Current Draw")
        for _ in range(5):
            readings = self.sim.tick(save_to_db=False)

        cmp = next(x for x in readings if x["machine_id"] == m_id)
        self.assertTrue(cmp["is_fault_injected"])
        self.assertGreater(cmp["current"], 10.0)

    def test_clear_fault_returns_to_healthy(self):
        """Verify clearing a fault resets the machine status."""
        m_id = "SPN-01"
        self.sim.inject_fault(m_id, "Misalignment")
        self.sim.tick(save_to_db=False)
        self.assertTrue(self.sim.active_faults[m_id] == "Misalignment")

        self.sim.clear_fault(m_id)
        reading = self.sim.generate_single_reading(m_id)
        self.assertFalse(reading["is_fault_injected"])
        self.assertIsNone(reading["fault_type"])

if __name__ == "__main__":
    unittest.main()
