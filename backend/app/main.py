"""
FactoryPulse AI - Main FastAPI Application
Subtitle: AI Maintenance Co-Pilot for Textile MSMEs

Includes API routers:
- Health Engine (Phase 4)
- Failure Prediction Engine (Phase 5)
- Explainable AI Engine (Phase 6)
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.app.api.v1.health import router as health_router
from backend.app.api.v1.predictions import router as prediction_router
from backend.app.api.v1.xai import router as xai_router

app = FastAPI(
    title="FactoryPulse AI - Predictive Maintenance API",
    description="Industry 4.0 IoT Telemetry, Failure Prediction & Explainable AI for Textile MSMEs",
    version="1.0.0"
)

# CORS middleware for frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include v1 Routers
app.include_router(health_router, prefix="/api/v1")
app.include_router(prediction_router, prefix="/api/v1")
app.include_router(xai_router, prefix="/api/v1")


@app.get("/", tags=["Root"])
def root_info():
    return {
        "app": "FactoryPulse AI",
        "description": "AI Maintenance Co-Pilot for Textile MSMEs",
        "version": "1.0.0",
        "phases_completed": [
            "Phase 1: Architecture & System Overview",
            "Phase 2: Database Design & Schemas",
            "Phase 3: Real-time IoT Telemetry Simulator",
            "Phase 4: Machine Health Score Calculation Engine",
            "Phase 5: Failure Prediction Engine (Random Forest)",
            "Phase 6: Explainable AI (XAI) Engine"
        ],
        "endpoints": {
            "health": "/api/v1/health",
            "predictions": "/api/v1/predict",
            "explainable_ai": "/api/v1/xai",
            "docs": "/docs"
        }
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.app.main:app", host="0.0.0.0", port=8000, reload=True)
