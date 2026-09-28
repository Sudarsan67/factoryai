"""
Unit Tests for FactoryPulse AI - Multilingual Maintenance Co-Pilot (Phase 7)
Subtitle: AI Maintenance Co-Pilot for Textile MSMEs

Verifies:
1. Automatic language detection (English, Tamil, Hindi)
2. Intent classification & confidence scoring
3. Multilingual dialogue generation in en, ta, hi
4. Prescriptive SOP retrieval
5. Work order ticket generation in SQLite Table 5 (maintenance_logs)
6. Chat history persistence in SQLite Table 8 (chat_history)
"""

import unittest
import os
import sys
import sqlite3

# Ensure repo root is in python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

from backend.app.services.copilot_engine import (
    detect_language,
    extract_machine_id,
    classify_intent,
    generate_multilingual_response,
    get_chat_history,
    log_manual_work_order,
    TEXTILE_SOPS,
    DB_PATH
)


class TestMultilingualCoPilot(unittest.TestCase):

    def test_language_detection(self):
        """Test Unicode range language detection for Tamil, Hindi, and English."""
        # Tamil
        self.assertEqual(detect_language("நெசவு இயந்திரத்தில் என்ன பிரச்சினை?"), "ta")
        self.assertEqual(detect_language("தாங்கி மாற்றுதல் வழிமுறை"), "ta")

        # Hindi
        self.assertEqual(detect_language("कताई मशीन का तापमान कितना है?"), "hi")
        self.assertEqual(detect_language("बेयरिंग खराब होने के क्या कारण हैं?"), "hi")

        # English
        self.assertEqual(detect_language("What is the vibration level on Loom WVE-03?"), "en")

    def test_machine_id_extraction(self):
        """Test entity extraction for textile machinery assets."""
        self.assertEqual(extract_machine_id("Check Loom WVE-03"), "WVE-03")
        self.assertEqual(extract_machine_id("SPN-01 temperature status"), "SPN-01")
        self.assertEqual(extract_machine_id("மோட்டார் நிலை என்ன?"), "MTR-05")
        self.assertEqual(extract_machine_id("कताई मशीन"), "SPN-01")

    def test_intent_classification(self):
        """Test NLP intent classification."""
        intent1, _ = classify_intent("How do I replace bearings on the loom?")
        self.assertEqual(intent1, "prescriptive_sop")

        intent2, _ = classify_intent("Why is machine WVE-03 vibrating so high?")
        self.assertEqual(intent2, "xai_explanation")

        intent3, _ = classify_intent("பழுது பதிவு செய்து வேலை உத்தரவு உருவாக்கவும்")
        self.assertEqual(intent3, "create_work_order")

        intent4, _ = classify_intent("What is the current temperature reading?")
        self.assertEqual(intent4, "telemetry_inquiry")

    def test_tamil_response_generation(self):
        """Test Tamil dialogue generation with textile domain vocabulary."""
        res = generate_multilingual_response(
            query="WVE-03 நெசவு இயந்திரத்தின் நிலை என்ன?",
            machine_id="WVE-03",
            language="ta",
            user_id="test-tech-ta"
        )
        self.assertEqual(res["language"], "ta")
        self.assertIn("இயந்திரம்", res["reply_text"])
        self.assertGreater(len(res["technical_bullets"]), 0)
        self.assertGreater(len(res["prescriptive_steps"]), 0)

    def test_hindi_response_generation(self):
        """Test Hindi dialogue generation with engineering vocabulary."""
        res = generate_multilingual_response(
            query="मशीन WVE-03 में कंपन क्यों बढ़ रहा है?",
            machine_id="WVE-03",
            language="hi",
            user_id="test-tech-hi"
        )
        self.assertEqual(res["language"], "hi")
        self.assertIn("मशीन", res["reply_text"])
        self.assertGreater(len(res["technical_bullets"]), 0)
        self.assertGreater(len(res["prescriptive_steps"]), 0)

    def test_english_response_generation(self):
        """Test English dialogue generation with telemetry grounding."""
        res = generate_multilingual_response(
            query="Why is WVE-03 at risk? Provide maintenance instructions.",
            machine_id="WVE-03",
            language="en",
            user_id="test-tech-en"
        )
        self.assertEqual(res["language"], "en")
        self.assertIn("WVE-03", res["reply_text"])
        self.assertGreater(len(res["technical_bullets"]), 0)

    def test_sop_catalog_completeness(self):
        """Ensure standard SOPs have complete multilingual instruction steps."""
        self.assertGreaterEqual(len(TEXTILE_SOPS), 2)
        for sop in TEXTILE_SOPS:
            self.assertIn("steps_en", sop)
            self.assertIn("steps_ta", sop)
            self.assertIn("steps_hi", sop)
            self.assertGreater(len(sop["steps_en"]), 3)
            self.assertGreater(len(sop["steps_ta"]), 3)
            self.assertGreater(len(sop["steps_hi"]), 3)

    def test_database_chat_persistence(self):
        """Verify chat interaction was committed to SQLite Table 8."""
        if not os.path.exists(DB_PATH):
            self.skipTest("Database not found")

        generate_multilingual_response(
            query="Test persistence query",
            machine_id="SPN-01",
            language="en",
            user_id="unit-test-persist"
        )

        history = get_chat_history(limit=5)
        self.assertGreater(len(history), 0)
        user_ids = [h["user_id"] for h in history]
        self.assertIn("unit-test-persist", user_ids)

    def test_manual_work_order_creation(self):
        """Verify work order creation in SQLite Table 5 (maintenance_logs)."""
        if not os.path.exists(DB_PATH):
            self.skipTest("Database not found")

        result = log_manual_work_order(
            machine_id="WVE-03",
            problem_title="Bearing Spalling & Wear",
            possible_cause="Vibration +244% above baseline",
            recommended_action="Replace spherical roller bearing with ISO VG 220 grease",
            priority="Critical",
            repair_time_hrs=3.0,
            repair_cost_inr=3200.0,
            technician="S. Ramanathan"
        )
        self.assertEqual(result["status"], "success")
        self.assertIsNotNone(result["work_order_id"])


if __name__ == "__main__":
    unittest.main()
