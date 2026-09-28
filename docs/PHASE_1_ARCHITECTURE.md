# FACTORYPULSE AI - SYSTEM ARCHITECTURE SPECIFICATION
## Subtitle: AI Maintenance Co-Pilot for Textile MSMEs
### Phase 1: Project Architecture Specification

---

## 1. COMPLETE SYSTEM ARCHITECTURE

FactoryPulse AI is an Industry 4.0 predictive maintenance and decision support system engineered specifically for Indian and global Textile Micro, Small, and Medium Enterprises (MSMEs).

### Core Architectural Layers:
1. **IoT Telemetry & Edge Ingestion Layer:**
   - Simulates high-precision multi-sensor industrial telemetry across 6 primary textile machines: Spinning Machines (Rotor/Ring), Weaving Looms (Air Jet/Rapier), Circular Knitting Machines, High-Temp Dyeing Machines, Main Industrial Motors (Carding/Blowroom), and Pneumatic Loom Air Compressors.
   - 4 Continuous Telemetry Channels: Temperature (°C), Vibration (g), Current (A), Acoustic Sound (dB).
   - Real-time sampling cadence of 5.0 seconds with Gaussian jitter and programmable fault injection modes.

2. **Persistence & Time-Series Caching Layer:**
   - Embedded SQLite engine configured with Write-Ahead Logging (WAL) mode for concurrent high-speed ingestion and analytics reading.
   - In-memory rolling windows for immediate sub-second dashboard rendering and historical retention.

3. **Hybrid AI & Machine Learning Layer:**
   - **Continuous Health Score Engine:** Multi-factor weighted normalization formula evaluating live telemetry against machine baseline tolerances (Score 0 - 100).
   - **Failure Prediction Engine (Supervised):** Random Forest Classifier trained on synthetic industrial operational cycles to predict failure state (Healthy, Warning, Critical) and output continuous failure probabilities (0% - 100%).
   - **Unsupervised Anomaly Detection:** Isolation Forest algorithm detecting subtle multi-dimensional drift before single-variable hard thresholds trip.
   - **Explainable AI (XAI):** Feature attribution engine computing relative percentage deviations against nominal baselines, answering *why* a machine is deteriorating.

4. **Prescriptive Maintenance Co-Pilot Rule Matrix:**
   - Translates raw sensor anomalies and ML predictions into actionable shop-floor work orders: exact problem definition, probable mechanical/electrical root causes, step-by-step SOP resolution, technician skill requirement, estimated repair duration, and estimated spare parts costs.

5. **MSME Business & Cost Impact Analyzer:**
   - Translates technical mechanical parameters into bottom-line financial metrics in Indian Rupees (₹).
   - Quantifies lost production per downtime hour, compares proactive repairs versus catastrophic post-breakdown repairs, and calculates net financial savings.

6. **Omni-Channel Technician & Supervisor Engagement:**
   - WhatsApp-styled interactive alert cards with single-click acknowledgment.
   - Natural Language Plant Chatbot for quick fleet queries on mobile devices.
   - Vernacular Multilingual Voice Assistant (English, Tamil, Hindi) powered by the browser Web Speech Synthesis API.

---

## 2. REPOSITORY & DIRECTORY STRUCTURE

