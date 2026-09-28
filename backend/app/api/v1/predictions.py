"""
FastAPI Endpoints for Failure Prediction Engine (Phase 5)
Subtitle: AI Maintenance Co-Pilot for Textile MSMEs
"""

from typing import List, Dict, Any
from fastapi import APIRouter, HTTPException, Query, status

from backend.app.schemas.prediction import PredictionRequest, PredictionOut, ModelTrainingMetrics
from backend.app.services.prediction_engine import (
    predict_machine_telemetry,
    predict_for_machine_id,
    get_fleet_predictions,
    get_model_metadata
)
from backend.app.ml_models.train_rf import train_and_save_model

router = APIRouter(prefix="/predict", tags=["Failure Prediction Engine (Phase 5)"])


@router.post("/telemetry", response_model=Dict[str, Any], summary="Predict failure state from raw sensor inputs")
def predict_raw_telemetry(payload: PredictionRequest):
    """
    Execute Random Forest Classifier inference on 4-channel telemetry:
    Temperature, Vibration, Current, and Sound.
    Returns: Healthy, Warning, or Critical class, probabilities, failure risk, and RUL estimate.
    """
    try:
        result = predict_machine_telemetry(
            machine_id=payload.machine_id,
            temperature=payload.temperature,
            vibration=payload.vibration,
            current=payload.current,
            sound=payload.sound,
            persist=True
        )
        return result
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Inference failure: {str(e)}"
        )


@router.get("/machine/{machine_id}", response_model=Dict[str, Any], summary="Predict failure state for specific machine")
def predict_machine(machine_id: str):
    """
    Fetch the latest recorded sensor reading for a specific machine and return
    real-time predictive diagnosis and failure probability.
    """
    try:
        return predict_for_machine_id(machine_id, persist=True)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Machine '{machine_id}' prediction failed: {str(e)}"
        )


@router.get("/fleet", response_model=List[Dict[str, Any]], summary="Predict failure state for entire textile fleet")
def predict_fleet():
    """
    Execute real-time failure prediction inference across all machines in the textile plant.
    """
    try:
        return get_fleet_predictions()
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Fleet prediction failed: {str(e)}"
        )


@router.get("/model/metrics", response_model=Dict[str, Any], summary="Get Random Forest model metrics and parameters")
def get_model_stats():
    """
    Retrieve training accuracy, sample sizes, number of decision trees, and feature importances.
    """
    try:
        return get_model_metadata()
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch model metrics: {str(e)}"
        )


@router.post("/retrain", response_model=Dict[str, Any], summary="Trigger model retraining on demand")
def trigger_retraining(samples: int = Query(3000, ge=500, le=10000)):
    """
    Synthesize fresh textile telemetry, retrain the Random Forest Classifier,
    and update serialized model weights.
    """
    try:
        metrics = train_and_save_model(n_samples=samples)
        return {
            "status": "success",
            "message": f"Random Forest re-trained on {samples} samples",
            "metrics": metrics
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Retraining failed: {str(e)}"
        )
