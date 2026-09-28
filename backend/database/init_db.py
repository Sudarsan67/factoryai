"""
FactoryPulse AI - Database Initialization & Seed Script
Subtitle: AI Maintenance Co-Pilot for Textile MSMEs
Phase 2: SQLite Schema Builder & Sample Data Seeder
"""

import sqlite3
import os
import json
from datetime import datetime, timedelta

DB_PATH = os.path.join(os.path.dirname(__file__), "factorypulse.db")
SCHEMA_PATH = os.path.join(os.path.dirname(__file__), "schema.sql")

def get_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.execute("PRAGMA foreign_keys = ON;")
    conn.execute("PRAGMA journal_mode = WAL;")
    conn.row_factory = sqlite3.Row
    return conn

def init_database():
    print(f"[*] Initializing FactoryPulse AI SQLite database at: {DB_PATH}")
    with open(SCHEMA_PATH, "r", encoding="utf-8") as f:
        schema_sql = f.read()

    with get_connection() as conn:
        conn.executescript(schema_sql)
        print("[+] Tables and indexes successfully created.")

def seed_sample_records():
    print("[*] Seeding sample Industry 4.0 textile records...")
    now = datetime.utcnow()

    with get_connection() as conn:
        cursor = conn.cursor()

        # -------------------------------------------------------------
        # 1. Seed users
        # -------------------------------------------------------------
        users_data = [
            ("usr-001", "Murugan Sundaram", "murugan@textilemill.in", "Mill Owner", "+919842100001", "ta", 1, now),
            ("usr-002", "Rajesh Kumar", "rajesh.maint@textilemill.in", "Maintenance Supervisor", "+919842100002", "en", 1, now),
            ("usr-003", "Amit Verma", "amit.tech@textilemill.in", "Floor Technician", "+919842100003", "hi", 1, now)
        ]
        cursor.executemany("""
            INSERT OR REPLACE INTO users (id, full_name, email, role, whatsapp_number, preferred_language, is_active, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?);
        """, users_data)

        # -------------------------------------------------------------
        # 2. Seed machines (6 primary textile assets)
        # -------------------------------------------------------------
        machines_data = [
            (
                "SPN-01", "Spinning Machine (Rotor/Ring)", "Spinning Machine", "Ring Spinning Shed A",
                45.0, 42.0, 0.40, 5.5, 64.0, "Rieter Textile", 2019, "Healthy",
                (now - timedelta(days=750)).isoformat(), (now - timedelta(days=12)).isoformat()
            ),
            (
                "WVE-03", "Air Jet Weaving Loom", "Weaving Loom", "Weaving Shed B",
                18.5, 48.0, 0.45, 6.0, 68.0, "Toyota Industries", 2021, "Warning",
                (now - timedelta(days=420)).isoformat(), (now - timedelta(days=35)).isoformat()
            ),
            (
                "KNT-02", "Circular Knitting Machine", "Knitting Machine", "Knitting Unit 1",
                11.0, 44.0, 0.35, 4.2, 60.0, "Mayer & Cie", 2020, "Healthy",
                (now - timedelta(days=550)).isoformat(), (now - timedelta(days=8)).isoformat()
            ),
            (
                "DYE-04", "High-Temp Dyeing Machine", "Dyeing Machine", "Wet Processing Bay",
                30.0, 52.0, 0.50, 7.0, 66.0, "Fongs National", 2018, "Healthy",
                (now - timedelta(days=890)).isoformat(), (now - timedelta(days=19)).isoformat()
            ),
            (
                "MTR-05", "Carding Main Drive Motor (25HP)", "Industrial Motor", "Blowroom Section",
                18.7, 46.0, 0.42, 5.2, 65.0, "ABB Drives", 2022, "Critical",
                (now - timedelta(days=310)).isoformat(), (now - timedelta(days=45)).isoformat()
            ),
            (
                "CMP-06", "Pneumatic Loom Compressor", "Compressor", "Utility Plant",
                37.0, 50.0, 0.48, 8.0, 70.0, "Atlas Copco", 2019, "Warning",
                (now - timedelta(days=620)).isoformat(), (now - timedelta(days=28)).isoformat()
            )
        ]
        cursor.executemany("""
            INSERT OR REPLACE INTO machines (
                id, name, type, location_section, rated_power_kw, baseline_temp,
                baseline_vib, baseline_current, baseline_sound, manufacturer, model_year,
                status, installed_at, last_serviced_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
        """, machines_data)

        # -------------------------------------------------------------
        # 3. Seed machine_health
        # -------------------------------------------------------------
        health_data = [
            ("SPN-01", 94.5, "Excellent", 96.0, 93.0, 95.0, 94.0, "None", now.isoformat()),
            ("WVE-03", 64.2, "Warning", 72.0, 55.0, 68.0, 62.0, "Vibration (+35%)", now.isoformat()),
            ("KNT-02", 96.0, "Excellent", 97.0, 96.0, 95.0, 96.0, "None", now.isoformat()),
            ("DYE-04", 91.0, "Excellent", 90.0, 92.0, 91.0, 91.0, "None", now.isoformat()),
            ("MTR-05", 42.5, "Critical", 38.0, 44.0, 41.0, 47.0, "Motor Overheating & Current Spike", now.isoformat()),
            ("CMP-06", 67.8, "Warning", 65.0, 70.0, 66.0, 70.0, "Pressure Overload", now.isoformat())
        ]
        cursor.executemany("""
            INSERT INTO machine_health (
                machine_id, health_score, category, temperature_score, vibration_score,
                current_score, sound_score, primary_risk_factor, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);
        """, health_data)

        # -------------------------------------------------------------
        # 4. Seed sensor_readings (5s telemetry stream)
        # -------------------------------------------------------------
        readings_data = [
            # SPN-01: Healthy
            ("SPN-01", 42.4, 0.41, 5.7, 64.2, 0, None, (now - timedelta(seconds=15)).isoformat()),
            ("SPN-01", 42.8, 0.43, 5.8, 64.8, 0, None, (now - timedelta(seconds=10)).isoformat()),
            ("SPN-01", 42.5, 0.42, 5.8, 64.5, 0, None, now.isoformat()),

            # WVE-03: Bearing Wear Fault
            ("WVE-03", 66.5, 1.38, 8.8, 82.5, 1, "Bearing Wear", (now - timedelta(seconds=15)).isoformat()),
            ("WVE-03", 67.4, 1.42, 9.0, 83.7, 1, "Bearing Wear", (now - timedelta(seconds=10)).isoformat()),
            ("WVE-03", 68.2, 1.45, 9.2, 84.1, 1, "Bearing Wear", now.isoformat()),

            # MTR-05: Critical Overheating & High Current
            ("MTR-05", 86.2, 2.05, 13.8, 94.5, 1, "Motor Overheating", (now - timedelta(seconds=15)).isoformat()),
            ("MTR-05", 87.5, 2.10, 14.0, 95.2, 1, "Motor Overheating", (now - timedelta(seconds=10)).isoformat()),
            ("MTR-05", 88.4, 2.15, 14.2, 96.0, 1, "Motor Overheating", now.isoformat()),

            # CMP-06: Warning High Current Draw
            ("CMP-06", 74.8, 1.15, 11.5, 86.5, 1, "High Current Draw", (now - timedelta(seconds=10)).isoformat()),
            ("CMP-06", 76.0, 1.20, 11.8, 88.0, 1, "High Current Draw", now.isoformat())
        ]
        cursor.executemany("""
            INSERT INTO sensor_readings (
                machine_id, temperature, vibration, current, sound,
                is_fault_injected, fault_type, recorded_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?);
        """, readings_data)

        # -------------------------------------------------------------
        # 5. Seed failure_predictions (Random Forest & Explainable AI)
        # -------------------------------------------------------------
        xai_wve03 = json.dumps({
            "primary_driver": "Vibration",
            "vibration_delta_pct": "+35.2%",
            "temperature_delta_pct": "+18.4%",
            "current_delta_pct": "+22.1%",
            "sound_delta_pct": "+12.0%",
            "explanation": "High vibration (1.45g vs 0.45g baseline) indicates progressive raceway fatigue in main drive bearing."
        })

        xai_mtr05 = json.dumps({
            "primary_driver": "Temperature & Current",
            "temperature_delta_pct": "+92.1%",
            "current_delta_pct": "+173.0%",
            "vibration_delta_pct": "+411.9%",
            "sound_delta_pct": "+47.6%",
            "explanation": "Stator coil overheating (88.4°C) with excessive current draw (14.2A) points to imminent winding insulation failure."
        })

        predictions_data = [
            ("SPN-01", "Healthy", 0.04, "None", 1850.0, "All Nominal", "{}", now.isoformat()),
            ("WVE-03", "Warning", 0.68, "Bearing Wear", 72.0, "Vibration", xai_wve03, now.isoformat()),
            ("MTR-05", "Critical", 0.89, "Motor Overheating", 8.5, "Temperature", xai_mtr05, now.isoformat()),
            ("CMP-06", "Warning", 0.61, "High Current Draw", 94.0, "Current", "{}", now.isoformat())
        ]
        cursor.executemany("""
            INSERT INTO failure_predictions (
                machine_id, prediction_label, failure_probability, predicted_fault,
                estimated_rul_hours, xai_primary_factor, xai_explanation_json, predicted_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?);
        """, predictions_data)

        # -------------------------------------------------------------
        # 6. Seed maintenance_logs (Prescriptive Co-Pilot Work Orders)
        # -------------------------------------------------------------
        maintenance_data = [
            (
                "WVE-03", "Bearing Wear on Main Sley Drive",
                "Raceway surface fatigue, lack of EP-2 lithium grease lubrication.",
                "1. Lockout/Tagout power.\n2. Inspect drive shaft bearing.\n3. Replace 6208-2RS bearing.\n4. Re-lubricate and verify alignment.",
                "High", 2.0, 800.0, "Pending", "Rajesh Kumar", None, now.isoformat()
            ),
            (
                "MTR-05", "Carding Motor Severe Stator Thermal Overload",
                "Cooling fan cowl choked with cotton lint, causing rapid heat accumulation and inter-turn shorting risk.",
                "1. Immediate emergency shutdown.\n2. Clean lint blockages from cooling ribs.\n3. Measure insulation resistance using 500V Megger.\n4. Check bearing play.",
                "Critical", 3.5, 1500.0, "In Progress", "Amit Verma", None, now.isoformat()
            )
        ]
        cursor.executemany("""
            INSERT INTO maintenance_logs (
                machine_id, problem_title, possible_cause, recommended_action,
                priority_level, estimated_repair_time_hrs, estimated_repair_cost_inr,
                status, assigned_technician, resolved_at, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
        """, maintenance_data)

        # -------------------------------------------------------------
        # 7. Seed alerts (WhatsApp Dispatch Cards)
        # -------------------------------------------------------------
        alerts_data = [
            (
                "WVE-03", "FactoryPulse Alert: Bearing Wear Detected", "Warning",
                "🚨 *FactoryPulse Alert*\n*Machine:* Air Jet Weaving Loom 3\n*Issue:* Bearing Wear\n*Health Score:* 64.2%\n*Failure Risk:* 68% (High)\n*Recommended Action:* Inspect & replace bearing within 24 hours.\n*Est. Downtime Saved:* 6 Hours (₹5,700)",
                1, "+919842100002", 0, None, None, now.isoformat()
            ),
            (
                "MTR-05", "CRITICAL ALERT: 25HP Motor Overheating", "Critical",
                "🔥 *CRITICAL SHUTDOWN WARNING*\n*Machine:* Carding Motor (Blowroom)\n*Issue:* Motor Overheating (88.4°C, 14.2A)\n*Health Score:* 42.5%\n*Failure Risk:* 89% (Imminent Breakdown)\n*Action:* Stop motor immediately. Choked cooling ribs detected.",
                1, "+919842100001", 1, "Murugan Sundaram", (now - timedelta(minutes=5)).isoformat(), (now - timedelta(minutes=15)).isoformat()
            )
        ]
        cursor.executemany("""
            INSERT INTO alerts (
                machine_id, alert_title, severity, message_content, whatsapp_dispatched,
                recipient_phone, is_acknowledged, acknowledged_by, acknowledged_at, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
        """, alerts_data)

        # -------------------------------------------------------------
        # 8. Seed cost_analysis (MSME Downtime ROI & Savings in INR)
        # -------------------------------------------------------------
        cost_data = [
            ("WVE-03", "Bearing Wear", 6.0, 12000.0, 800.0, 6500.0, 5700.0, 7.1, now.isoformat()),
            ("MTR-05", "Motor Overheating / Burnout", 14.0, 38500.0, 1500.0, 18500.0, 17000.0, 11.3, now.isoformat()),
            ("CMP-06", "Compressor High Load / Valve Leak", 5.0, 9500.0, 1200.0, 5400.0, 4200.0, 3.5, now.isoformat())
        ]
        cursor.executemany("""
            INSERT INTO cost_analysis (
                machine_id, fault_detected, expected_downtime_hrs, production_loss_inr,
                repair_cost_today_inr, repair_cost_post_failure_inr, estimated_savings_inr,
                roi_multiple, calculated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);
        """, cost_data)

        # -------------------------------------------------------------
        # 9. Seed chat_history (Conversational Plant Assistant)
        # -------------------------------------------------------------
        chat_data = [
            (
                "usr-001", "WVE-03", "Machine 3 status?",
                "Air Jet Weaving Loom 3 is currently in Warning condition with a Health Score of 64.2%. High vibration (1.45g) was detected, indicating bearing raceway wear. Proactive inspection is recommended within 24 hours.",
                "machine_status_query", 0.98, (now - timedelta(minutes=25)).isoformat()
            ),
            (
                "usr-002", None, "Any critical machines right now?",
                "Yes, 1 critical machine requires immediate attention: Carding Main Drive Motor (MTR-05) has reached 88.4°C and drawing 14.2A. Failure probability is 89%. Stator winding burnout risk.",
                "fleet_critical_query", 0.99, (now - timedelta(minutes=18)).isoformat()
            ),
            (
                "usr-001", None, "What is our business impact today?",
                "Proactive maintenance on Weaving Loom 3 and Motor 5 can save an estimated ₹22,700 in combined production loss and catastrophic repair costs, preventing 20 cumulative downtime hours.",
                "cost_impact_query", 0.97, (now - timedelta(minutes=10)).isoformat()
            )
        ]
        cursor.executemany("""
            INSERT INTO chat_history (
                user_id, machine_id, user_query, bot_response, intent_detected, confidence_score, timestamp
            ) VALUES (?, ?, ?, ?, ?, ?, ?);
        """, chat_data)

        conn.commit()
        print("[+] All 9 tables successfully populated with production-representative sample records!")

if __name__ == "__main__":
    init_database()
    seed_sample_records()
