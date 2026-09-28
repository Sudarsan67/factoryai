"""
FactoryPulse AI - Failure Prediction Engine Service (Phase 5)
Subtitle: AI Maintenance Co-Pilot for Textile MSMEs
Inference service using pre-trained Random Forest Classifier.
"""

import os
import json
import sqlite3
from datetime import datetime
from typing import Dict, Any, Optional, List, Tuple

from backend.app.ml_models.train_rf import PurePythonRandomForest, MODEL_ARTIFACT_PATH

DB_PATH = os.path.join(os.path.dirname(__file__), "../../database/factorypulse.db")

_cached_model: Optional[PurePythonRandomForest] = None
_model_metadata: Dict[str, Any] = {}


def load_model() -> PurePythonRandomForest:
    """Load serialized Random Forest model from disk (cached in memory)."""
    global _cached_model, _model_metadata
    if _cached_model is not None:
        return _cached_model

    if not os.path.exists(MODEL_ARTIFACT_PATH):
        raise FileNotFoundError(f"Model artifact not found at {MODEL_ARTIFACT_PATH}. Train the model first.")

    with open(MODEL_ARTIFACT_PATH, "r", encoding="utf-8") as f:
        data = json.load(f)

    _cached_model = PurePythonRandomForest.from_dict(data)
    _model_metadata = {
        "n_estimators": data.get("n_estimators", 35),
        "feature_names": data.get("feature_names", ["temperature", "vibration", "current", "sound"]),
        "feature_importances": data.get("feature_importances", {}),
        "metrics": data.get("metrics", {}),
        "version": "1.0-rf-ensemble"
    }
    return _cached_model


def get_model_metadata() -> Dict[str, Any]:
    """Retrieve metadata and evaluation metrics of the deployed model."""
    load_model()
    return _model_metadata


def diagnose_probable_fault(
    temperature: float,
    vibration: float,
    current: float,
    sound: float,
    pred_label: str
) -> str:
    """Diagnose the most probable mechanical/electrical fault signature."""
    if pred_label == "Healthy":
        return "Normal Operating Dynamics"

    # Identify primary contributor
    dev_vib = (vibration - 0.45) / 0.45
    dev_temp = (temperature - 48.0) / 48.0
    dev_curr = (current - 5.5) / 5.5
    dev_sound = (sound - 68.0) / 68.0

    scores = [
        ("Bearing Wear", max(dev_vib * 1.5, 0) + max(dev_sound * 0.8, 0)),
        ("Motor Overheating", max(dev_temp * 1.8, 0) + max(dev_curr * 0.9, 0)),
        ("High Current Draw", max(dev_curr * 2.0, 0) + max(dev_temp * 0.6, 0)),
        ("Excessive Noise & Cavitation", max(dev_sound * 2.0, 0) + max(dev_vib * 0.7, 0)),
        ("Shaft Misalignment", max(dev_vib * 1.3, 0) + max(dev_curr * 0.8, 0)),
        ("Loose Mechanical Components", max(dev_vib * 1.4, 0) + max(dev_sound * 1.2, 0))
    ]
    scores.sort(key=lambda x: x[1], reverse=True)
    return scores[0][0]


def estimate_rul_hours(pred_label: str, failure_prob: float) -> float:
    """
    Estimate Remaining Useful Life (RUL) in hours based on classification
    and failure probability curve.
    """
    if pred_label == "Healthy":
        # RUL: 720 to 1440 hours (30-60 operational days)
        return round(720.0 + (1.0 - failure_prob) * 720.0, 1)
    elif pred_label == "Warning":
        # RUL: 48 to 168 hours (2-7 operational days)
        return round(48.0 + (1.0 - failure_prob) * 120.0, 1)
    else:  # Critical
        # RUL: 4 to 24 hours (immediate intervention mandatory)
        return round(4.0 + (1.0 - failure_prob) * 20.0, 1)


