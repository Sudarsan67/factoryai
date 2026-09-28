"""
FactoryPulse AI - Synthetic Dataset Generator for Textile Predictive Maintenance
Subtitle: AI Maintenance Co-Pilot for Textile MSMEs
Phase 5: Multi-Modal Operational Dataset Generator (5,000 Records)
"""

import random
import csv
import os
from typing import List, Dict, Any, Tuple

DATASET_DIR = os.path.dirname(__file__)
DATASET_CSV_PATH = os.path.join(DATASET_DIR, "textile_telemetry_dataset.csv")

MACHINE_CONFIGS = [
    {"type": "Spinning Machine", "base_t": 42.0, "base_v": 0.40, "base_i": 5.5, "base_s": 64.0},
    {"type": "Weaving Loom",     "base_t": 48.0, "base_v": 0.45, "base_i": 6.0, "base_s": 68.0},
    {"type": "Knitting Machine", "base_t": 44.0, "base_v": 0.35, "base_i": 4.2, "base_s": 60.0},
    {"type": "Dyeing Machine",   "base_t": 52.0, "base_v": 0.50, "base_i": 7.0, "base_s": 66.0},
    {"type": "Industrial Motor", "base_t": 46.0, "base_v": 0.42, "base_i": 5.2, "base_s": 65.0},
    {"type": "Compressor",       "base_t": 50.0, "base_v": 0.48, "base_i": 8.0, "base_s": 70.0}
]

def generate_textile_dataset(n_samples: int = 5000) -> List[Dict[str, Any]]:
    """
    Generate n_samples of multi-modal synthetic operational telemetry records.
    Returns:
        List of dict records with temperature, vibration, current, sound,
        machine_type, fault_type, label (Healthy, Warning, Critical), and target_class (0, 1, 2).
    """
    records = []
    # Class distribution: 60% Healthy, 25% Warning, 15% Critical
    n_healthy = int(n_samples * 0.60)
    n_warning = int(n_samples * 0.25)
    n_critical = n_samples - n_healthy - n_warning

    # 1. Generate Healthy Records (Class 0)
    for _ in range(n_healthy):
        m = random.choice(MACHINE_CONFIGS)
        t = round(random.gauss(m["base_t"], 1.2), 1)
        v = round(random.gauss(m["base_v"], 0.04), 2)
        c = round(random.gauss(m["base_i"], 0.35), 1)
        s = round(random.gauss(m["base_s"], 1.5), 1)

        # Clamping
        t = max(35.0, min(56.0, t))
        v = max(0.10, min(0.79, v))
        c = max(2.0, min(7.9, c))
        s = max(50.0, min(74.0, s))

        records.append({
            "temperature": t,
            "vibration": v,
            "current": c,
            "sound": s,
            "machine_type": m["type"],
            "fault_type": "None",
            "label": "Healthy",
            "target_class": 0
        })

    # 2. Generate Warning Records (Class 1)
    fault_modes = [
        "Motor Overheating", "Bearing Wear", "High Current Draw",
        "Excessive Noise", "Misalignment", "Loose Components"
    ]

    for _ in range(n_warning):
        m = random.choice(MACHINE_CONFIGS)
        fault = random.choice(fault_modes)

        t = m["base_t"] + random.gauss(0, 1.0)
        v = m["base_v"] + random.gauss(0, 0.05)
        c = m["base_i"] + random.gauss(0, 0.3)
        s = m["base_s"] + random.gauss(0, 1.2)

        if fault == "Motor Overheating":
            t += random.uniform(14.0, 24.0)
            c += random.uniform(1.8, 3.2)
            s += random.uniform(4.0, 8.0)
        elif fault == "Bearing Wear":
            v += random.uniform(0.55, 1.10)
            s += random.uniform(10.0, 18.0)
            t += random.uniform(6.0, 14.0)
        elif fault == "High Current Draw":
            c += random.uniform(3.0, 5.0)
            t += random.uniform(8.0, 15.0)
        elif fault == "Excessive Noise":
            s += random.uniform(15.0, 24.0)
            v += random.uniform(0.30, 0.65)
        elif fault == "Misalignment":
            v += random.uniform(0.60, 1.15)
            c += random.uniform(1.5, 2.8)
        elif fault == "Loose Components":
            v += random.uniform(0.70, 1.30)
            s += random.uniform(12.0, 20.0)

        t = max(35.0, min(75.0, round(t, 1)))
        v = max(0.10, min(1.60, round(v, 2)))
        c = max(2.0, min(12.0, round(c, 1)))
        s = max(50.0, min(88.0, round(s, 1)))

        records.append({
            "temperature": t,
            "vibration": v,
            "current": c,
            "sound": s,
            "machine_type": m["type"],
            "fault_type": fault,
            "label": "Warning",
            "target_class": 1
        })

    # 3. Generate Critical Records (Class 2)
    for _ in range(n_critical):
        m = random.choice(MACHINE_CONFIGS)
        fault = random.choice(fault_modes)

        t = m["base_t"] + random.gauss(0, 1.0)
        v = m["base_v"] + random.gauss(0, 0.05)
        c = m["base_i"] + random.gauss(0, 0.3)
        s = m["base_s"] + random.gauss(0, 1.2)

        if fault == "Motor Overheating":
            t += random.uniform(32.0, 44.0)
            c += random.uniform(4.5, 7.5)
            v += random.uniform(0.4, 0.8)
            s += random.uniform(10.0, 18.0)
        elif fault == "Bearing Wear":
            v += random.uniform(1.30, 2.00)
            s += random.uniform(20.0, 30.0)
            t += random.uniform(18.0, 28.0)
        elif fault == "High Current Draw":
            c += random.uniform(6.0, 9.0)
            t += random.uniform(22.0, 34.0)
        elif fault == "Excessive Noise":
            s += random.uniform(24.0, 34.0)
            v += random.uniform(0.70, 1.20)
        elif fault == "Misalignment":
            v += random.uniform(1.20, 1.90)
            c += random.uniform(3.5, 6.0)
        elif fault == "Loose Components":
            v += random.uniform(1.40, 2.05)
            s += random.uniform(22.0, 32.0)

        t = max(35.0, min(90.0, round(t, 1)))
        v = max(0.10, min(2.50, round(v, 2)))
        c = max(2.0, min(15.0, round(c, 1)))
        s = max(50.0, min(100.0, round(s, 1)))

        records.append({
            "temperature": t,
            "vibration": v,
            "current": c,
            "sound": s,
            "machine_type": m["type"],
            "fault_type": fault,
            "label": "Critical",
            "target_class": 2
        })

    random.shuffle(records)
    return records

def save_dataset_to_csv(records: List[Dict[str, Any]], filepath: str = DATASET_CSV_PATH):
    """Save generated records to CSV file."""
    if not records:
        return
    fieldnames = list(records[0].keys())
    with open(filepath, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(records)
    print(f"[+] Successfully saved {len(records)} synthetic records to: {filepath}")

if __name__ == "__main__":
    data = generate_textile_dataset(5000)
    save_dataset_to_csv(data)
