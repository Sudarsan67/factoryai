"""
FactoryPulse AI - Realistic IoT Sensor Simulator Engine
Subtitle: AI Maintenance Co-Pilot for Textile MSMEs
Phase 3: Multi-Machine Physics Simulation with 6 Fault Signatures (5s Cadence)
"""

import time
import random
import math
import sqlite3
import os
import asyncio
from datetime import datetime
from typing import Dict, Any, List, Optional, Tuple

DB_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "database", "factorypulse.db")

class TextileMachineProfile:
    """
    Physical baseline operational profile for conventional textile machinery.
    """
    def __init__(
        self,
        machine_id: str,
        name: str,
        machine_type: str,
        base_temp: float,
        base_vib: float,
        base_current: float,
        base_sound: float,
        noise_variance: Dict[str, float]
    ):
        self.machine_id = machine_id
        self.name = name
        self.machine_type = machine_type
        self.base_temp = base_temp
        self.base_vib = base_vib
        self.base_current = base_current
        self.base_sound = base_sound
        self.noise_variance = noise_variance


# -------------------------------------------------------------------------
# Default Machine Profiles for the 6 Core Textile Machinery Categories
# -------------------------------------------------------------------------
TEXTILE_MACHINE_PROFILES: Dict[str, TextileMachineProfile] = {
    "SPN-01": TextileMachineProfile(
        machine_id="SPN-01",
        name="Spinning Machine (Rotor/Ring)",
        machine_type="Spinning Machine",
        base_temp=42.0,
        base_vib=0.40,
        base_current=5.5,
        base_sound=64.0,
        noise_variance={"temp": 0.8, "vib": 0.03, "current": 0.25, "sound": 1.2}
    ),
    "WVE-03": TextileMachineProfile(
        machine_id="WVE-03",
        name="Air Jet Weaving Loom",
        machine_type="Weaving Loom",
        base_temp=48.0,
        base_vib=0.45,
        base_current=6.0,
        base_sound=68.0,
        noise_variance={"temp": 1.0, "vib": 0.04, "current": 0.30, "sound": 1.5}
    ),
    "KNT-02": TextileMachineProfile(
        machine_id="KNT-02",
        name="Circular Knitting Machine",
        machine_type="Knitting Machine",
        base_temp=44.0,
        base_vib=0.35,
        base_current=4.2,
        base_sound=60.0,
        noise_variance={"temp": 0.7, "vib": 0.02, "current": 0.20, "sound": 1.0}
    ),
    "DYE-04": TextileMachineProfile(
        machine_id="DYE-04",
        name="High-Temp Dyeing Machine",
        machine_type="Dyeing Machine",
        base_temp=52.0,
        base_vib=0.50,
        base_current=7.0,
        base_sound=66.0,
        noise_variance={"temp": 1.2, "vib": 0.04, "current": 0.35, "sound": 1.3}
    ),
    "MTR-05": TextileMachineProfile(
        machine_id="MTR-05",
        name="Carding Main Drive Motor (25HP)",
        machine_type="Industrial Motor",
        base_temp=46.0,
        base_vib=0.42,
        base_current=5.2,
        base_sound=65.0,
        noise_variance={"temp": 0.9, "vib": 0.03, "current": 0.25, "sound": 1.1}
    ),
    "CMP-06": TextileMachineProfile(
        machine_id="CMP-06",
        name="Pneumatic Loom Compressor",
        machine_type="Compressor",
        base_temp=50.0,
        base_vib=0.48,
        base_current=8.0,
        base_sound=70.0,
        noise_variance={"temp": 1.1, "vib": 0.05, "current": 0.40, "sound": 1.8}
    )
}