def predict_machine_telemetry(
    machine_id: str,
    temperature: float,
    vibration: float,
    current: float,
    sound: float,
    persist: bool = True
) -> Dict[str, Any]:
    """
    Execute Random Forest inference on raw telemetry inputs, compute probabilities,
    predict fault type, estimate RUL, and optionally persist to SQLite.
    """
    model = load_model()
    features = [temperature, vibration, current, sound]
    probs = model.predict_proba([features])[0]

    p_healthy = round(probs[0], 4)
    p_warning = round(probs[1], 4)
    p_critical = round(probs[2], 4)

    # Class determination
    class_idx = probs.index(max(probs))
    label_map = {0: "Healthy", 1: "Warning", 2: "Critical"}
    prediction_label = label_map[class_idx]

    # Failure probability is composite risk: p_warning * 0.5 + p_critical * 1.0
    failure_probability = round(min(1.0, max(0.0, (p_warning * 0.55) + (p_critical * 1.0))), 4)
    confidence_score = round(max(probs), 4)

    predicted_fault = diagnose_probable_fault(temperature, vibration, current, sound, prediction_label)
    rul_hours = estimate_rul_hours(prediction_label, failure_probability)

    result = {
        "machine_id": machine_id,
        "prediction_label": prediction_label,
        "failure_probability": failure_probability,
        "probabilities": {
            "healthy": p_healthy,
            "warning": p_warning,
            "critical": p_critical
        },
        "inputs": {
            "temperature": round(temperature, 2),
            "vibration": round(vibration, 3),
            "current": round(current, 2),
            "sound": round(sound, 1)
        },
        "predicted_fault": predicted_fault,
        "estimated_rul_hours": rul_hours,
        "confidence_score": confidence_score,
        "model_version": _model_metadata.get("version", "1.0-rf-ensemble"),
        "predicted_at": datetime.utcnow().isoformat()
    }

    if persist and os.path.exists(DB_PATH):
        try:
            conn = sqlite3.connect(DB_PATH)
            cursor = conn.cursor()
            cursor.execute(
                """
                INSERT INTO failure_predictions 
                (machine_id, prediction_label, failure_probability, predicted_fault, estimated_rul_hours, xai_primary_factor, xai_explanation_json, predicted_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    machine_id,
                    prediction_label,
                    failure_probability,
                    predicted_fault,
                    rul_hours,
                    "Vibration" if "Vibration" in predicted_fault or "Bearing" in predicted_fault else "Temperature",
                    json.dumps(result["probabilities"]),
                    result["predicted_at"]
                )
            )
            conn.commit()
            conn.close()
        except Exception as e:
            print(f"[!] Warning: failed to persist prediction to SQLite: {e}")

    return result


def predict_for_machine_id(machine_id: str, persist: bool = True) -> Dict[str, Any]:
    """
    Fetch latest sensor reading for a specific machine from SQLite and predict state.
    """
    if not os.path.exists(DB_PATH):
        raise FileNotFoundError("Database not found")

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute(
        """
        SELECT temperature, vibration, current, sound
        FROM sensor_readings
        WHERE machine_id = ?
        ORDER BY timestamp DESC
        LIMIT 1
        """,
        (machine_id,)
    )
    row = cursor.fetchone()
    conn.close()

    if not row:
        # Default baseline if no telemetry recorded yet
        temp, vib, curr, snd = 48.0, 0.40, 5.0, 68.0
    else:
        temp, vib, curr, snd = row

    return predict_machine_telemetry(machine_id, temp, vib, curr, snd, persist=persist)


def get_fleet_predictions() -> List[Dict[str, Any]]:
    """Generate predictions for all registered machines."""
    if not os.path.exists(DB_PATH):
        return []

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("SELECT id, name, type, location FROM machines ORDER BY id ASC")
    machines = cursor.fetchall()
    conn.close()

    fleet_results = []
    for m_id, name, m_type, loc in machines:
        pred = predict_for_machine_id(m_id, persist=False)
        pred["machine_name"] = name
        pred["machine_type"] = m_type
        pred["location"] = loc
        fleet_results.append(pred)

    return fleet_results