```
factorypulse-ai/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py                     # FastAPI application entry point
│   │   ├── config.py                   # System thresholds & configuration
│   │   ├── database.py                 # SQLite engine & session management
│   │   ├── models/                     # Database entities
│   │   │   ├── __init__.py
│   │   │   ├── machine.py              # Machine & MachineHealth models
│   │   │   ├── sensor.py               # SensorReading time-series
│   │   │   ├── maintenance.py          # MaintenanceLog & FailurePrediction
│   │   │   ├── alert.py                # Alert & ChatHistory
│   │   │   └── cost.py                 # CostAnalysis & User
│   │   ├── schemas/                    # Pydantic validation models
│   │   ├── api/                        # REST API routing
│   │   │   └── v1/
│   │   │       ├── api.py              # Root router aggregator
│   │   │       ├── machines.py         # Machine fleet endpoints
│   │   │       ├── sensors.py          # Real-time telemetry endpoints
│   │   │       ├── health.py           # Health score calculations
│   │   │       ├── predictions.py      # Random Forest predictions & XAI
│   │   │       ├── maintenance.py      # Co-Pilot maintenance actions
│   │   │       ├── cost.py             # MSME cost impact analysis
│   │   │       ├── alerts.py           # WhatsApp alerts dispatch
│   │   │       ├── chat.py             # NLP assistant chat logic
│   │   │       └── voice.py            # Multilingual voice scripts
│   │   ├── services/                   # Business logic engines
│   │   │   ├── iot_simulator.py        # 5-second realistic sensor generator
│   │   │   ├── health_engine.py        # 0-100 composite health formula
│   │   │   ├── failure_predictor.py    # Random Forest inference service
│   │   │   ├── anomaly_detector.py     # Isolation Forest anomaly service
│   │   │   ├── explainable_ai.py       # Relative deviation attribution
│   │   │   ├── copilot_rules.py        # Prescriptive troubleshooting matrix
│   │   │   ├── cost_analyzer.py        # MSME downtime & savings calculator
│   │   │   └── voice_service.py        # English, Tamil & Hindi text generator
│   │   └── ml_models/                  # Trained artifacts & training scripts
│   │       ├── train_rf.py
│   │       ├── train_iforest.py
│   │       ├── random_forest.joblib
│   │       └── isolation_forest.joblib
│   ├── requirements.txt
│   ├── Dockerfile
│   └── tests/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/                 # Header, Sidebar, MetricBadge, DarkTheme
│   │   │   ├── dashboard/              # Overview KPI cards & Machine Fleet table
│   │   │   ├── charts/                 # Recharts sensor telemetry monitors
│   │   │   ├── prediction/             # Failure probability & Explainable AI cards
│   │   │   ├── copilot/                # Maintenance action steps & checklist
│   │   │   ├── cost/                   # MSME downtime & savings calculator
│   │   │   ├── alerts/                 # WhatsApp alert cards & broadcast feed
│   │   │   ├── chat/                   # WhatsApp-style plant manager chatbot
│   │   │   └── voice/                  # Multilingual voice assistant (EN/TA/HI)
│   │   ├── context/                    # React Context (FleetState, TelemetryContext)
│   │   ├── hooks/                      # useTelemetry, useSpeechSynthesis
│   │   ├── services/                   # API client methods
│   │   ├── types/                      # TypeScript interfaces & types
│   │   ├── App.tsx                     # Main dashboard container
│   │   └── main.tsx                    # Entry point
│   ├── package.json
│   ├── vite.config.ts
│   └── tsconfig.json
├── docker-compose.yml
├── README.md
└── .env.example
```

---

## 3. DATABASE SCHEMA OVERVIEW (SQLITE)

1. **`machines`**: Machine catalog (`id`, `name`, `type`, `location_section`, `rated_power_kw`, `baseline_temp`, `baseline_vib`, `baseline_current`, `baseline_sound`, `installed_at`).
2. **`machine_health`**: Real-time calculated health ratings (`id`, `machine_id`, `health_score`, `category`, `temperature_score`, `vibration_score`, `current_score`, `sound_score`, `updated_at`).
3. **`sensor_readings`**: High-frequency telemetry stream (`id`, `machine_id`, `temperature`, `vibration`, `current`, `sound`, `is_fault_injected`, `fault_type`, `recorded_at`).
4. **`failure_predictions`**: ML model outputs & explanations (`id`, `machine_id`, `prediction_label`, `failure_probability`, `predicted_fault`, `xai_primary_factor`, `xai_explanation_json`, `predicted_at`).
5. **`maintenance_logs`**: Prescriptive maintenance tickets (`id`, `machine_id`, `problem_title`, `possible_cause`, `recommended_action`, `priority_level`, `estimated_repair_time_hrs`, `estimated_repair_cost_inr`, `status`, `created_at`).
6. **`alerts`**: Dispatched alerts (`id`, `machine_id`, `alert_title`, `severity`, `message_content`, `whatsapp_dispatched`, `recipient_phone`, `acknowledged_by`, `created_at`).
7. **`cost_analysis`**: Financial calculations (`id`, `machine_id`, `fault_detected`, `expected_downtime_hrs`, `production_loss_inr`, `repair_cost_today_inr`, `repair_cost_post_failure_inr`, `estimated_savings_inr`, `calculated_at`).
8. **`chat_history`**: Chatbot interactions (`id`, `user_id`, `machine_id`, `user_query`, `bot_response`, `intent_detected`, `timestamp`).
9. **`users`**: Factory operators and managers (`id`, `full_name`, `email`, `role`, `whatsapp_number`, `preferred_language`, `created_at`).

---

## 4. COMPONENT HIERARCHY

```
<App />
└── <FleetTelemetryProvider>
    ├── <Header />
    ├── <MachineFleetBar />
    └── <MainDashboardLayout>
        ├── <OverviewKPICards />
        ├── <TelemetrySection>
        │   ├── <MachineSelector />
        │   ├── <SensorChartPanel />
        │   └── <FaultInjectionBar />
        ├── <AIInsightsRow>
        │   ├── <HealthScoreGauge />
        │   ├── <FailurePredictor />
        │   ├── <ExplainableAIModal />
        │   └── <AnomalyRadar />
        ├── <PrescriptiveCoPilot>
        │   ├── <ProblemCauseCard />
        │   ├── <ActionChecklist />
        │   └── <CostImpactWidget />
        └── <CommunicationsPanel>
            ├── <WhatsAppAlertFeed />
            ├── <PlantChatbot />
            └── <VoiceAssistantModal />
```