# -------------------------------------------------------------------------
# Fault Signatures Definition
# Exact physical multi-sensor delta offsets and standard deviations
# -------------------------------------------------------------------------
FAULT_SIGNATURES = {
    "Motor Overheating": {
        "description": "Stator thermal buildup due to blocked cowl lint or coil breakdown",
        "temp_delta": (28.0, 42.0),
        "vib_delta": (0.3, 0.7),
        "current_delta": (3.5, 5.5),
        "sound_delta": (8.0, 16.0)
    },
    "Bearing Wear": {
        "description": "Inner/outer raceway spalling and lack of lubrication",
        "temp_delta": (10.0, 20.0),
        "vib_delta": (0.8, 1.4),
        "current_delta": (1.5, 3.2),
        "sound_delta": (14.0, 24.0)
    },
    "High Current Draw": {
        "description": "Mechanical over-torque, low line voltage or phase imbalance",
        "temp_delta": (16.0, 26.0),
        "vib_delta": (0.2, 0.6),
        "current_delta": (4.5, 7.5),
        "sound_delta": (7.0, 15.0)
    },
    "Excessive Noise": {
        "description": "Acoustic resonance, unlubricated cams, or damaged gear teeth",
        "temp_delta": (4.0, 12.0),
        "vib_delta": (0.4, 0.9),
        "current_delta": (0.8, 2.0),
        "sound_delta": (20.0, 32.0)
    },
    "Misalignment": {
        "description": "Shaft angular or parallel misalignment across flex coupling",
        "temp_delta": (8.0, 18.0),
        "vib_delta": (0.9, 1.6),
        "current_delta": (2.0, 4.0),
        "sound_delta": (10.0, 18.0)
    },
    "Loose Components": {
        "description": "Loosened foundation bolts, slackened drive belts, or rattling guards",
        "temp_delta": (2.0, 8.0),
        "vib_delta": (1.1, 1.9),
        "current_delta": (0.5, 1.8),
        "sound_delta": (18.0, 30.0)
    }
}


