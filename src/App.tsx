import React, { useState } from 'react';
import {
  Activity,
  Cpu,
  Layers,
  Database,
  GitBranch,
  Network,
  Server,
  Workflow,
  Radio,
  FileCode2,
  Table,
  CheckCircle2,
  Box,
  ChevronRight,
  ShieldAlert,
  Gauge,
  Zap,
  Key,
  Link,
  BookOpen,
  DollarSign,
  MessageSquare,
  Volume2,
  Clock,
  Terminal,
  Search,
  Filter
} from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'architecture' | 'schema' | 'sample_data' | 'folder' | 'apis' | 'dataflow'>('schema');
  const [selectedTable, setSelectedTable] = useState<string>('machines');

  const machines = [
    { name: 'Spinning Machine (Rotor/Ring)', id: 'SPN-01', status: 'Healthy', temp: '42.5°C', vib: '0.42g', current: '5.8A', sound: '64.5dB', icon: '🧵' },
    { name: 'Air Jet Weaving Loom', id: 'WVE-03', status: 'Warning', temp: '68.2°C', vib: '1.45g', current: '9.2A', sound: '84.1dB', icon: '🧶' },
    { name: 'Circular Knitting Machine', id: 'KNT-02', status: 'Healthy', temp: '44.0°C', vib: '0.35g', current: '4.2A', sound: '60.0dB', icon: '🪡' },
    { name: 'High-Temp Dyeing Machine', id: 'DYE-04', status: 'Healthy', temp: '52.0°C', vib: '0.50g', current: '7.0A', sound: '66.0dB', icon: '🧪' },
    { name: 'Carding Main Motor (25HP)', id: 'MTR-05', status: 'Critical', temp: '88.4°C', vib: '2.15g', current: '14.2A', sound: '96.0dB', icon: '⚡' },
    { name: 'Pneumatic Loom Compressor', id: 'CMP-06', status: 'Warning', temp: '76.0°C', vib: '1.20g', current: '11.8A', sound: '88.0dB', icon: '💨' }
  ];

  const schemaDefinitions: Record<string, {
    desc: string;
    pk: string;
    fk: string;
    columns: Array<{ name: string; type: string; constraints: string; note: string }>;
    sampleRows: Array<Record<string, any>>;
  }> = {
    machines: {
      desc: 'Master catalog of textile MSME machinery assets with nominal baselines',
      pk: 'id (VARCHAR(32))',
      fk: 'None (Root Entity)',
      columns: [
        { name: 'id', type: 'VARCHAR(32)', constraints: 'PRIMARY KEY', note: 'Unique machine code e.g. SPN-01, WVE-03' },
        { name: 'name', type: 'VARCHAR(100)', constraints: 'NOT NULL', note: 'Standard asset name in textile plant' },
        { name: 'type', type: 'VARCHAR(50)', constraints: 'NOT NULL', note: 'Spinning, Weaving, Knitting, Dyeing, Motor, Compressor' },
        { name: 'location_section', type: 'VARCHAR(50)', constraints: 'NOT NULL', note: 'Plant shed e.g. Ring Spinning Shed A' },
        { name: 'rated_power_kw', type: 'REAL', constraints: 'NOT NULL', note: 'Nominal electric power rating in kW' },
        { name: 'baseline_temp', type: 'REAL', constraints: 'NOT NULL DEFAULT 45.0', note: 'Nominal operational temperature (°C)' },
        { name: 'baseline_vib', type: 'REAL', constraints: 'NOT NULL DEFAULT 0.40', note: 'Nominal vibration root-mean-square (g)' },
        { name: 'baseline_current', type: 'REAL', constraints: 'NOT NULL DEFAULT 5.0', note: 'Nominal operational current draw (Amperes)' },
        { name: 'baseline_sound', type: 'REAL', constraints: 'NOT NULL DEFAULT 65.0', note: 'Nominal operational acoustic loudness (dB)' },
        { name: 'manufacturer', type: 'VARCHAR(100)', constraints: 'NULL', note: 'OEM manufacturer e.g. Rieter, Toyota' },
        { name: 'model_year', type: 'INTEGER', constraints: 'NULL', note: 'Manufacturing year' },
        { name: 'status', type: 'VARCHAR(20)', constraints: "DEFAULT 'Healthy'", note: 'Healthy, Warning, Critical' },
        { name: 'installed_at', type: 'TIMESTAMP', constraints: 'CURRENT_TIMESTAMP', note: 'Commissioning timestamp' },
        { name: 'last_serviced_at', type: 'TIMESTAMP', constraints: 'CURRENT_TIMESTAMP', note: 'Previous routine maintenance' }
      ],
      sampleRows: [
        { id: 'SPN-01', name: 'Spinning Machine (Rotor/Ring)', type: 'Spinning Machine', location: 'Ring Spinning Shed A', power: '45.0 kW', b_temp: '42.0°C', b_vib: '0.40g', b_curr: '5.5A', b_snd: '64.0dB', status: 'Healthy' },
        { id: 'WVE-03', name: 'Air Jet Weaving Loom', type: 'Weaving Loom', location: 'Weaving Shed B', power: '18.5 kW', b_temp: '48.0°C', b_vib: '0.45g', b_curr: '6.0A', b_snd: '68.0dB', status: 'Warning' },
        { id: 'KNT-02', name: 'Circular Knitting Machine', type: 'Knitting Machine', location: 'Knitting Unit 1', power: '11.0 kW', b_temp: '44.0°C', b_vib: '0.35g', b_curr: '4.2A', b_snd: '60.0dB', status: 'Healthy' },
        { id: 'DYE-04', name: 'High-Temp Dyeing Machine', type: 'Dyeing Machine', location: 'Wet Processing Bay', power: '30.0 kW', b_temp: '52.0°C', b_vib: '0.50g', b_curr: '7.0A', b_snd: '66.0dB', status: 'Healthy' },
        { id: 'MTR-05', name: 'Carding Main Drive Motor (25HP)', type: 'Industrial Motor', location: 'Blowroom Section', power: '18.7 kW', b_temp: '46.0°C', b_vib: '0.42g', b_curr: '5.2A', b_snd: '65.0dB', status: 'Critical' },
        { id: 'CMP-06', name: 'Pneumatic Loom Compressor', type: 'Compressor', location: 'Utility Plant', power: '37.0 kW', b_temp: '50.0°C', b_vib: '0.48g', b_curr: '8.0A', b_snd: '70.0dB', status: 'Warning' }
      ]
    },
    machine_health: {
      desc: 'Calculated continuous health scores (0-100) and sub-system grades',
      pk: 'id (INTEGER AUTOINCREMENT)',
      fk: 'machine_id -> machines(id) ON DELETE CASCADE',
      columns: [
        { name: 'id', type: 'INTEGER', constraints: 'PRIMARY KEY AUTOINCREMENT', note: 'Auto-incremented ID' },
        { name: 'machine_id', type: 'VARCHAR(32)', constraints: 'FOREIGN KEY -> machines(id)', note: 'Asset identifier' },
        { name: 'health_score', type: 'REAL', constraints: 'CHECK(0.0 <= val <= 100.0)', note: 'Composite index: 90-100, 70-89, 50-69, <50' },
        { name: 'category', type: 'VARCHAR(20)', constraints: 'NOT NULL', note: 'Excellent / Good / Warning / Critical' },
        { name: 'temperature_score', type: 'REAL', constraints: 'NOT NULL (0-100)', note: 'Normalized thermal condition score' },
        { name: 'vibration_score', type: 'REAL', constraints: 'NOT NULL (0-100)', note: 'Normalized vibration condition score' },
        { name: 'current_score', type: 'REAL', constraints: 'NOT NULL (0-100)', note: 'Normalized current condition score' },
        { name: 'sound_score', type: 'REAL', constraints: 'NOT NULL (0-100)', note: 'Normalized acoustic condition score' },
        { name: 'primary_risk_factor', type: 'VARCHAR(50)', constraints: 'NULL', note: 'Key driver e.g. Vibration (+35%)' },
        { name: 'updated_at', type: 'TIMESTAMP', constraints: 'CURRENT_TIMESTAMP', note: 'Last calculated timestamp' }
      ],
      sampleRows: [
        { id: 1, machine_id: 'SPN-01', health_score: 94.5, category: 'Excellent', temp_s: 96.0, vib_s: 93.0, curr_s: 95.0, snd_s: 94.0, risk: 'None' },
        { id: 2, machine_id: 'WVE-03', health_score: 64.2, category: 'Warning', temp_s: 72.0, vib_s: 55.0, curr_s: 68.0, snd_s: 62.0, risk: 'Vibration (+35%)' },
        { id: 3, machine_id: 'KNT-02', health_score: 96.0, category: 'Excellent', temp_s: 97.0, vib_s: 96.0, curr_s: 95.0, snd_s: 96.0, risk: 'None' },
        { id: 4, machine_id: 'DYE-04', health_score: 91.0, category: 'Excellent', temp_s: 90.0, vib_s: 92.0, curr_s: 91.0, snd_s: 91.0, risk: 'None' },
        { id: 5, machine_id: 'MTR-05', health_score: 42.5, category: 'Critical', temp_s: 38.0, vib_s: 44.0, curr_s: 41.0, snd_s: 47.0, risk: 'Motor Overheating & Current Spike' },
        { id: 6, machine_id: 'CMP-06', health_score: 67.8, category: 'Warning', temp_s: 65.0, vib_s: 70.0, curr_s: 66.0, snd_s: 70.0, risk: 'Pressure Overload' }
      ]
    },
    sensor_readings: {
      desc: 'High-frequency 5-second simulated IoT telemetry stream records',
      pk: 'id (INTEGER AUTOINCREMENT)',
      fk: 'machine_id -> machines(id) ON DELETE CASCADE',
      columns: [
        { name: 'id', type: 'INTEGER', constraints: 'PRIMARY KEY AUTOINCREMENT', note: 'Auto-increment' },
        { name: 'machine_id', type: 'VARCHAR(32)', constraints: 'FOREIGN KEY -> machines(id)', note: 'Indexed foreign key' },
        { name: 'temperature', type: 'REAL', constraints: 'NOT NULL (°C)', note: 'Range: 35.0°C - 90.0°C' },
        { name: 'vibration', type: 'REAL', constraints: 'NOT NULL (g)', note: 'Range: 0.1g - 2.5g' },
        { name: 'current', type: 'REAL', constraints: 'NOT NULL (A)', note: 'Range: 2.0A - 15.0A' },
        { name: 'sound', type: 'REAL', constraints: 'NOT NULL (dB)', note: 'Range: 50.0dB - 100.0dB' },
        { name: 'is_fault_injected', type: 'BOOLEAN', constraints: 'DEFAULT 0', note: 'Synthetic fault flag' },
        { name: 'fault_type', type: 'VARCHAR(50)', constraints: 'DEFAULT NULL', note: 'Fault scenario name' },
        { name: 'recorded_at', type: 'TIMESTAMP', constraints: 'CURRENT_TIMESTAMP', note: 'Indexed time column' }
      ],
      sampleRows: [
        { id: 101, machine_id: 'SPN-01', temp: '42.5°C', vib: '0.42g', current: '5.8A', sound: '64.5dB', fault_injected: 'False', fault: '-' },
        { id: 102, machine_id: 'WVE-03', temp: '68.2°C', vib: '1.45g', current: '9.2A', sound: '84.1dB', fault_injected: 'True', fault: 'Bearing Wear' },
        { id: 103, machine_id: 'MTR-05', temp: '88.4°C', vib: '2.15g', current: '14.2A', sound: '96.0dB', fault_injected: 'True', fault: 'Motor Overheating' },
        { id: 104, machine_id: 'CMP-06', temp: '76.0°C', vib: '1.20g', current: '11.8A', sound: '88.0dB', fault_injected: 'True', fault: 'High Current Draw' }
      ]
    },
    failure_predictions: {
      desc: 'Random Forest model inferences, probabilities, and Explainable AI factors',
      pk: 'id (INTEGER AUTOINCREMENT)',
      fk: 'machine_id -> machines(id) ON DELETE CASCADE',
      columns: [
        { name: 'id', type: 'INTEGER', constraints: 'PRIMARY KEY AUTOINCREMENT', note: 'Auto-increment' },
        { name: 'machine_id', type: 'VARCHAR(32)', constraints: 'FOREIGN KEY -> machines(id)', note: 'Machine asset ID' },
        { name: 'prediction_label', type: 'VARCHAR(20)', constraints: 'NOT NULL', note: 'Healthy, Warning, Critical' },
        { name: 'failure_probability', type: 'REAL', constraints: 'CHECK(0.0 <= val <= 1.0)', note: 'Continuous probability e.g. 0.89 (89%)' },
        { name: 'predicted_fault', type: 'VARCHAR(100)', constraints: 'NULL', note: 'Fault classification' },
        { name: 'estimated_rul_hours', type: 'REAL', constraints: 'NULL', note: 'Remaining Useful Life in hours' },
        { name: 'xai_primary_factor', type: 'VARCHAR(50)', constraints: 'NULL', note: 'Primary feature contributor' },
        { name: 'xai_explanation_json', type: 'TEXT', constraints: 'NOT NULL', note: 'JSON string of delta percentage shifts' },
        { name: 'predicted_at', type: 'TIMESTAMP', constraints: 'CURRENT_TIMESTAMP', note: 'Inference timestamp' }
      ],
      sampleRows: [
        { id: 1, machine_id: 'SPN-01', label: 'Healthy', prob: '4%', fault: 'None', rul: '1,850 hrs', factor: 'All Nominal', xai: 'All parameters within standard tolerance' },
        { id: 2, machine_id: 'WVE-03', label: 'Warning', prob: '68%', fault: 'Bearing Wear', rul: '72 hrs', factor: 'Vibration', xai: 'Vibration +35.2%, Current +22.1%' },
        { id: 3, machine_id: 'MTR-05', label: 'Critical', prob: '89%', fault: 'Motor Overheating', rul: '8.5 hrs', factor: 'Temperature & Current', xai: 'Temperature +92.1%, Current +173.0%' },
        { id: 4, machine_id: 'CMP-06', label: 'Warning', prob: '61%', fault: 'High Current Draw', rul: '94 hrs', factor: 'Current', xai: 'Current draw +47.5% over rated load' }
      ]
    },
    maintenance_logs: {
      desc: 'Prescriptive Co-Pilot troubleshooting work orders, causes, SOPs, and costs',
      pk: 'id (INTEGER AUTOINCREMENT)',
      fk: 'machine_id -> machines(id) ON DELETE CASCADE',
      columns: [
        { name: 'id', type: 'INTEGER', constraints: 'PRIMARY KEY AUTOINCREMENT', note: 'Auto-increment ticket ID' },
        { name: 'machine_id', type: 'VARCHAR(32)', constraints: 'FOREIGN KEY -> machines(id)', note: 'Asset identifier' },
        { name: 'problem_title', type: 'VARCHAR(150)', constraints: 'NOT NULL', note: 'Identified mechanical or electrical problem' },
        { name: 'possible_cause', type: 'TEXT', constraints: 'NOT NULL', note: 'Root cause analysis' },
        { name: 'recommended_action', type: 'TEXT', constraints: 'NOT NULL', note: 'Step-by-step Standard Operating Procedure' },
        { name: 'priority_level', type: 'VARCHAR(20)', constraints: "DEFAULT 'Medium'", note: 'Low, Medium, High, Critical' },
        { name: 'estimated_repair_time_hrs', type: 'REAL', constraints: 'NOT NULL', note: 'Standard bench repair time' },
        { name: 'estimated_repair_cost_inr', type: 'REAL', constraints: 'NOT NULL', note: 'Cost in Indian Rupees (₹)' },
        { name: 'status', type: 'VARCHAR(20)', constraints: "DEFAULT 'Pending'", note: 'Pending, In Progress, Resolved' },
        { name: 'assigned_technician', type: 'VARCHAR(100)', constraints: 'NULL', note: 'Technician name' },
        { name: 'resolved_at', type: 'TIMESTAMP', constraints: 'NULL', note: 'Sign-off timestamp' },
        { name: 'created_at', type: 'TIMESTAMP', constraints: 'CURRENT_TIMESTAMP', note: 'Creation timestamp' }
      ],
      sampleRows: [
        { id: 1, machine_id: 'WVE-03', problem: 'Bearing Wear on Main Sley Drive', priority: 'High', time: '2.0 hrs', cost: '₹800', status: 'Pending', tech: 'Rajesh Kumar' },
        { id: 2, machine_id: 'MTR-05', problem: 'Carding Motor Severe Stator Thermal Overload', priority: 'Critical', time: '3.5 hrs', cost: '₹1,500', status: 'In Progress', tech: 'Amit Verma' }
      ]
    },
    alerts: {
      desc: 'Dispatched WhatsApp and dashboard notification records',
      pk: 'id (INTEGER AUTOINCREMENT)',
      fk: 'machine_id -> machines(id) ON DELETE CASCADE',
      columns: [
        { name: 'id', type: 'INTEGER', constraints: 'PRIMARY KEY AUTOINCREMENT', note: 'Alert record ID' },
        { name: 'machine_id', type: 'VARCHAR(32)', constraints: 'FOREIGN KEY -> machines(id)', note: 'Associated machine' },
        { name: 'alert_title', type: 'VARCHAR(150)', constraints: 'NOT NULL', note: 'Header text' },
        { name: 'severity', type: 'VARCHAR(20)', constraints: 'NOT NULL', note: 'Info, Warning, Critical' },
        { name: 'message_content', type: 'TEXT', constraints: 'NOT NULL', note: 'Full WhatsApp formatted markdown' },
        { name: 'whatsapp_dispatched', type: 'BOOLEAN', constraints: 'DEFAULT 1', note: 'Delivery status' },
        { name: 'recipient_phone', type: 'VARCHAR(20)', constraints: 'NOT NULL', note: 'Mobile number (+91...)' },
        { name: 'is_acknowledged', type: 'BOOLEAN', constraints: 'DEFAULT 0', note: 'Technician acknowledgement' },
        { name: 'acknowledged_by', type: 'VARCHAR(100)', constraints: 'NULL', note: 'Name of user' },
        { name: 'acknowledged_at', type: 'TIMESTAMP', constraints: 'NULL', note: 'Ack time' },
        { name: 'created_at', type: 'TIMESTAMP', constraints: 'CURRENT_TIMESTAMP', note: 'Trigger time' }
      ],
      sampleRows: [
        { id: 1, machine_id: 'WVE-03', title: 'FactoryPulse Alert: Bearing Wear Detected', severity: 'Warning', phone: '+919842100002', ack: 'No', msg: '🚨 Weaving Loom 3: Bearing Wear. Health: 64.2%. Action: Inspect within 24h.' },
        { id: 2, machine_id: 'MTR-05', title: 'CRITICAL ALERT: 25HP Motor Overheating', severity: 'Critical', phone: '+919842100001', ack: 'Yes (Murugan)', msg: '🔥 Carding Motor (88.4°C, 14.2A). Failure Risk: 89%. Immediate stop required.' }
      ]
    },
    cost_analysis: {
      desc: 'Financial downtime ROI, production losses, and net savings in INR',
      pk: 'id (INTEGER AUTOINCREMENT)',
      fk: 'machine_id -> machines(id) ON DELETE CASCADE',
      columns: [
        { name: 'id', type: 'INTEGER', constraints: 'PRIMARY KEY AUTOINCREMENT', note: 'Record ID' },
        { name: 'machine_id', type: 'VARCHAR(32)', constraints: 'FOREIGN KEY -> machines(id)', note: 'Asset identifier' },
        { name: 'fault_detected', type: 'VARCHAR(100)', constraints: 'NOT NULL', note: 'Fault typology' },
        { name: 'expected_downtime_hrs', type: 'REAL', constraints: 'NOT NULL', note: 'Estimated outage duration' },
        { name: 'production_loss_inr', type: 'REAL', constraints: 'NOT NULL', note: 'Lost textile production revenue (₹)' },
        { name: 'repair_cost_today_inr', type: 'REAL', constraints: 'NOT NULL', note: 'Cost of proactive component replacement (₹)' },
        { name: 'repair_cost_post_failure_inr', type: 'REAL', constraints: 'NOT NULL', note: 'Catastrophic post-breakdown overhaul cost (₹)' },
        { name: 'estimated_savings_inr', type: 'REAL', constraints: 'NOT NULL', note: 'Net MSME direct financial savings (₹)' },
        { name: 'roi_multiple', type: 'REAL', constraints: 'NOT NULL', note: 'Return on Maintenance Multiple (x)' },
        { name: 'calculated_at', type: 'TIMESTAMP', constraints: 'CURRENT_TIMESTAMP', note: 'Analysis timestamp' }
      ],
      sampleRows: [
        { id: 1, machine_id: 'WVE-03', fault: 'Bearing Wear', downtime: '6.0 hrs', prod_loss: '₹12,000', repair_today: '₹800', repair_after: '₹6,500', savings: '₹5,700', roi: '7.1x' },
        { id: 2, machine_id: 'MTR-05', fault: 'Motor Overheating / Burnout', downtime: '14.0 hrs', prod_loss: '₹38,500', repair_today: '₹1,500', repair_after: '₹18,500', savings: '₹17,000', roi: '11.3x' },
        { id: 3, machine_id: 'CMP-06', fault: 'Compressor High Load / Valve Leak', downtime: '5.0 hrs', prod_loss: '₹9,500', repair_today: '₹1,200', repair_after: '₹5,400', savings: '₹4,200', roi: '3.5x' }
      ]
    },
    chat_history: {
      desc: 'Plant Assistant NLP conversation logs, queries, and detected intents',
      pk: 'id (INTEGER AUTOINCREMENT)',
      fk: 'machine_id -> machines(id) ON DELETE SET NULL',
      columns: [
        { name: 'id', type: 'INTEGER', constraints: 'PRIMARY KEY AUTOINCREMENT', note: 'Message ID' },
        { name: 'user_id', type: 'VARCHAR(50)', constraints: 'NOT NULL', note: 'User identifier' },
        { name: 'machine_id', type: 'VARCHAR(32)', constraints: 'FOREIGN KEY -> machines(id) NULL', note: 'Contextual machine' },
        { name: 'user_query', type: 'TEXT', constraints: 'NOT NULL', note: 'Natural language input' },
        { name: 'bot_response', type: 'TEXT', constraints: 'NOT NULL', note: 'Co-Pilot guidance answer' },
        { name: 'intent_detected', type: 'VARCHAR(50)', constraints: 'NOT NULL', note: 'Classified intent' },
        { name: 'confidence_score', type: 'REAL', constraints: 'DEFAULT 1.0', note: 'Classifier confidence' },
        { name: 'timestamp', type: 'TIMESTAMP', constraints: 'CURRENT_TIMESTAMP', note: 'Log timestamp' }
      ],
      sampleRows: [
        { id: 1, user_id: 'usr-001', machine: 'WVE-03', query: 'Machine 3 status?', intent: 'machine_status_query', response: 'Air Jet Weaving Loom 3 is in Warning condition (64.2% Health). High vibration 1.45g detected.' },
        { id: 2, user_id: 'usr-002', machine: 'MTR-05', query: 'Any critical machines right now?', intent: 'fleet_critical_query', response: '1 critical machine: Carding Motor MTR-05 reached 88.4°C and drawing 14.2A. 89% failure probability.' },
        { id: 3, user_id: 'usr-001', machine: 'All Fleet', query: 'What is our business impact today?', intent: 'cost_impact_query', response: 'Proactive maintenance on Loom 3 and Motor 5 saves an estimated ₹22,700 and prevents 20 hours downtime.' }
      ]
    },
    users: {
      desc: 'MSME mill operators, supervisors, maintenance engineers & owners',
      pk: 'id (VARCHAR(36))',
      fk: 'None',
      columns: [
        { name: 'id', type: 'VARCHAR(36)', constraints: 'PRIMARY KEY', note: 'Unique user UUID / ID' },
        { name: 'full_name', type: 'VARCHAR(100)', constraints: 'NOT NULL', note: 'Full name' },
        { name: 'email', type: 'VARCHAR(100)', constraints: 'UNIQUE NOT NULL', note: 'Contact email' },
        { name: 'role', type: 'VARCHAR(30)', constraints: 'NOT NULL', note: 'Mill Owner, Maintenance Supervisor, Floor Technician' },
        { name: 'whatsapp_number', type: 'VARCHAR(20)', constraints: 'NOT NULL', note: 'WhatsApp mobile number for instant alerts' },
        { name: 'preferred_language', type: 'VARCHAR(10)', constraints: "DEFAULT 'en'", note: 'en (English), ta (Tamil), hi (Hindi)' },
        { name: 'is_active', type: 'BOOLEAN', constraints: 'DEFAULT 1', note: 'Account status' },
        { name: 'created_at', type: 'TIMESTAMP', constraints: 'CURRENT_TIMESTAMP', note: 'Creation timestamp' }
      ],
      sampleRows: [
        { id: 'usr-001', name: 'Murugan Sundaram', role: 'Mill Owner', email: 'murugan@textilemill.in', phone: '+919842100001', lang: 'ta (Tamil)', active: 'True' },
        { id: 'usr-002', name: 'Rajesh Kumar', role: 'Maintenance Supervisor', email: 'rajesh.maint@textilemill.in', phone: '+919842100002', lang: 'en (English)', active: 'True' },
        { id: 'usr-003', name: 'Amit Verma', role: 'Floor Technician', email: 'amit.tech@textilemill.in', phone: '+919842100003', lang: 'hi (Hindi)', active: 'True' }
      ]
    }
  };

  const currentTableData = schemaDefinitions[selectedTable];

  return (
    <div className="min-h-screen bg-[#0b0f19] text-slate-100 flex flex-col font-sans selection:bg-cyan-500/30">
      {/* Top Header */}
      <header className="border-b border-slate-800 bg-[#0d1424]/90 backdrop-blur sticky top-0 z-50 px-6 py-3.5 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 via-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 ring-1 ring-cyan-400/30">
            <Activity className="w-6 h-6 text-white animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                FactoryPulse <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400">AI</span>
              </h1>
              <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-950 border border-emerald-800 text-emerald-300 font-mono font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Phase 2 Database Verified
              </span>
            </div>
            <p className="text-xs text-slate-400">AI Maintenance Co-Pilot for Textile MSMEs • SQLite 3 (WAL Mode Active)</p>
          </div>
        </div>

        {/* Global Stats Preview */}
        <div className="hidden lg:flex items-center gap-4 text-xs">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800">
            <Database className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-slate-400">Relational Tables:</span>
            <span className="text-cyan-300 font-mono font-bold">9 Tables</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800">
            <Link className="w-3.5 h-3.5 text-indigo-400" />
            <span className="text-slate-400">Foreign Key Cascades:</span>
            <span className="text-indigo-300 font-mono font-bold">8 Cascades</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800">
            <DollarSign className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-slate-400">Preventive Savings Seeded:</span>
            <span className="text-amber-300 font-mono font-bold">₹26,900</span>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Sidebar Nav */}
        <aside className="w-full md:w-64 border-r border-slate-800 bg-[#0d1322] p-4 flex flex-col gap-1.5 shrink-0">
          <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-semibold px-2 py-1 flex items-center justify-between">
            <span>Navigation Deck</span>
            <span className="text-cyan-400">Phase 2</span>
          </div>

          {[
            { id: 'schema', label: 'Database Schema (9 Tables)', icon: Database },
            { id: 'sample_data', label: 'Live Data Inspector', icon: Table },
            { id: 'architecture', label: 'System Architecture (Phase 1)', icon: Network },
            { id: 'apis', label: 'API Architecture (v1)', icon: Server },
            { id: 'dataflow', label: 'Data Flow & Telemetry Bus', icon: GitBranch },
            { id: 'folder', label: 'Folder Structure', icon: FileCode2 }
          ].map(tab => {
            const Icon = tab.icon;
            const isSelected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium text-left transition-all ${
                  isSelected
                    ? 'bg-gradient-to-r from-cyan-900/60 to-blue-900/40 text-cyan-200 border border-cyan-700/50 shadow-sm shadow-cyan-950'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isSelected ? 'text-cyan-400' : 'text-slate-400'}`} />
                <span className="truncate">{tab.label}</span>
                {isSelected && <ChevronRight className="w-3.5 h-3.5 ml-auto text-cyan-400" />}
              </button>
            );
          })}

          <div className="mt-4 pt-3 border-t border-slate-800/80">
            <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-semibold px-2 mb-2">
              Select SQLite Table:
            </div>
            <div className="space-y-1">
              {Object.keys(schemaDefinitions).map((tbl) => (
                <button
                  key={tbl}
                  onClick={() => {
                    setSelectedTable(tbl);
                    if (activeTab !== 'schema' && activeTab !== 'sample_data') {
                      setActiveTab('schema');
                    }
                  }}
                  className={`w-full text-left px-2.5 py-1.5 rounded text-xs font-mono flex items-center justify-between transition ${
                    selectedTable === tbl
                      ? 'bg-cyan-950 text-cyan-300 border border-cyan-800 font-bold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                  }`}
                >
                  <span className="truncate">{tbl}</span>
                  {selectedTable === tbl && <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-auto pt-4 border-t border-slate-800/80">
            <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                <span className="text-xs font-semibold text-slate-200">Execution Phase: 2 of 20</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Phase 2 completes database design & seed verification. Next phase: Phase 3 (SIMULATED IOT ENGINE).
              </p>
            </div>
          </div>
        </aside>

        {/* Content View Area */}
        <main className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Quick Machine Fleet Banner */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-slate-900 via-slate-900/90 to-[#101b33] border border-slate-800">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Gauge className="w-4 h-4 text-cyan-400" />
                <h2 className="text-sm font-semibold text-slate-200">Textile MSME Machine Assets in SQLite (`machines` Table)</h2>
              </div>
              <span className="text-xs text-slate-400 font-mono">6 Seeded Records • Primary Keys: SPN-01 to CMP-06</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-2.5">
              {machines.map((m) => (
                <div key={m.id} className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800 hover:border-slate-700 transition">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-base">{m.icon}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-semibold ${
                      m.status === 'Healthy' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/60' :
                      m.status === 'Warning' ? 'bg-amber-950 text-amber-400 border border-amber-800/60' :
                      'bg-rose-950 text-rose-400 border border-rose-800/60'
                    }`}>
                      {m.status}
                    </span>
                  </div>
                  <div className="font-semibold text-xs text-slate-200 truncate">{m.id}</div>
                  <div className="text-[10px] text-slate-400 truncate mb-1.5">{m.name}</div>
                  <div className="grid grid-cols-2 gap-x-1 text-[10px] font-mono text-slate-400 border-t border-slate-800/60 pt-1">
                    <span>T: <b className="text-slate-300">{m.temp}</b></span>
                    <span>V: <b className="text-slate-300">{m.vib}</b></span>
                    <span>I: <b className="text-slate-300">{m.current}</b></span>
                    <span>S: <b className="text-slate-300">{m.sound}</b></span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Phase 2: Schema Viewer */}
          {activeTab === 'schema' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800 pb-3 gap-3">
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <Database className="w-5 h-5 text-cyan-400" />
                    Table Schema Inspector: <span className="font-mono text-cyan-300">`{selectedTable}`</span>
                  </h3>
                  <p className="text-xs text-slate-400">{currentTableData.desc}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 bg-cyan-950 text-cyan-300 border border-cyan-800 text-xs rounded font-mono flex items-center gap-1.5">
                    <Key className="w-3.5 h-3.5" /> PK: {currentTableData.pk}
                  </span>
                  <span className="px-2.5 py-1 bg-indigo-950 text-indigo-300 border border-indigo-800 text-xs rounded font-mono flex items-center gap-1.5">
                    <Link className="w-3.5 h-3.5" /> FK: {currentTableData.fk}
                  </span>
                </div>
              </div>

              {/* Table Column Definitions */}
              <div className="rounded-xl border border-slate-800 bg-[#0d1322] overflow-hidden">
                <div className="p-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-200 font-mono">Column Structure ({currentTableData.columns.length} Fields)</span>
                  <button
                    onClick={() => setActiveTab('sample_data')}
                    className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-mono text-[11px]"
                  >
                    <Table className="w-3.5 h-3.5" /> View Seeded Records &rarr;
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-800 bg-slate-950/60 font-mono text-slate-400">
                        <th className="py-2.5 px-4">Column Name</th>
                        <th className="py-2.5 px-4">Data Type</th>
                        <th className="py-2.5 px-4">Constraints & Defaults</th>
                        <th className="py-2.5 px-4">Industry 4.0 Functional Role</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-mono">
                      {currentTableData.columns.map((c, idx) => (
                        <tr key={idx} className="hover:bg-slate-900/40 transition">
                          <td className="py-2.5 px-4 font-bold text-cyan-300 flex items-center gap-1.5">
                            {c.name === 'id' ? <Key className="w-3 h-3 text-amber-400 shrink-0" /> : null}
                            {c.name.includes('_id') ? <Link className="w-3 h-3 text-indigo-400 shrink-0" /> : null}
                            {c.name}
                          </td>
                          <td className="py-2.5 px-4 text-purple-300">{c.type}</td>
                          <td className="py-2.5 px-4 text-emerald-400 text-[11px]">{c.constraints}</td>
                          <td className="py-2.5 px-4 text-slate-400 text-[11px] font-sans">{c.note}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Quick ER Summary */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
                  <div className="flex items-center gap-2 mb-2 text-cyan-300 text-xs font-mono font-bold">
                    <Key className="w-4 h-4 text-cyan-400" />
                    Primary Key Integrity
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Textile assets use explicit human-readable operational codes (e.g., <code className="text-cyan-300">SPN-01</code>, <code className="text-cyan-300">WVE-03</code>) for zero-ambiguity shop floor tagging. Time-series and transactional tables leverage 64-bit autoincrementing integers.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
                  <div className="flex items-center gap-2 mb-2 text-indigo-300 text-xs font-mono font-bold">
                    <Link className="w-4 h-4 text-indigo-400" />
                    Foreign Key Cascades
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    All telemetry, health logs, failure predictions, alerts, and cost analysis records enforce <code className="text-indigo-300 font-mono">ON DELETE CASCADE</code> linking back to <code className="text-indigo-300 font-mono">machines.id</code> with foreign keys enforced via SQLite PRAGMA.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
                  <div className="flex items-center gap-2 mb-2 text-emerald-300 text-xs font-mono font-bold">
                    <Zap className="w-4 h-4 text-emerald-400" />
                    WAL Mode & Performance
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Write-Ahead Logging (<code className="text-emerald-300 font-mono">PRAGMA journal_mode = WAL</code>) guarantees non-blocking concurrent writes for the 5-second simulated IoT engine while the React dashboard polls for predictions.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Tab: Sample Data Inspector */}
          {activeTab === 'sample_data' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800 pb-3 gap-3">
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <Table className="w-5 h-5 text-cyan-400" />
                    Sample Data Inspector: <span className="font-mono text-cyan-300">`{selectedTable}`</span>
                  </h3>
                  <p className="text-xs text-slate-400">Production-representative sample records seeded into SQLite database</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 bg-slate-800 text-slate-300 rounded text-xs font-mono">
                    {currentTableData.sampleRows.length} Sample Records
                  </span>
                </div>
              </div>

              {/* Data Table */}
              <div className="rounded-xl border border-slate-800 bg-[#0d1322] overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-800 bg-slate-950/80 font-mono text-slate-400">
                        {Object.keys(currentTableData.sampleRows[0] || {}).map((k) => (
                          <th key={k} className="py-2.5 px-4 uppercase text-[10px] tracking-wider text-slate-400">
                            {k}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-mono">
                      {currentTableData.sampleRows.map((row, idx) => (
                        <tr key={idx} className="hover:bg-slate-900/60 transition">
                          {Object.values(row).map((val: any, colIdx) => (
                            <td key={colIdx} className="py-2.5 px-4 text-slate-300 whitespace-nowrap">
                              {typeof val === 'string' && val.includes('Healthy') ? (
                                <span className="px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800/60 text-[10px]">Healthy</span>
                              ) : typeof val === 'string' && val.includes('Warning') ? (
                                <span className="px-1.5 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800/60 text-[10px]">Warning</span>
                              ) : typeof val === 'string' && val.includes('Critical') ? (
                                <span className="px-1.5 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800/60 text-[10px]">Critical</span>
                              ) : typeof val === 'string' && val.startsWith('₹') ? (
                                <span className="text-emerald-400 font-bold">{val}</span>
                              ) : (
                                String(val)
                              )}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Tab: System Architecture (Phase 1 preserved) */}
          {activeTab === 'architecture' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Network className="w-5 h-5 text-cyan-400" /> Complete System Architecture
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
                  <div className="font-bold text-cyan-400 mb-2">1. IoT Simulation</div>
                  <p className="text-slate-400">5s physics simulation of T, V, I, S across 6 textile machines with 6 fault signatures.</p>
                </div>
                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
                  <div className="font-bold text-indigo-400 mb-2">2. FastAPI & SQLite</div>
                  <p className="text-slate-400">Asynchronous REST backend with WAL-mode SQLite database preserving 9 relational tables.</p>
                </div>
                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
                  <div className="font-bold text-purple-400 mb-2">3. Dual AI Pipeline</div>
                  <p className="text-slate-400">Continuous 0-100 Health Engine, Random Forest failure prediction, and Isolation Forest anomalies.</p>
                </div>
                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
                  <div className="font-bold text-emerald-400 mb-2">4. Co-Pilot UI</div>
                  <p className="text-slate-400">React 19 dashboard, WhatsApp alert dispatch cards, plant chatbot, and multilingual voice player.</p>
                </div>
              </div>
            </div>
          )}

          {/* Tab: APIs (Phase 1 preserved) */}
          {activeTab === 'apis' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Server className="w-5 h-5 text-cyan-400" /> API Architecture
                </h3>
              </div>
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-slate-300 space-y-2">
                <div>• <span className="text-cyan-400">GET /api/v1/machines</span> - Master fleet listing</div>
                <div>• <span className="text-cyan-400">GET /api/v1/sensors/live/&#123;machine_id&#125;</span> - 5s real-time telemetry</div>
                <div>• <span className="text-cyan-400">GET /api/v1/health/&#123;machine_id&#125;</span> - Composite health score (0-100)</div>
                <div>• <span className="text-cyan-400">POST /api/v1/predict/failure</span> - Random Forest failure prediction</div>
                <div>• <span className="text-cyan-400">GET /api/v1/cost/impact/&#123;machine_id&#125;</span> - MSME downtime financial impact in ₹</div>
                <div>• <span className="text-cyan-400">POST /api/v1/chat/query</span> - Natural language plant query</div>
                <div>• <span className="text-cyan-400">GET /api/v1/voice/script/&#123;machine_id&#125;</span> - Vernacular voice scripts (EN/TA/HI)</div>
              </div>
            </div>
          )}

          {/* Tab: Dataflow (Phase 1 preserved) */}
          {activeTab === 'dataflow' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <GitBranch className="w-5 h-5 text-cyan-400" /> End-to-End Data Flow Pipeline
                </h3>
              </div>
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-slate-300 leading-relaxed">
                [5s IoT Simulator] ──&gt; [SQLite `sensor_readings`] ──&gt; [Health Score Engine] + [Random Forest]
                <br />──&gt; [Explainable AI Attribution] ──&gt; [Prescriptive Co-Pilot Action]
                <br />──&gt; [MSME Cost Impact in ₹] ──&gt; [WhatsApp Alert Card Dispatch] + [Voice Audio]
              </div>
            </div>
          )}

          {/* Tab: Folder Structure */}
          {activeTab === 'folder' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <FileCode2 className="w-5 h-5 text-cyan-400" /> Folder Structure
                </h3>
              </div>
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-slate-300 leading-relaxed overflow-x-auto">
                <pre>{`factorypulse-ai/
├── backend/
│   ├── database/
│   │   ├── schema.sql           # Complete SQLite DDL (all 9 tables)
│   │   ├── init_db.py           # Seeder & table initializer script
│   │   └── factorypulse.db      # Live SQLite database file (WAL mode)
│   ├── app/
│   │   └── models/
│   │       ├── machine.py       # machines & machine_health
│   │       ├── sensor.py        # sensor_readings time-series
│   │       ├── maintenance.py   # maintenance_logs & failure_predictions
│   │       ├── alert.py         # alerts & chat_history
│   │       ├── cost.py          # cost_analysis
│   │       └── user.py          # users
├── frontend/
└── docker-compose.yml`}</pre>
              </div>
            </div>
          )}

          {/* Phase 2 Completion Banner */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-950/70 via-teal-950/50 to-cyan-950/70 border border-emerald-800/80 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">PHASE 2 COMPLETE: Database Design & SQLite Seeding Verified</h4>
                <p className="text-xs text-slate-300">
                  All 9 relational tables, constraints, foreign keys, indexes, and sample records are executed and verified. Awaiting your command <span className="font-mono text-emerald-300 font-bold bg-emerald-950 px-1.5 py-0.5 rounded border border-emerald-800">&quot;CONTINUE&quot;</span> to begin <b>PHASE 3: SIMULATED IOT ENGINE</b>.
                </p>
              </div>
            </div>
            <div className="hidden sm:flex items-center gap-2">
              <span className="text-[11px] font-mono text-emerald-400 px-3 py-1 rounded-full bg-emerald-950 border border-emerald-700">
                Standing by for CONTINUE
              </span>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
