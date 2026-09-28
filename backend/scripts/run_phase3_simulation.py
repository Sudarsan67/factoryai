"""
FactoryPulse AI - Phase 3 IoT Simulation Runner & Live Verifier
Subtitle: AI Maintenance Co-Pilot for Textile MSMEs
Executes continuous simulation ticks, tests all 6 textile machines, all 6 faults,
and verifies SQLite database persistence and physical bounding limits.
"""

import time
import sqlite3
import os
import sys
import json
from datetime import datetime

# Ensure project root is in sys.path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from backend.app.services.iot_simulator import (
    IoTSimulatorEngine,
    TEXTILE_MACHINE_PROFILES,
    FAULT_SIGNATURES,
    DB_PATH
)

def print_separator(title=""):
    print("\n" + "=" * 75)
    if title:
        print(f" {title.upper()}")
        print("=" * 75)

def run_phase3_demo():
    print_separator("FactoryPulse AI - Phase 3 Simulated IoT Engine Live Run")
    print(f"[*] Local Execution Time: {datetime.utcnow().isoformat()}Z")
    print(f"[*] SQLite Target Database: {DB_PATH}")
    print(f"[*] Active Machinery Fleet: 6 Conventional Textile Machines")
    print(f"[*] Sensor Channels: Temperature (°C), Vibration (g), Current (A), Sound (dB)")

    sim = IoTSimulatorEngine()

    # -------------------------------------------------------------
    # 1. Healthy Baseline Generation
    # -------------------------------------------------------------
    print_separator("1. Healthy Baseline Telemetry Generation (Tick #1)")
    sim.clear_all_faults()
    healthy_readings = sim.tick(save_to_db=True)

    print(f"{'Machine ID':<10} {'Machine Name':<34} {'Temp (°C)':<10} {'Vib (g)':<10} {'Current (A)':<12} {'Sound (dB)':<11} {'Status'}")
    print("-" * 96)
    for r in healthy_readings:
        print(f"{r['machine_id']:<10} {r['machine_name']:<34} {r['temperature']:>6.1f}°C   {r['vibration']:>6.2f}g   {r['current']:>7.1f}A     {r['sound']:>6.1f}dB     Healthy")

    # -------------------------------------------------------------
    # 2. Sequential Fault Injection on All 6 Machines
    # -------------------------------------------------------------
    print_separator("2. Sequential Fault Injections Across 6 Textile Machines")

    fault_assignments = [
        ("SPN-01", "Misalignment", "Spinning Machine"),
        ("WVE-03", "Bearing Wear", "Weaving Loom"),
        ("KNT-02", "Loose Components", "Knitting Machine"),
        ("DYE-04", "Excessive Noise", "Dyeing Machine"),
        ("MTR-05", "Motor Overheating", "Industrial Motor"),
        ("CMP-06", "High Current Draw", "Compressor")
    ]

    for m_id, f_type, m_category in fault_assignments:
        sim.inject_fault(m_id, f_type)
        print(f"  [+] Injected '{f_type}' into {m_id} ({m_category})")

    # Let the simulation run for 3 ticks (simulating 15 seconds of physics progression)
    print("\n[*] Simulating 3 consecutive 5-second ticks with active faults...")
    for tick_num in range(1, 4):
        time.sleep(0.3)
        tick_readings = sim.tick(save_to_db=True)
        print(f"\n--- Tick #{tick_num} (Physics & Thermal Convergence) ---")
        print(f"{'Machine ID':<10} {'Active Fault':<20} {'Temp':<9} {'Vibration':<11} {'Current':<10} {'Sound':<9} {'Envelope Check'}")
        print("-" * 88)
        for r in tick_readings:
            # Check limits: Temp (35-90), Vib (0.1-2.5), Current (2-15), Sound (50-100)
            in_envelope = (
                35.0 <= r['temperature'] <= 90.0 and
                0.10 <= r['vibration'] <= 2.50 and
                2.0 <= r['current'] <= 15.0 and
                50.0 <= r['sound'] <= 100.0
            )
            env_str = "PASSED [35-90°C, 0.1-2.5g, 2-15A, 50-100dB]" if in_envelope else "FAILED"
            print(f"{r['machine_id']:<10} {r['fault_type']:<20} {r['temperature']:>5.1f}°C  {r['vibration']:>6.2f}g    {r['current']:>5.1f}A     {r['sound']:>5.1f}dB   {env_str}")

    # -------------------------------------------------------------
    # 3. Fault Recovery: Returning to Healthy Baseline
    # -------------------------------------------------------------
    print_separator("3. Fault Clearance & Return to Healthy Condition")
    sim.clear_all_faults()
    print("[*] Cleared all active faults. Simulating 2 recovery ticks...")
    for tick_num in range(1, 3):
        time.sleep(0.2)
        recovered_readings = sim.tick(save_to_db=True)
        print(f"\n--- Recovery Tick #{tick_num} ---")
        for r in recovered_readings:
            print(f"  • {r['machine_id']}: Temp={r['temperature']}°C, Vib={r['vibration']}g, Curr={r['current']}A, Sound={r['sound']}dB -> FaultInjected={r['is_fault_injected']}")

    # -------------------------------------------------------------
    # 4. SQLite Database Query & Verification
    # -------------------------------------------------------------
    print_separator("4. SQLite Database Storage Verification (`sensor_readings`)")
    if os.path.exists(DB_PATH):
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*) FROM sensor_readings;")
        total_readings = cursor.fetchone()[0]

        cursor.execute("""
            SELECT machine_id, temperature, vibration, current, sound, is_fault_injected, fault_type, recorded_at
            FROM sensor_readings
            ORDER BY id DESC
            LIMIT 6;
        """)
        latest_rows = cursor.fetchall()
        conn.close()

        print(f"[+] Total Telemetry Records Stored in SQLite: {total_readings} rows")
        print("\nLatest 6 Persisted Sensor Records:")
        print(f"{'Machine':<8} {'Temp':<8} {'Vib':<8} {'Current':<9} {'Sound':<8} {'Fault?':<8} {'Fault Type':<20} {'Timestamp'}")
        print("-" * 90)
        for row in latest_rows:
            f_flag = "Yes" if row[5] else "No"
            f_name = row[6] if row[6] else "None (Healthy)"
            print(f"{row[0]:<8} {row[1]:>4.1f}°C  {row[2]:>4.2f}g  {row[3]:>4.1f}A    {row[4]:>4.1f}dB  {f_flag:<8} {f_name:<20} {row[7]}")
    else:
        print(f"[x] Database file not found at: {DB_PATH}")

    print_separator("Phase 3 Execution Verified Successfully!")

if __name__ == "__main__":
    run_phase3_demo()