---

## 5. API ARCHITECTURE

FastAPI endpoints organized under `/api/v1/`:
- **Telemetry & Sensors:**
  - `GET /api/v1/machines`: List all textile machines with current status.
  - `GET /api/v1/sensors/live/{machine_id}`: Latest 5s telemetry (T, V, I, S).
  - `GET /api/v1/sensors/history/{machine_id}`: Past time-series buffer.
  - `POST /api/v1/simulator/inject-fault`: Dynamically inject fault patterns.
- **AI Analytics & Predictions:**
  - `GET /api/v1/health/{machine_id}`: Compute 0-100 health index & category.
  - `POST /api/v1/predict/failure`: Random Forest failure classification & probability.
  - `POST /api/v1/detect/anomaly`: Isolation Forest outlier score.
  - `GET /api/v1/explain/{machine_id}`: Explainable AI feature attribution breakdown.
- **Maintenance & Cost Analytics:**
  - `GET /api/v1/maintenance/recommendations/{machine_id}`: Prescriptive troubleshooting SOP.
  - `POST /api/v1/maintenance/log`: Record technician action.
  - `GET /api/v1/cost/impact/{machine_id}`: MSME downtime and savings calculator in ₹.
- **Alerts, WhatsApp & Voice:**
  - `GET /api/v1/alerts/whatsapp`: Retrieve recent alert log.
  - `POST /api/v1/alerts/send-whatsapp`: Trigger WhatsApp message payload.
  - `POST /api/v1/chat/query`: Natural language maintenance query.
  - `GET /api/v1/voice/script/{machine_id}`: Vernacular speech scripts in EN, TA, HI.

---

## 6. DATA FLOW DIAGRAMS

1. **Telemetry Stream (every 5 seconds):**
   - Simulated IoT loop -> Physics generation -> Noise injection -> SQLite `sensor_readings`.
2. **Inference Pipeline:**
   - Telemetry vector [T, V, I, S] -> Mathematical Health Index -> Random Forest Classifier (Failure Probability) -> Isolation Forest (Outlier score).
3. **Prescriptive Action & Financial Computation:**
   - If anomaly detected -> Co-Pilot Rule Matrix matches defect -> Computes Expected Downtime & Cost in ₹.
4. **Dispatcher & UI Refresh:**
   - Dashboard WebSockets/polling updates Recharts -> Generates WhatsApp alert payload -> Synthesizes multilingual speech.

---

## 7. USER FLOW DIAGRAMS

1. **Mill Owner / Managing Director:**
   - Enters dashboard -> Views Overview KPI (6 machines) -> Observes Cost Impact Panel (Savings in ₹) -> Receives WhatsApp Executive Summary -> Approves procurement.
2. **Maintenance Supervisor:**
   - Identifies Warning status on Weaving Loom -> Examines Explainable AI (+35% vibration) -> Reviews Co-Pilot SOP & work order -> Dispatches technician.
3. **Floor Technician:**
   - Inspects machine on noisy plant floor -> Activates Voice Assistant in Tamil/Hindi -> Follows hands-free audio checklist -> Logs completion.

---

## 8. AI WORKFLOW

- **Data Generator:** Generates 5,000 synthetic multi-modal operational cycles covering healthy and 6 distinct textile fault conditions.
- **Model Training:** Random Forest Classifier (100 estimators, max depth 8) and Isolation Forest (contamination=0.05).
- **Inference Cycle:** Telemetry vector fed every 5s; probabilities calibrated; Explainable AI computes deviations against baseline.

---

## 9. IOT SIMULATION WORKFLOW

- **Continuous 5-Second Generation:**
  - Temperature: 35°C to 90°C (Normal: 40-55°C)
  - Vibration: 0.1g to 2.5g (Normal: <0.8g)
  - Current: 2A to 15A (Normal: 4-8A)
  - Sound: 50dB to 100dB (Normal: <75dB)
- **Fault Simulation Matrix:**
  - Motor Overheating, Bearing Wear, High Current Draw, Excessive Noise, Misalignment, Loose Components.

---

## 10. DEPLOYMENT ARCHITECTURE

- **Containerization:** Multi-stage Dockerfile containing Python 3.11, Scikit-Learn, SQLite with volume mount, and Vite React build.
- **Hosting Targets:** Render / Railway (Cloud container with persistent disk) or On-Premise Industrial Mini-PC / Raspberry Pi 5 for shop-floor edge deployment.