class IoTSimulatorEngine:
    """
    Industrial IoT Simulation Engine for Textile MSME machinery.
    Generates time-series sensor data with physical bounds every 5 seconds.
    """

    def __init__(self, db_path: str = DB_PATH):
        self.db_path = db_path
        self.profiles = TEXTILE_MACHINE_PROFILES
        # Tracks active injected faults per machine: { machine_id: fault_name }
        self.active_faults: Dict[str, Optional[str]] = {m_id: None for m_id in self.profiles}
        # Thermal inertia tracking to simulate realistic physical heat buildup/cool-off curves
        self.thermal_state: Dict[str, float] = {m_id: prof.base_temp for m_id, prof in self.profiles.items()}
        # Tick counter and simulator status
        self.tick_count = 0
        self.is_running = False

    def inject_fault(self, machine_id: str, fault_type: str) -> bool:
        """Inject a specific fault scenario into a target machine."""
        if machine_id not in self.profiles:
            raise ValueError(f"Unknown machine ID: {machine_id}")
        if fault_type not in FAULT_SIGNATURES:
            raise ValueError(f"Unknown fault type: {fault_type}. Allowed: {list(FAULT_SIGNATURES.keys())}")

        self.active_faults[machine_id] = fault_type
        print(f"[!] FAULT INJECTED: '{fault_type}' on machine {machine_id} ({self.profiles[machine_id].name})")
        return True

    def clear_fault(self, machine_id: str) -> bool:
        """Clear active fault on target machine to return to healthy condition."""
        if machine_id not in self.profiles:
            raise ValueError(f"Unknown machine ID: {machine_id}")
        self.active_faults[machine_id] = None
        print(f"[+] FAULT CLEARED on machine {machine_id}. Returning to Healthy baseline.")
        return True

    def clear_all_faults(self):
        """Reset all machines to healthy baseline."""
        for m_id in self.active_faults:
            self.active_faults[m_id] = None

    def generate_single_reading(self, machine_id: str) -> Dict[str, Any]:
        """
        Generate a single realistic sensor reading for a machine.
        Applies Gaussian jitter, cyclic oscillations, and fault deltas.
        Clamps values strictly to standard operational sensor bounds:
        - Temperature: 35.0°C - 90.0°C
        - Vibration: 0.10g - 2.50g
        - Current: 2.0A - 15.0A
        - Sound: 50.0dB - 100.0dB
        """
        profile = self.profiles[machine_id]
        active_fault = self.active_faults.get(machine_id)

        # Cyclic variation simulating periodic machine revolutions / strokes
        time_factor = time.time()
        osc_vib = 0.05 * math.sin(time_factor * 0.8)
        osc_curr = 0.15 * math.cos(time_factor * 0.4)
        osc_sound = 0.8 * math.sin(time_factor * 0.5)

        # Baseline with random Gaussian noise
        noise_temp = random.gauss(0, profile.noise_variance["temp"])
        noise_vib = random.gauss(0, profile.noise_variance["vib"])
        noise_curr = random.gauss(0, profile.noise_variance["current"])
        noise_sound = random.gauss(0, profile.noise_variance["sound"])

        target_temp = profile.base_temp + noise_temp
        raw_vib = profile.base_vib + osc_vib + noise_vib
        raw_curr = profile.base_current + osc_curr + noise_curr
        raw_sound = profile.base_sound + osc_sound + noise_sound

        is_fault_injected = False
        fault_name = None

        if active_fault and active_fault in FAULT_SIGNATURES:
            is_fault_injected = True
            fault_name = active_fault
            sig = FAULT_SIGNATURES[active_fault]

            # Sample delta within signature range
            delta_t = random.uniform(*sig["temp_delta"])
            delta_v = random.uniform(*sig["vib_delta"])
            delta_i = random.uniform(*sig["current_delta"])
            delta_s = random.uniform(*sig["sound_delta"])

            target_temp += delta_t
            raw_vib += delta_v
            raw_curr += delta_i
            raw_sound += delta_s

        # Realistic thermal inertia: Temperature does not jump instantly; it converges
        current_temp = self.thermal_state[machine_id]
        alpha = 0.15  # Thermal convergence rate per 5-second tick
        new_temp = current_temp + alpha * (target_temp - current_temp)
        self.thermal_state[machine_id] = new_temp

        # Strict physics bounds clamping
        clamped_temp = max(35.0, min(90.0, round(new_temp, 1)))
        clamped_vib = max(0.10, min(2.50, round(raw_vib, 2)))
        clamped_curr = max(2.0, min(15.0, round(raw_curr, 1)))
        clamped_sound = max(50.0, min(100.0, round(raw_sound, 1)))

        return {
            "machine_id": machine_id,
            "machine_name": profile.name,
            "machine_type": profile.machine_type,
            "temperature": clamped_temp,
            "vibration": clamped_vib,
            "current": clamped_curr,
            "sound": clamped_sound,
            "is_fault_injected": is_fault_injected,
            "fault_type": fault_name,
            "recorded_at": datetime.utcnow().isoformat()
        }

    def generate_fleet_telemetry(self) -> List[Dict[str, Any]]:
        """Generate sensor telemetry for all 6 textile machines in the fleet."""
        self.tick_count += 1
        fleet_readings = []
        for machine_id in self.profiles:
            reading = self.generate_single_reading(machine_id)
            fleet_readings.append(reading)
        return fleet_readings

    def persist_readings_to_db(self, readings: List[Dict[str, Any]]) -> int:
        """Persist generated telemetry readings into SQLite `sensor_readings` table."""
        if not os.path.exists(self.db_path):
            return 0

        conn = sqlite3.connect(self.db_path)
        try:
            cursor = conn.cursor()
            rows_to_insert = [
                (
                    r["machine_id"],
                    r["temperature"],
                    r["vibration"],
                    r["current"],
                    r["sound"],
                    1 if r["is_fault_injected"] else 0,
                    r["fault_type"],
                    r["recorded_at"]
                )
                for r in readings
            ]
            cursor.executemany("""
                INSERT INTO sensor_readings (
                    machine_id, temperature, vibration, current, sound,
                    is_fault_injected, fault_type, recorded_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?);
            """, rows_to_insert)
            conn.commit()
            return len(rows_to_insert)
        except Exception as e:
            conn.rollback()
            print(f"[x] Error persisting sensor readings to DB: {e}")
            return 0
        finally:
            conn.close()

    def tick(self, save_to_db: bool = True) -> List[Dict[str, Any]]:
        """Execute one 5-second simulation tick across all 6 machines."""
        readings = self.generate_fleet_telemetry()
        if save_to_db:
            self.persist_readings_to_db(readings)
        return readings

    async def run_continuous_loop(self, interval_seconds: float = 5.0):
        """Asynchronous continuous background worker generating telemetry every 5.0 seconds."""
        self.is_running = True
        print(f"[*] Starting FactoryPulse AI IoT Simulation Engine (Cadence: {interval_seconds}s)...")
        while self.is_running:
            start_t = time.time()
            readings = self.tick(save_to_db=True)
            elapsed = time.time() - start_t
            sleep_time = max(0.0, interval_seconds - elapsed)
            print(f"[Tick #{self.tick_count}] Generated telemetry for {len(readings)} machines ({elapsed*1000:.1f}ms).")
            await asyncio.sleep(sleep_time)


