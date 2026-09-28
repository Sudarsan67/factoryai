-- =====================================================================
-- FACTORYPULSE AI - INDUSTRY 4.0 SQLITE DATABASE SCHEMA
-- Subtitle: AI Maintenance Co-Pilot for Textile MSMEs
-- Phase 2: Complete Relational Schema with Foreign Keys & Constraints
-- =====================================================================

PRAGMA foreign_keys = ON;
PRAGMA journal_mode = WAL;
PRAGMA synchronous = NORMAL;

-- ---------------------------------------------------------------------
-- Table 1: machines
-- Master catalog of textile MSME machinery assets with baseline ratings
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS machines (
    id VARCHAR(32) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    type VARCHAR(50) NOT NULL,
    location_section VARCHAR(50) NOT NULL,
    rated_power_kw REAL NOT NULL,
    baseline_temp REAL NOT NULL DEFAULT 45.0,
    baseline_vib REAL NOT NULL DEFAULT 0.40,
    baseline_current REAL NOT NULL DEFAULT 5.0,
    baseline_sound REAL NOT NULL DEFAULT 65.0,
    manufacturer VARCHAR(100),
    model_year INTEGER,
    status VARCHAR(20) NOT NULL DEFAULT 'Healthy', -- Healthy, Warning, Critical
    installed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_serviced_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ---------------------------------------------------------------------
-- Table 2: machine_health
-- Continuous composite health index (0-100) and sub-component health grades
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS machine_health (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    machine_id VARCHAR(32) NOT NULL,
    health_score REAL NOT NULL CHECK(health_score >= 0.0 AND health_score <= 100.0),
    category VARCHAR(20) NOT NULL, -- Excellent (90-100), Good (70-89), Warning (50-69), Critical (<50)
    temperature_score REAL NOT NULL CHECK(temperature_score >= 0.0 AND temperature_score <= 100.0),
    vibration_score REAL NOT NULL CHECK(vibration_score >= 0.0 AND vibration_score <= 100.0),
    current_score REAL NOT NULL CHECK(current_score >= 0.0 AND current_score <= 100.0),
    sound_score REAL NOT NULL CHECK(sound_score >= 0.0 AND sound_score <= 100.0),
    primary_risk_factor VARCHAR(50),
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (machine_id) REFERENCES machines(id) ON DELETE CASCADE
);

-- ---------------------------------------------------------------------
-- Table 3: sensor_readings
-- High-frequency 5-second simulated IoT telemetry time-series records
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS sensor_readings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    machine_id VARCHAR(32) NOT NULL,
    temperature REAL NOT NULL,   -- Range: 35°C - 90°C
    vibration REAL NOT NULL,     -- Range: 0.1g - 2.5g
    current REAL NOT NULL,       -- Range: 2A - 15A
    sound REAL NOT NULL,         -- Range: 50dB - 100dB
    is_fault_injected BOOLEAN NOT NULL DEFAULT 0,
    fault_type VARCHAR(50) DEFAULT NULL, -- Motor Overheating, Bearing Wear, High Current Draw, Excessive Noise, Misalignment, Loose Components
    recorded_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (machine_id) REFERENCES machines(id) ON DELETE CASCADE
);

-- Indexes for ultra-fast time-series filtering
CREATE INDEX IF NOT EXISTS idx_sensor_readings_machine_time 
ON sensor_readings(machine_id, recorded_at DESC);

-- ---------------------------------------------------------------------
-- Table 4: failure_predictions
-- Machine learning predictions (Random Forest) and Explainable AI (XAI)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS failure_predictions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    machine_id VARCHAR(32) NOT NULL,
    prediction_label VARCHAR(20) NOT NULL, -- Healthy, Warning, Critical
    failure_probability REAL NOT NULL CHECK(failure_probability >= 0.0 AND failure_probability <= 1.0),
    predicted_fault VARCHAR(100),
    estimated_rul_hours REAL,              -- Remaining Useful Life in operating hours
    xai_primary_factor VARCHAR(50),        -- e.g. Vibration, Temperature
    xai_explanation_json TEXT NOT NULL,    -- JSON breakdown of % changes from baseline
    predicted_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (machine_id) REFERENCES machines(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_failure_predictions_machine 
ON failure_predictions(machine_id, predicted_at DESC);

-- ---------------------------------------------------------------------
-- Table 5: maintenance_logs
-- Prescriptive Co-Pilot maintenance work orders, actions and completion
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS maintenance_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    machine_id VARCHAR(32) NOT NULL,
    problem_title VARCHAR(150) NOT NULL,
    possible_cause TEXT NOT NULL,
    recommended_action TEXT NOT NULL,
    priority_level VARCHAR(20) NOT NULL DEFAULT 'Medium', -- Low, Medium, High, Critical
    estimated_repair_time_hrs REAL NOT NULL,
    estimated_repair_cost_inr REAL NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'Pending',        -- Pending, In Progress, Resolved
    assigned_technician VARCHAR(100),
    resolved_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (machine_id) REFERENCES machines(id) ON DELETE CASCADE
);

-- ---------------------------------------------------------------------
-- Table 6: alerts
-- Dispatched WhatsApp and dashboard notification records
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS alerts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    machine_id VARCHAR(32) NOT NULL,
    alert_title VARCHAR(150) NOT NULL,
    severity VARCHAR(20) NOT NULL, -- Info, Warning, Critical
    message_content TEXT NOT NULL,
    whatsapp_dispatched BOOLEAN NOT NULL DEFAULT 1,
    recipient_phone VARCHAR(20) NOT NULL,
    is_acknowledged BOOLEAN NOT NULL DEFAULT 0,
    acknowledged_by VARCHAR(100),
    acknowledged_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (machine_id) REFERENCES machines(id) ON DELETE CASCADE
);

-- ---------------------------------------------------------------------
-- Table 7: cost_analysis
-- Financial ROI, downtime loss calculations and net savings in Indian Rupees
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS cost_analysis (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    machine_id VARCHAR(32) NOT NULL,
    fault_detected VARCHAR(100) NOT NULL,
    expected_downtime_hrs REAL NOT NULL,
    production_loss_inr REAL NOT NULL,
    repair_cost_today_inr REAL NOT NULL,
    repair_cost_post_failure_inr REAL NOT NULL,
    estimated_savings_inr REAL NOT NULL,
    roi_multiple REAL NOT NULL,
    calculated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (machine_id) REFERENCES machines(id) ON DELETE CASCADE
);

-- ---------------------------------------------------------------------
-- Table 8: chat_history
-- Natural language conversational interactions with the Plant Assistant
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS chat_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id VARCHAR(50) NOT NULL,
    machine_id VARCHAR(32),
    user_query TEXT NOT NULL,
    bot_response TEXT NOT NULL,
    intent_detected VARCHAR(50) NOT NULL,
    confidence_score REAL DEFAULT 1.0,
    timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (machine_id) REFERENCES machines(id) ON DELETE SET NULL
);

-- ---------------------------------------------------------------------
-- Table 9: users
-- MSME mill operators, supervisors, maintenance engineers & owners
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(36) PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    role VARCHAR(30) NOT NULL,            -- Mill Owner, Maintenance Supervisor, Floor Technician
    whatsapp_number VARCHAR(20) NOT NULL,
    preferred_language VARCHAR(10) NOT NULL DEFAULT 'en', -- en (English), ta (Tamil), hi (Hindi)
    is_active BOOLEAN NOT NULL DEFAULT 1,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