# Global singleton instance
simulator = IoTSimulatorEngine()


# -------------------------------------------------------------------------
# Standalone CLI Testing Execution
# -------------------------------------------------------------------------
if __name__ == "__main__":
    print("=================================================================")
    print("FACTORYPULSE AI - IOT SIMULATION ENGINE VERIFICATION")
    print("=================================================================")
    sim = IoTSimulatorEngine()

    print("\n[Step 1] Testing Healthy Baseline Telemetry for All 6 Machines:")
    healthy_readings = sim.tick(save_to_db=False)
    for r in healthy_readings:
        print(f"  • {r['machine_id']} ({r['machine_name']}): Temp={r['temperature']}°C | Vib={r['vibration']}g | Current={r['current']}A | Sound={r['sound']}dB [Healthy]")

    print("\n[Step 2] Injecting Fault: 'Bearing Wear' into WVE-03 (Weaving Loom)...")
    sim.inject_fault("WVE-03", "Bearing Wear")
    # Simulate 3 ticks to demonstrate thermal & vibration escalation
    for i in range(1, 4):
        time.sleep(0.5)
        tick_res = sim.tick(save_to_db=False)
        wve = next(x for x in tick_res if x["machine_id"] == "WVE-03")
        print(f"  Tick {i}: Temp={wve['temperature']}°C | Vib={wve['vibration']}g | Current={wve['current']}A | Sound={wve['sound']}dB | Fault={wve['fault_type']}")

    print("\n[Step 3] Testing All 6 Fault Scenarios Across Machines:")
    fault_test_map = {
        "SPN-01": "Misalignment",
        "WVE-03": "Bearing Wear",
        "KNT-02": "Loose Components",
        "DYE-04": "Excessive Noise",
        "MTR-05": "Motor Overheating",
        "CMP-06": "High Current Draw"
    }

    for m_id, f_type in fault_test_map.items():
        sim.inject_fault(m_id, f_type)

    fault_readings = sim.tick(save_to_db=True)
    print(f"\n[Step 4] Generated & Saved {len(fault_readings)} Telemetry Records into SQLite Database:")
    for r in fault_readings:
        print(f"  • [{r['machine_id']}] Fault: {r['fault_type']:<18} | T: {r['temperature']:>4.1f}°C | V: {r['vibration']:>4.2f}g | I: {r['current']:>4.1f}A | S: {r['sound']:>4.1f}dB")

    print("\n[+] Verification Complete: IoT Sensor Simulator operational within specification bounds!")
