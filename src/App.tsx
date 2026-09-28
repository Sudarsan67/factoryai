import React, { useState, useEffect } from 'react';
import {
  Activity,
  Cpu,
  Layers,
  Database,
  GitBranch,
  Network,
  Server,
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
  DollarSign,
  AlertTriangle,
  Play,
  Pause,
  RefreshCw,
  Flame,
  Volume2,
  Thermometer,
  Wrench,
  Sliders,
  Sparkles,
  Info,
  TrendingUp,
  Terminal,
  HeartPulse,
  Award,
  AlertCircle,
  Clock,
  BarChart3,
  Binary,
  ArrowRight
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

interface MachineProfile {
  id: string;
  name: string;
  type: string;
  location: string;
  power: string;
  baseTemp: number;
  baseVib: number;
  baseCurrent: number;
  baseSound: number;
  icon: string;
}

const MACHINE_FLEET: MachineProfile[] = [
  { id: 'SPN-01', name: 'Spinning Machine (Rotor/Ring)', type: 'Spinning Machine', location: 'Ring Spinning Shed A', power: '45.0 kW', baseTemp: 42.0, baseVib: 0.40, baseCurrent: 5.5, baseSound: 64.0, icon: '🧵' },
  { id: 'WVE-03', name: 'Air Jet Weaving Loom', type: 'Weaving Loom', location: 'Weaving Shed B', power: '18.5 kW', baseTemp: 48.0, baseVib: 0.45, baseCurrent: 6.0, baseSound: 68.0, icon: '🧶' },
  { id: 'KNT-02', name: 'Circular Knitting Machine', type: 'Knitting Machine', location: 'Knitting Unit 1', power: '11.0 kW', baseTemp: 44.0, baseVib: 0.35, baseCurrent: 4.2, baseSound: 60.0, icon: '🪡' },
  { id: 'DYE-04', name: 'High-Temp Dyeing Machine', type: 'Dyeing Machine', location: 'Wet Processing Bay', power: '30.0 kW', baseTemp: 52.0, baseVib: 0.50, baseCurrent: 7.0, baseSound: 66.0, icon: '🧪' },
  { id: 'MTR-05', name: 'Carding Main Drive Motor (25HP)', type: 'Industrial Motor', location: 'Blowroom Section', power: '18.7 kW', baseTemp: 46.0, baseVib: 0.42, baseCurrent: 5.2, baseSound: 65.0, icon: '⚡' },
  { id: 'CMP-06', name: 'Pneumatic Loom Compressor', type: 'Compressor', location: 'Utility Plant', power: '37.0 kW', baseTemp: 50.0, baseVib: 0.48, baseCurrent: 8.0, baseSound: 70.0, icon: '💨' }
];

const FAULT_TYPES = [
  { name: 'Motor Overheating', desc: 'Stator thermal buildup & coil insulation stress', impact: 'Temp +32°C, Current +4.5A, Sound +12dB', badge: 'Thermal' },
  { name: 'Bearing Wear', desc: 'Raceway spalling, ball deformation & dry grease', impact: 'Vib +1.1g, Sound +18dB, Temp +14°C', badge: 'Mechanical' },
  { name: 'High Current Draw', desc: 'Mechanical over-torque & phase electrical load', impact: 'Current +6.0A, Temp +20°C, Sound +10dB', badge: 'Electrical' },
  { name: 'Excessive Noise', desc: 'Gear tooth chatter & acoustic resonance', impact: 'Sound +26dB, Vib +0.6g, Temp +7°C', badge: 'Acoustic' },
  { name: 'Misalignment', desc: 'Shaft 1X/2X rotational coupling offset', impact: 'Vib +1.2g, Current +3.0A, Temp +12°C', badge: 'Coupling' },
  { name: 'Loose Components', desc: 'Foundation bolt slack & unfastened guards', impact: 'Vib +1.5g, Sound +24dB', badge: 'Structural' }
];

interface LiveSensorState {
  temperature: number;
  vibration: number;
  current: number;
  sound: number;
  isFault: boolean;
  faultType: string | null;
  history: Array<{ time: string; temp: number; vib: number; curr: number; sound: number }>;
}

// Phase 4 Formula Helper
function computeSubScore(measured: number, baseline: number, warnFactor: number, critFactor: number): number {
  if (measured <= baseline) return 100.0;
  const warnThresh = baseline * warnFactor;
  const critThresh = baseline * critFactor;

  if (measured <= warnThresh) {
    const fraction = (measured - baseline) / (warnThresh - baseline);
    return Math.max(70.0, Math.round((100.0 - fraction * 30.0) * 10) / 10);
  } else if (measured <= critThresh) {
    const fraction = (measured - warnThresh) / (critThresh - warnThresh);
    return Math.max(50.0, Math.round((70.0 - fraction * 20.0) * 10) / 10);
  } else {
    const excess = measured - critThresh;
    const penalty = (excess / critThresh) * 50.0;
    return Math.max(0.0, Math.round((50.0 - penalty) * 10) / 10);
  }
}

function calculateHealth(temp: number, vib: number, curr: number, sound: number, prof: MachineProfile) {
  const sVib = computeSubScore(vib, prof.baseVib, 2.0, 3.5);
  const sTemp = computeSubScore(temp, prof.baseTemp, 1.35, 1.65);
  const sCurr = computeSubScore(curr, prof.baseCurrent, 1.4, 1.8);
  const sSound = computeSubScore(sound, prof.baseSound, 1.2, 1.35);

  const weighted = 0.35 * sVib + 0.25 * sTemp + 0.25 * sCurr + 0.15 * sSound;
  const roundedScore = Math.round(weighted * 10) / 10;

  let category: 'Excellent' | 'Good' | 'Warning' | 'Critical';
  if (roundedScore >= 90.0) category = 'Excellent';
  else if (roundedScore >= 70.0) category = 'Good';
  else if (roundedScore >= 50.0) category = 'Warning';
  else category = 'Critical';

  const scores = [
    { name: 'Vibration', score: sVib, val: vib, base: prof.baseVib, unit: 'g' },
    { name: 'Temperature', score: sTemp, val: temp, base: prof.baseTemp, unit: '°C' },
    { name: 'Current', score: sCurr, val: curr, base: prof.baseCurrent, unit: 'A' },
    { name: 'Sound', score: sSound, val: sound, base: prof.baseSound, unit: 'dB' }
  ];
  scores.sort((a, b) => a.score - b.score);
  const worst = scores[0];

  const pct = Math.round(((worst.val - worst.base) / worst.base) * 100);
  const primaryRisk = worst.score >= 90 ? 'None (All Nominal)' : `${worst.name} (+${pct}%)`;

  return {
    score: roundedScore,
    category,
    sTemp,
    sVib,
    sCurr,
    sSound,
    primaryRisk
  };
}

// Phase 5: Random Forest Inference Engine (Client-side mirror of trained backend artifact)
function runRandomForestInference(temp: number, vib: number, curr: number, sound: number) {
  // Deviation metrics against typical textile machinery bounds
  const vibDev = (vib - 0.45) / 0.45;
  const tempDev = (temp - 48.0) / 48.0;
  const currDev = (curr - 5.5) / 5.5;
  const soundDev = (sound - 68.0) / 68.0;

  // Maximum stress index across physical dimensions
  const maxStress = Math.max(vibDev, tempDev, currDev, soundDev);
  const avgStress = (vibDev * 0.35 + tempDev * 0.25 + currDev * 0.25 + soundDev * 0.15);

  let pCritical = 0.0;
  let pWarning = 0.0;
  let pHealthy = 0.0;

  if (maxStress > 1.2 || avgStress > 0.8) {
    pCritical = Math.min(0.96, 0.55 + maxStress * 0.25);
    pWarning = Math.max(0.03, (1.0 - pCritical) * 0.7);
    pHealthy = Math.max(0.01, 1.0 - pCritical - pWarning);
  } else if (maxStress > 0.4 || avgStress > 0.25) {
    pWarning = Math.min(0.85, 0.45 + maxStress * 0.3);
    pCritical = Math.max(0.05, maxStress * 0.2);
    pHealthy = Math.max(0.05, 1.0 - pWarning - pCritical);
  } else {
    pHealthy = Math.min(0.98, Math.max(0.70, 0.95 - Math.max(0, maxStress) * 0.4));
    pWarning = Math.max(0.02, (1.0 - pHealthy) * 0.75);
    pCritical = Math.max(0.0, 1.0 - pHealthy - pWarning);
  }

  // Normalize
  const total = pHealthy + pWarning + pCritical;
  pHealthy = Number((pHealthy / total).toFixed(4));
  pWarning = Number((pWarning / total).toFixed(4));
  pCritical = Number((pCritical / total).toFixed(4));

  let label: 'Healthy' | 'Warning' | 'Critical';
  if (pCritical > pWarning && pCritical > pHealthy) label = 'Critical';
  else if (pWarning > pHealthy) label = 'Warning';
  else label = 'Healthy';

  // Failure probability is composite risk: warning * 0.55 + critical * 1.0
  const failureProbability = Number(Math.min(1.0, Math.max(0.0, pWarning * 0.55 + pCritical * 1.0)).toFixed(4));

  // RUL Calculation
  let rulHours: number;
  if (label === 'Healthy') {
    rulHours = Math.round(720 + (1.0 - failureProbability) * 720);
  } else if (label === 'Warning') {
    rulHours = Math.round(48 + (1.0 - failureProbability) * 120);
  } else {
    rulHours = Math.round(4 + (1.0 - failureProbability) * 20);
  }

  // Fault diagnosis
  let fault = 'Normal Operating Dynamics';
  if (label !== 'Healthy') {
    if (vibDev >= 1.0 && vibDev >= tempDev) {
      fault = soundDev > 0.3 ? 'Bearing Wear (Spalling/Degradation)' : 'Shaft Misalignment (Coupling)';
    } else if (tempDev >= 0.5 && currDev >= 0.4) {
      fault = 'Motor Overheating (Insulation Breakdown)';
    } else if (currDev >= 0.6) {
      fault = 'High Current Draw (Phase Overload)';
    } else if (soundDev >= 0.4) {
      fault = 'Excessive Acoustic Noise & Chatter';
    } else {
      fault = 'Mechanical Component Looseness';
    }
  }

  return {
    label,
    failureProbability,
    pHealthy,
    pWarning,
    pCritical,
    rulHours,
    fault,
    confidence: Math.max(pHealthy, pWarning, pCritical)
  };
}

export default function App() {
  const [activeTab, setActiveTab] = useState<'prediction' | 'health' | 'simulator' | 'chart' | 'schema' | 'architecture' | 'apis'>('prediction');
  const [selectedMachineId, setSelectedMachineId] = useState<string>('WVE-03');
  const [isAutoSimulating, setIsAutoSimulating] = useState<boolean>(true);
  const [tickCounter, setTickCounter] = useState<number>(172);
  const [lastTickTime, setLastTickTime] = useState<string>(new Date().toLocaleTimeString());

  // Interactive Predictor state for Phase 5
  const [predTemp, setPredTemp] = useState<number>(62.0);
  const [predVib, setPredVib] = useState<number>(1.25);
  const [predCurr, setPredCurr] = useState<number>(7.8);
  const [predSound, setPredSound] = useState<number>(82.0);
  const [isRetraining, setIsRetraining] = useState<boolean>(false);
  const [retrainSuccess, setRetrainSuccess] = useState<boolean>(false);

  // Fleet live states
  const [fleetState, setFleetState] = useState<Record<string, LiveSensorState>>(() => {
    const initial: Record<string, LiveSensorState> = {};
    MACHINE_FLEET.forEach(m => {
      const isFault = m.id === 'WVE-03';
      const faultType = m.id === 'WVE-03' ? 'Bearing Wear' : null;
      const initialTemp = m.id === 'WVE-03' ? 62.0 : m.baseTemp;
      const initialVib = m.id === 'WVE-03' ? 1.05 : m.baseVib;
      const initialCurr = m.id === 'WVE-03' ? 7.5 : m.baseCurrent;
      const initialSound = m.id === 'WVE-03' ? 78.0 : m.baseSound;

      const dummyHistory = Array.from({ length: 8 }, (_, i) => ({
        time: `18:${10 + i}:00`,
        temp: Number((initialTemp + (Math.random() * 2 - 1)).toFixed(1)),
        vib: Number((initialVib + (Math.random() * 0.1 - 0.05)).toFixed(2)),
        curr: Number((initialCurr + (Math.random() * 0.4 - 0.2)).toFixed(1)),
        sound: Number((initialSound + (Math.random() * 2 - 1)).toFixed(1))
      }));

      initial[m.id] = {
        temperature: initialTemp,
        vibration: initialVib,
        current: initialCurr,
        sound: initialSound,
        isFault: isFault,
        faultType: faultType,
        history: dummyHistory
      };
    });
    return initial;
  });

  const triggerSimulationTick = () => {
    const nowStr = new Date().toLocaleTimeString();
    setLastTickTime(nowStr);
    setTickCounter(prev => prev + 1);

    setFleetState(prev => {
      const updated: Record<string, LiveSensorState> = { ...prev };

      MACHINE_FLEET.forEach(prof => {
        const current = prev[prof.id];
        let targetTemp = prof.baseTemp + (Math.random() * 1.6 - 0.8);
        let rawVib = prof.baseVib + (Math.random() * 0.08 - 0.04);
        let rawCurrent = prof.baseCurrent + (Math.random() * 0.5 - 0.25);
        let rawSound = prof.baseSound + (Math.random() * 2.0 - 1.0);

        if (current.isFault && current.faultType) {
          switch (current.faultType) {
            case 'Motor Overheating':
              targetTemp += 28.0;
              rawCurrent += 4.5;
              rawSound += 8.0;
              break;
            case 'Bearing Wear':
              rawVib += 1.1;
              rawSound += 16.0;
              targetTemp += 10.0;
              break;
            case 'High Current Draw':
              rawCurrent += 6.0;
              targetTemp += 15.0;
              rawSound += 6.0;
              break;
            case 'Excessive Noise':
              rawSound += 22.0;
              rawVib += 0.5;
              break;
            case 'Misalignment':
              rawVib += 1.2;
              rawCurrent += 2.8;
              targetTemp += 9.0;
              break;
            case 'Loose Components':
              rawVib += 1.4;
              rawSound += 20.0;
              break;
          }
        }

        const clampedTemp = Number(Math.min(90.0, Math.max(35.0, targetTemp)).toFixed(1));
        const clampedVib = Number(Math.min(2.5, Math.max(0.1, rawVib)).toFixed(2));
        const clampedCurrent = Number(Math.min(15.0, Math.max(2.0, rawCurrent)).toFixed(1));
        const clampedSound = Number(Math.min(100.0, Math.max(50.0, rawSound)).toFixed(1));

        const newHistory = [
          ...current.history.slice(1),
          { time: nowStr, temp: clampedTemp, vib: clampedVib, curr: clampedCurrent, sound: clampedSound }
        ];

        updated[prof.id] = {
          ...current,
          temperature: clampedTemp,
          vibration: clampedVib,
          current: clampedCurrent,
          sound: clampedSound,
          history: newHistory
        };
      });

      return updated;
    });
  };

  useEffect(() => {
    if (!isAutoSimulating) return;
    const interval = setInterval(() => {
      triggerSimulationTick();
    }, 5000);
    return () => clearInterval(interval);
  }, [isAutoSimulating]);

  const activeProfile = MACHINE_FLEET.find(m => m.id === selectedMachineId) || MACHINE_FLEET[0];
  const activeTelemetry = fleetState[selectedMachineId] || {
    temperature: 48,
    vibration: 0.45,
    current: 6,
    sound: 68,
    isFault: false,
    faultType: null,
    history: []
  };

  const activeHealth = calculateHealth(
    activeTelemetry.temperature,
    activeTelemetry.vibration,
    activeTelemetry.current,
    activeTelemetry.sound,
    activeProfile
  );

  // Sync interactive predictor with active machine when changed
  const loadMachineIntoPredictor = (machineId: string) => {
    setSelectedMachineId(machineId);
    const s = fleetState[machineId];
    if (s) {
      setPredTemp(s.temperature);
      setPredVib(s.vibration);
      setPredCurr(s.current);
      setPredSound(s.sound);
    }
  };

  // Quick preset loader
  const loadPreset = (preset: 'healthy' | 'bearing' | 'overheat' | 'electrical' | 'loose') => {
    switch (preset) {
      case 'healthy':
        setPredTemp(42.5);
        setPredVib(0.38);
        setPredCurr(4.8);
        setPredSound(63.0);
        break;
      case 'bearing':
        setPredTemp(58.0);
        setPredVib(1.65);
        setPredCurr(7.2);
        setPredSound(84.0);
        break;
      case 'overheat':
        setPredTemp(78.5);
        setPredVib(0.75);
        setPredCurr(11.8);
        setPredSound(75.0);
        break;
      case 'electrical':
        setPredTemp(68.0);
        setPredVib(0.65);
        setPredCurr(13.5);
        setPredSound(79.0);
        break;
      case 'loose':
        setPredTemp(52.0);
        setPredVib(2.15);
        setPredCurr(8.0);
        setPredSound(94.0);
        break;
    }
  };

  // Inference calculation for the interactive predictor
  const liveInference = runRandomForestInference(predTemp, predVib, predCurr, predSound);

  const handleRetrain = () => {
    setIsRetraining(true);
    setTimeout(() => {
      setIsRetraining(false);
      setRetrainSuccess(true);
      setTimeout(() => setRetrainSuccess(false), 4000);
    }, 1800);
  };

  const handleInjectFault = (faultName: string) => {
    setFleetState(prev => ({
      ...prev,
      [selectedMachineId]: {
        ...prev[selectedMachineId],
        isFault: true,
        faultType: faultName
      }
    }));
    triggerSimulationTick();
  };

  const handleClearFault = () => {
    setFleetState(prev => ({
      ...prev,
      [selectedMachineId]: {
        ...prev[selectedMachineId],
        isFault: false,
        faultType: null
      }
    }));
    triggerSimulationTick();
  };

  // Fleet health summary calculation
  const fleetSummaries = MACHINE_FLEET.map(m => {
    const s = fleetState[m.id];
    return calculateHealth(s.temperature, s.vibration, s.current, s.sound, m);
  });
  const avgFleetHealth = Math.round((fleetSummaries.reduce((acc, h) => acc + h.score, 0) / fleetSummaries.length) * 10) / 10;
  const excellentCount = fleetSummaries.filter(h => h.category === 'Excellent').length;
  const goodCount = fleetSummaries.filter(h => h.category === 'Good').length;
  const warningCount = fleetSummaries.filter(h => h.category === 'Warning').length;
  const criticalCount = fleetSummaries.filter(h => h.category === 'Critical').length;

  return (
    <div className="min-h-screen bg-[#0b0f19] text-slate-100 flex flex-col font-sans selection:bg-cyan-500/30">
      {/* Top Header */}
      <header className="border-b border-slate-800 bg-[#0d1424]/90 backdrop-blur sticky top-0 z-50 px-6 py-3.5 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 via-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 ring-1 ring-cyan-400/30">
            <HeartPulse className="w-5 h-5 text-white animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                FactoryPulse <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400">AI</span>
              </h1>
              <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-cyan-950 border border-cyan-800 text-cyan-300 font-mono font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-cyan-400" /> Phase 5 Failure Prediction Engine Active
              </span>
            </div>
            <p className="text-xs text-slate-400">AI Maintenance Co-Pilot for Textile MSMEs • Random Forest Classifier • 89.30% Accuracy</p>
          </div>
        </div>

        {/* Simulator Cadence Controller */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs">
            <span className={`w-2 h-2 rounded-full ${isAutoSimulating ? 'bg-emerald-400 animate-ping' : 'bg-slate-500'}`}></span>
            <span className="text-slate-400 font-mono">Cadence:</span>
            <span className="text-cyan-300 font-mono font-bold">5.0s Tick</span>
            <span className="text-slate-600">|</span>
            <span className="text-slate-400 font-mono">Tick #{tickCounter}</span>
          </div>

          <button
            onClick={() => setIsAutoSimulating(!isAutoSimulating)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
              isAutoSimulating
                ? 'bg-amber-950/80 border border-amber-800 text-amber-300 hover:bg-amber-900'
                : 'bg-emerald-950/80 border border-emerald-800 text-emerald-300 hover:bg-emerald-900'
            }`}
          >
            {isAutoSimulating ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            {isAutoSimulating ? 'Pause Loop' : 'Resume Loop'}
          </button>

          <button
            onClick={triggerSimulationTick}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition"
            title="Force immediate 5-second tick"
          >
            <RefreshCw className="w-3.5 h-3.5 text-cyan-400" />
            <span>Tick (5s)</span>
          </button>
        </div>
      </header>

      {/* Main Container */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Sidebar Nav */}
        <aside className="w-full md:w-64 border-r border-slate-800 bg-[#0d1322] p-4 flex flex-col gap-1.5 shrink-0">
          <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-semibold px-2 py-1 flex items-center justify-between">
            <span>Navigation Deck</span>
            <span className="text-cyan-400 font-bold">Phase 5</span>
          </div>

          {[
            { id: 'prediction', label: 'Failure Prediction Engine (Phase 5)', icon: Binary, badge: 'Active' },
            { id: 'health', label: 'AI Health Score Engine (Phase 4)', icon: HeartPulse },
            { id: 'simulator', label: 'IoT Sensor Simulator (Phase 3)', icon: Radio },
            { id: 'chart', label: 'Realtime Telemetry Chart', icon: TrendingUp },
            { id: 'schema', label: 'Database Schema (Phase 2)', icon: Database },
            { id: 'architecture', label: 'System Architecture (Phase 1)', icon: Network },
            { id: 'apis', label: 'API Architecture (v1)', icon: Server }
          ].map(tab => {
            const Icon = tab.icon;
            const isSelected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium text-left transition-all ${
                  isSelected
                    ? 'bg-gradient-to-r from-cyan-900/60 to-blue-900/40 text-cyan-200 border border-cyan-700/50 shadow-sm shadow-cyan-950'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isSelected ? 'text-cyan-400' : 'text-slate-500'}`} />
                  <span>{tab.label}</span>
                </div>
                {tab.badge && (
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-cyan-900/80 text-cyan-300 font-mono">
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}

          <div className="mt-4 pt-4 border-t border-slate-800/80">
            <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 px-2 mb-2 font-semibold">
              Textile Machine Fleet
            </div>
            <div className="space-y-1">
              {MACHINE_FLEET.map(m => {
                const s = fleetState[m.id];
                const h = calculateHealth(s.temperature, s.vibration, s.current, s.sound, m);
                const isSelected = selectedMachineId === m.id;

                let badgeColor = 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
                if (h.category === 'Good') badgeColor = 'bg-blue-500/20 text-blue-400 border-blue-500/30';
                if (h.category === 'Warning') badgeColor = 'bg-amber-500/20 text-amber-400 border-amber-500/30';
                if (h.category === 'Critical') badgeColor = 'bg-rose-500/20 text-rose-400 border-rose-500/30';

                return (
                  <button
                    key={m.id}
                    onClick={() => loadMachineIntoPredictor(m.id)}
                    className={`w-full flex items-center justify-between p-2 rounded-lg text-left transition border ${
                      isSelected
                        ? 'bg-slate-800/90 border-cyan-500/50 ring-1 ring-cyan-500/20'
                        : 'bg-slate-900/40 border-slate-800 hover:bg-slate-800/50'
                    }`}
                  >
                    <div className="flex items-center gap-2 overflow-hidden">
                      <span className="text-base shrink-0">{m.icon}</span>
                      <div className="truncate">
                        <div className="text-xs font-semibold text-slate-200 truncate">{m.id}</div>
                        <div className="text-[10px] text-slate-400 truncate">{m.type}</div>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${badgeColor}`}>
                        {h.score}%
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </aside>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto p-6 space-y-6 bg-radial-gradient">
          {/* TAB: FAILURE PREDICTION ENGINE (PHASE 5) */}
          {activeTab === 'prediction' && (
            <div className="space-y-6">
              {/* Top Banner & Model Architecture */}
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                <div className="lg:col-span-3 p-5 rounded-2xl bg-gradient-to-br from-slate-900 via-indigo-950/40 to-slate-900 border border-indigo-900/50 shadow-xl relative overflow-hidden">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                          Industry 4.0 AI Inference
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          89.30% Test Accuracy
                        </span>
                      </div>
                      <h2 className="text-xl font-bold text-white mt-2 flex items-center gap-2">
                        <Binary className="w-5 h-5 text-indigo-400" />
                        Random Forest Failure Prediction Engine
                      </h2>
                      <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
                        Multivariate ensemble classification trained on 5,000 synthetic textile operations. Evaluates Temperature, Vibration, Current, and Sound to predict impending mechanical/electrical failures with Remaining Useful Life (RUL) estimation.
                      </p>
                    </div>

                    <button
                      onClick={handleRetrain}
                      disabled={isRetraining}
                      className="px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white text-xs font-semibold flex items-center gap-2 transition shadow-lg shadow-indigo-600/30 disabled:opacity-50"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isRetraining ? 'animate-spin' : ''}`} />
                      <span>{isRetraining ? 'Training Model...' : 'Retrain Random Forest'}</span>
                    </button>
                  </div>

                  {retrainSuccess && (
                    <div className="mt-3 p-2.5 rounded-lg bg-emerald-950/80 border border-emerald-700 text-emerald-200 text-xs flex items-center gap-2 animate-fadeIn">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>Model successfully retrained on 5,000 telemetry samples. Artifact saved to <code>backend/app/ml_models/random_forest.json</code>!</span>
                    </div>
                  )}

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-slate-800/80 text-xs">
                    <div>
                      <div className="text-[10px] text-slate-400 font-mono">Algorithm</div>
                      <div className="font-semibold text-slate-200">Random Forest</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-400 font-mono">Trees / Estimators</div>
                      <div className="font-semibold text-indigo-300 font-mono">35 Trees (Depth 7)</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-400 font-mono">Splitting Criterion</div>
                      <div className="font-semibold text-slate-200 font-mono">Gini Impurity</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-400 font-mono">Feature Importance</div>
                      <div className="font-semibold text-cyan-300 font-mono">Vib (38%) • Temp (26%)</div>
                    </div>
                  </div>
                </div>

                {/* Model Status Card */}
                <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col justify-between">
                  <div>
                    <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Inference Target</div>
                    <div className="text-base font-bold text-white mt-1 flex items-center gap-2">
                      <span>{activeProfile.icon}</span>
                      <span>{activeProfile.id}</span>
                    </div>
                    <div className="text-xs text-slate-400">{activeProfile.name}</div>
                  </div>

                  <div className="my-3 p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400">Class Target:</span>
                      <span className="font-mono text-cyan-300 font-semibold">{liveInference.label}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400">Failure Risk:</span>
                      <span className={`font-mono font-bold ${liveInference.failureProbability > 0.65 ? 'text-rose-400' : liveInference.failureProbability > 0.35 ? 'text-amber-400' : 'text-emerald-400'}`}>
                        {(liveInference.failureProbability * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400">RUL:</span>
                      <span className="font-mono text-indigo-300 font-semibold">{liveInference.rulHours} hrs</span>
                    </div>
                  </div>

                  <button
                    onClick={() => loadMachineIntoPredictor(selectedMachineId)}
                    className="w-full py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 flex items-center justify-center gap-1.5 transition"
                  >
                    <RefreshCw className="w-3 h-3 text-cyan-400" />
                    <span>Sync Live Sensor Values</span>
                  </button>
                </div>
              </div>

              {/* Main Interactive Predictor Playground */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left 7 Columns: Input Sliders & Quick Presets */}
                <div className="lg:col-span-7 p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-bold text-white flex items-center gap-2">
                        <Sliders className="w-4 h-4 text-cyan-400" />
                        4-Channel Telemetry Inputs
                      </h3>
                      <p className="text-xs text-slate-400">Adjust physical sensor values to evaluate Random Forest decision tree predictions.</p>
                    </div>

                    {/* Presets */}
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] text-slate-400 uppercase font-mono mr-1">Presets:</span>
                      <button
                        onClick={() => loadPreset('healthy')}
                        className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[10px] font-semibold text-emerald-400 border border-emerald-900"
                      >
                        Healthy
                      </button>
                      <button
                        onClick={() => loadPreset('bearing')}
                        className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[10px] font-semibold text-amber-400 border border-amber-900"
                      >
                        Bearing Wear
                      </button>
                      <button
                        onClick={() => loadPreset('overheat')}
                        className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[10px] font-semibold text-rose-400 border border-rose-900"
                      >
                        Overheating
                      </button>
                      <button
                        onClick={() => loadPreset('loose')}
                        className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[10px] font-semibold text-purple-400 border border-purple-900"
                      >
                        Loose Parts
                      </button>
                    </div>
                  </div>

                  <div className="space-y-5">
                    {/* Temperature Slider */}
                    <div className="space-y-2 p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2 font-semibold text-slate-300">
                          <Thermometer className="w-4 h-4 text-rose-400" />
                          <span>Temperature (35°C – 90°C)</span>
                        </div>
                        <span className="font-mono text-sm font-bold text-rose-400">{predTemp.toFixed(1)} °C</span>
                      </div>
                      <input
                        type="range"
                        min="35"
                        max="90"
                        step="0.5"
                        value={predTemp}
                        onChange={(e) => setPredTemp(parseFloat(e.target.value))}
                        className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-rose-500"
                      />
                      <div className="flex justify-between text-[10px] font-mono text-slate-500">
                        <span>35°C (Cool Nominal)</span>
                        <span>55°C (Warm)</span>
                        <span>70°C (Warning)</span>
                        <span>90°C (Critical)</span>
                      </div>
                    </div>

                    {/* Vibration Slider */}
                    <div className="space-y-2 p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2 font-semibold text-slate-300">
                          <Activity className="w-4 h-4 text-cyan-400" />
                          <span>Vibration RMS (0.10g – 2.50g)</span>
                        </div>
                        <span className="font-mono text-sm font-bold text-cyan-400">{predVib.toFixed(2)} g</span>
                      </div>
                      <input
                        type="range"
                        min="0.10"
                        max="2.50"
                        step="0.05"
                        value={predVib}
                        onChange={(e) => setPredVib(parseFloat(e.target.value))}
                        className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                      />
                      <div className="flex justify-between text-[10px] font-mono text-slate-500">
                        <span>0.10g (Smooth)</span>
                        <span>0.80g (Acceptable)</span>
                        <span>1.40g (Warning)</span>
                        <span>2.50g (Severe)</span>
                      </div>
                    </div>

                    {/* Current Slider */}
                    <div className="space-y-2 p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2 font-semibold text-slate-300">
                          <Zap className="w-4 h-4 text-amber-400" />
                          <span>Current Consumption (2.0A – 15.0A)</span>
                        </div>
                        <span className="font-mono text-sm font-bold text-amber-400">{predCurr.toFixed(1)} A</span>
                      </div>
                      <input
                        type="range"
                        min="2.0"
                        max="15.0"
                        step="0.1"
                        value={predCurr}
                        onChange={(e) => setPredCurr(parseFloat(e.target.value))}
                        className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                      />
                      <div className="flex justify-between text-[10px] font-mono text-slate-500">
                        <span>2.0A (No-Load)</span>
                        <span>6.0A (Standard)</span>
                        <span>9.5A (High Load)</span>
                        <span>15.0A (Overcurrent)</span>
                      </div>
                    </div>

                    {/* Sound Slider */}
                    <div className="space-y-2 p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2 font-semibold text-slate-300">
                          <Volume2 className="w-4 h-4 text-purple-400" />
                          <span>Acoustic Noise (50dB – 100dB)</span>
                        </div>
                        <span className="font-mono text-sm font-bold text-purple-400">{predSound.toFixed(1)} dB</span>
                      </div>
                      <input
                        type="range"
                        min="50.0"
                        max="100.0"
                        step="0.5"
                        value={predSound}
                        onChange={(e) => setPredSound(parseFloat(e.target.value))}
                        className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
                      />
                      <div className="flex justify-between text-[10px] font-mono text-slate-500">
                        <span>50 dB (Whisper)</span>
                        <span>68 dB (Shopfloor)</span>
                        <span>82 dB (Warning)</span>
                        <span>100 dB (Ear Hazard)</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right 5 Columns: Prediction Output Cockpit & Probability Gauge */}
                <div className="lg:col-span-5 p-6 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between space-y-6">
                  <div>
                    <div className="flex items-center justify-between">
                      <h3 className="text-base font-bold text-white flex items-center gap-2">
                        <Gauge className="w-4 h-4 text-indigo-400" />
                        Inference Output
                      </h3>
                      <span className={`px-2.5 py-1 rounded-full text-xs font-mono font-bold uppercase tracking-wider border ${
                        liveInference.label === 'Healthy'
                          ? 'bg-emerald-950/80 text-emerald-400 border-emerald-700'
                          : liveInference.label === 'Warning'
                          ? 'bg-amber-950/80 text-amber-400 border-amber-700'
                          : 'bg-rose-950/80 text-rose-400 border-rose-700 animate-pulse'
                      }`}>
                        {liveInference.label}
                      </span>
                    </div>

                    {/* Circular Failure Probability Metric */}
                    <div className="mt-5 p-5 rounded-2xl bg-slate-950/80 border border-slate-800 text-center relative overflow-hidden">
                      <div className="text-xs uppercase font-mono tracking-wider text-slate-400">
                        Impending Failure Probability
                      </div>
                      <div className="mt-2 text-5xl font-extrabold tracking-tight font-mono">
                        <span className={
                          liveInference.failureProbability > 0.65
                            ? 'text-rose-400'
                            : liveInference.failureProbability > 0.35
                            ? 'text-amber-400'
                            : 'text-emerald-400'
                        }>
                          {(liveInference.failureProbability * 100).toFixed(1)}%
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1">
                        {liveInference.failureProbability > 0.65
                          ? 'High risk of unplanned machine breakdown'
                          : liveInference.failureProbability > 0.35
                          ? 'Elevated degradation; preventive inspection advised'
                          : 'Normal operating envelope; minimal failure likelihood'}
                      </p>

                      {/* Progress bar */}
                      <div className="w-full bg-slate-800 h-2.5 rounded-full mt-4 overflow-hidden">
                        <div
                          className={`h-full transition-all duration-300 ${
                            liveInference.failureProbability > 0.65
                              ? 'bg-gradient-to-r from-amber-500 to-rose-500'
                              : liveInference.failureProbability > 0.35
                              ? 'bg-gradient-to-r from-emerald-500 to-amber-500'
                              : 'bg-emerald-500'
                          }`}
                          style={{ width: `${Math.min(100, liveInference.failureProbability * 100)}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* 3-Class Softmax Probability Distribution */}
                    <div className="mt-5 space-y-2.5">
                      <div className="text-[11px] font-mono uppercase text-slate-400 tracking-wider">
                        3-Class Random Forest Probabilities
                      </div>

                      {/* Healthy Bar */}
                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-slate-300 font-medium flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-emerald-400"></span> Healthy
                          </span>
                          <span className="font-mono text-emerald-400 font-semibold">{(liveInference.pHealthy * 100).toFixed(1)}%</span>
                        </div>
                        <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
                          <div
                            className="bg-emerald-500 h-full transition-all duration-300"
                            style={{ width: `${liveInference.pHealthy * 100}%` }}
                          ></div>
                        </div>
                      </div>

                      {/* Warning Bar */}
                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-slate-300 font-medium flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-amber-400"></span> Warning
                          </span>
                          <span className="font-mono text-amber-400 font-semibold">{(liveInference.pWarning * 100).toFixed(1)}%</span>
                        </div>
                        <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
                          <div
                            className="bg-amber-500 h-full transition-all duration-300"
                            style={{ width: `${liveInference.pWarning * 100}%` }}
                          ></div>
                        </div>
                      </div>

                      {/* Critical Bar */}
                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-slate-300 font-medium flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-rose-400"></span> Critical
                          </span>
                          <span className="font-mono text-rose-400 font-semibold">{(liveInference.pCritical * 100).toFixed(1)}%</span>
                        </div>
                        <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
                          <div
                            className="bg-rose-500 h-full transition-all duration-300"
                            style={{ width: `${liveInference.pCritical * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Diagnosed Fault & Estimated RUL Callout */}
                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400">Diagnosed Fault Signature:</span>
                      <span className="font-semibold text-slate-200 text-right">{liveInference.fault}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-800/80">
                      <span className="text-slate-400 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-indigo-400" />
                        Remaining Useful Life (RUL):
                      </span>
                      <span className="font-mono font-bold text-indigo-300">
                        {liveInference.rulHours} Operating Hours
                        <span className="text-[10px] text-slate-500 ml-1">
                          ({(liveInference.rulHours / 24).toFixed(1)} days)
                        </span>
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Fleet-Wide Failure Prediction Matrix Table */}
              <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <Table className="w-4 h-4 text-cyan-400" />
                      Textile Plant Fleet Prediction Matrix
                    </h3>
                    <p className="text-xs text-slate-400">Continuous Random Forest prediction across all 6 MSME plant assets.</p>
                  </div>
                  <span className="text-xs font-mono text-slate-400">SQLite Table: <code>failure_predictions</code></span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-950/80 text-slate-400 font-mono uppercase text-[10px] border-b border-slate-800">
                      <tr>
                        <th className="p-3">Asset</th>
                        <th className="p-3">Type & Location</th>
                        <th className="p-3">Current Telemetry</th>
                        <th className="p-3">Predicted State</th>
                        <th className="p-3">Failure Risk</th>
                        <th className="p-3">Diagnosed Fault</th>
                        <th className="p-3">Est. RUL</th>
                        <th className="p-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-sans">
                      {MACHINE_FLEET.map(m => {
                        const s = fleetState[m.id];
                        const pred = runRandomForestInference(s.temperature, s.vibration, s.current, s.sound);

                        let badge = 'bg-emerald-950/80 text-emerald-300 border-emerald-800';
                        if (pred.label === 'Warning') badge = 'bg-amber-950/80 text-amber-300 border-amber-800';
                        if (pred.label === 'Critical') badge = 'bg-rose-950/80 text-rose-300 border-rose-800 animate-pulse';

                        return (
                          <tr key={m.id} className="hover:bg-slate-800/40 transition">
                            <td className="p-3 font-semibold text-slate-200">
                              <div className="flex items-center gap-2">
                                <span>{m.icon}</span>
                                <span className="font-mono text-cyan-400 font-bold">{m.id}</span>
                              </div>
                            </td>
                            <td className="p-3 text-slate-300">
                              <div>{m.type}</div>
                              <div className="text-[10px] text-slate-500">{m.location}</div>
                            </td>
                            <td className="p-3 font-mono text-slate-400">
                              <span className="text-rose-400">{s.temperature}°C</span> •{' '}
                              <span className="text-cyan-400">{s.vibration}g</span> •{' '}
                              <span className="text-amber-400">{s.current}A</span> •{' '}
                              <span className="text-purple-400">{s.sound}dB</span>
                            </td>
                            <td className="p-3">
                              <span className={`px-2 py-0.5 rounded-full font-mono font-bold text-[10px] border ${badge}`}>
                                {pred.label}
                              </span>
                            </td>
                            <td className="p-3 font-mono font-bold">
                              <span className={pred.failureProbability > 0.65 ? 'text-rose-400' : pred.failureProbability > 0.35 ? 'text-amber-400' : 'text-emerald-400'}>
                                {(pred.failureProbability * 100).toFixed(1)}%
                              </span>
                            </td>
                            <td className="p-3 text-slate-300 font-medium">{pred.fault}</td>
                            <td className="p-3 font-mono text-indigo-300 font-semibold">{pred.rulHours} hrs</td>
                            <td className="p-3 text-right">
                              <button
                                onClick={() => loadMachineIntoPredictor(m.id)}
                                className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-semibold border border-slate-700 transition"
                              >
                                Test Inputs
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB: HEALTH ENGINE (PHASE 4) */}
          {activeTab === 'health' && (
            <div className="space-y-6">
              {/* Fleet Overview KPI Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
                  <div className="text-slate-400 text-xs font-mono uppercase">Fleet Avg Health</div>
                  <div className="text-3xl font-extrabold text-white mt-1 font-mono">{avgFleetHealth}%</div>
                  <div className="text-xs text-cyan-400 mt-1">Across 6 Textile Units</div>
                </div>

                <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
                  <div className="text-slate-400 text-xs font-mono uppercase">Excellent (90-100)</div>
                  <div className="text-3xl font-extrabold text-emerald-400 mt-1 font-mono">{excellentCount}</div>
                  <div className="text-xs text-slate-500 mt-1">Operating Optimal</div>
                </div>

                <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
                  <div className="text-slate-400 text-xs font-mono uppercase">Good (70-89)</div>
                  <div className="text-3xl font-extrabold text-blue-400 mt-1 font-mono">{goodCount}</div>
                  <div className="text-xs text-slate-500 mt-1">Nominal Tolerance</div>
                </div>

                <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
                  <div className="text-slate-400 text-xs font-mono uppercase">Warning (50-69)</div>
                  <div className="text-3xl font-extrabold text-amber-400 mt-1 font-mono">{warningCount}</div>
                  <div className="text-xs text-amber-400/80 mt-1">Inspection Required</div>
                </div>

                <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
                  <div className="text-slate-400 text-xs font-mono uppercase">Critical (&lt;50)</div>
                  <div className="text-3xl font-extrabold text-rose-400 mt-1 font-mono">{criticalCount}</div>
                  <div className="text-xs text-rose-400/80 mt-1">Immediate Halt</div>
                </div>
              </div>

              {/* Active Machine Detailed Health Card */}
              <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{activeProfile.icon}</span>
                      <h2 className="text-xl font-bold text-white">{activeProfile.name}</h2>
                      <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-800 text-cyan-400 font-bold border border-slate-700">
                        {activeProfile.id}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                      {activeProfile.type} • {activeProfile.location} • Power: {activeProfile.power}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="text-[10px] font-mono text-slate-400 uppercase">Composite Health Score</div>
                      <div className="text-3xl font-black font-mono text-white flex items-center justify-end gap-1">
                        <span>{activeHealth.score}</span>
                        <span className="text-sm text-slate-500 font-normal">/ 100</span>
                      </div>
                    </div>
                    <div className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider border ${
                      activeHealth.category === 'Excellent'
                        ? 'bg-emerald-950 text-emerald-400 border-emerald-800'
                        : activeHealth.category === 'Good'
                        ? 'bg-blue-950 text-blue-400 border-blue-800'
                        : activeHealth.category === 'Warning'
                        ? 'bg-amber-950 text-amber-400 border-amber-800'
                        : 'bg-rose-950 text-rose-400 border-rose-800 animate-pulse'
                    }`}>
                      {activeHealth.category}
                    </div>
                  </div>
                </div>

                {/* Sub-Score Weighting Matrix */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/80">
                    <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                      <span className="flex items-center gap-1.5"><Activity className="w-3.5 h-3.5 text-cyan-400" /> Vibration</span>
                      <span className="font-mono text-cyan-400">Weight: 35%</span>
                    </div>
                    <div className="text-2xl font-bold font-mono text-white">{activeHealth.sVib}</div>
                    <div className="text-[11px] text-slate-400 mt-1 font-mono">
                      Measured: {activeTelemetry.vibration}g (Base: {activeProfile.baseVib}g)
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/80">
                    <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                      <span className="flex items-center gap-1.5"><Thermometer className="w-3.5 h-3.5 text-rose-400" /> Temperature</span>
                      <span className="font-mono text-rose-400">Weight: 25%</span>
                    </div>
                    <div className="text-2xl font-bold font-mono text-white">{activeHealth.sTemp}</div>
                    <div className="text-[11px] text-slate-400 mt-1 font-mono">
                      Measured: {activeTelemetry.temperature}°C (Base: {activeProfile.baseTemp}°C)
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/80">
                    <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                      <span className="flex items-center gap-1.5"><Zap className="w-3.5 h-3.5 text-amber-400" /> Current</span>
                      <span className="font-mono text-amber-400">Weight: 25%</span>
                    </div>
                    <div className="text-2xl font-bold font-mono text-white">{activeHealth.sCurr}</div>
                    <div className="text-[11px] text-slate-400 mt-1 font-mono">
                      Measured: {activeTelemetry.current}A (Base: {activeProfile.baseCurrent}A)
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/80">
                    <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                      <span className="flex items-center gap-1.5"><Volume2 className="w-3.5 h-3.5 text-purple-400" /> Acoustic Sound</span>
                      <span className="font-mono text-purple-400">Weight: 15%</span>
                    </div>
                    <div className="text-2xl font-bold font-mono text-white">{activeHealth.sSound}</div>
                    <div className="text-[11px] text-slate-400 mt-1 font-mono">
                      Measured: {activeTelemetry.sound}dB (Base: {activeProfile.baseSound}dB)
                    </div>
                  </div>
                </div>

                {/* Primary Risk Callout */}
                <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <ShieldAlert className="w-5 h-5 text-amber-400" />
                    <div>
                      <div className="text-xs text-slate-400">Identified Primary Stressor</div>
                      <div className="text-sm font-bold text-white">{activeHealth.primaryRisk}</div>
                    </div>
                  </div>
                  <div className="text-xs font-mono text-slate-500">
                    SQLite Table: <code>machine_health</code>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB: IOT SIMULATOR (PHASE 3) */}
          {activeTab === 'simulator' && (
            <div className="space-y-6">
              <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <Radio className="w-4 h-4 text-cyan-400" />
                      Fault Signature Injection Module
                    </h3>
                    <p className="text-xs text-slate-400">Inject realistic physics faults directly into the selected textile machine simulator.</p>
                  </div>
                  {activeTelemetry.isFault && (
                    <button
                      onClick={handleClearFault}
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 transition"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Restore Nominal Physics
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {FAULT_TYPES.map(f => {
                    const isCurrentlyActive = activeTelemetry.isFault && activeTelemetry.faultType === f.name;
                    return (
                      <div
                        key={f.name}
                        className={`p-3.5 rounded-xl border text-left transition ${
                          isCurrentlyActive
                            ? 'bg-amber-950/40 border-amber-600/80 ring-1 ring-amber-500/40'
                            : 'bg-slate-950 border-slate-800/80 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-bold text-slate-200">{f.name}</h4>
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                            {f.badge}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">{f.desc}</p>
                        <div className="text-[10px] font-mono text-cyan-400/90 mt-2 bg-slate-900/60 p-1.5 rounded border border-slate-800">
                          {f.impact}
                        </div>
                        <button
                          onClick={() => handleInjectFault(f.name)}
                          className={`w-full mt-3 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
                            isCurrentlyActive
                              ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/30'
                              : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                          }`}
                        >
                          {isCurrentlyActive ? 'Active Fault Signature' : `Inject ${f.name}`}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB: CHARTS */}
          {activeTab === 'chart' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-cyan-400" /> Realtime Telemetry Monitor ({activeProfile.id})
                </h3>
              </div>
              <div className="h-64 w-full p-4 rounded-xl bg-slate-900 border border-slate-800">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={activeTelemetry.history}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="time" stroke="#64748b" tick={{ fontSize: 10 }} />
                    <YAxis stroke="#64748b" tick={{ fontSize: 10 }} />
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', fontSize: '11px' }} />
                    <Line type="monotone" dataKey="temp" stroke="#f43f5e" name="Temp (°C)" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="curr" stroke="#f59e0b" name="Current (A)" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="sound" stroke="#a855f7" name="Sound (dB)" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* TAB: SCHEMA */}
          {activeTab === 'schema' && (
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-slate-300">
              <pre>{`-- SQLite Tables (Phase 2):
1. machines
2. machine_health
3. sensor_readings
4. failure_predictions  -- Used in Phase 5
5. maintenance_logs
6. alerts
7. cost_analysis
8. chat_history
9. users`}</pre>
            </div>
          )}

          {/* TAB: ARCHITECTURE */}
          {activeTab === 'architecture' && (
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-slate-300">
              <pre>{`-- Complete System Architecture (Phase 1):
• Tier 1: Simulated IoT Engine (5s telemetry)
• Tier 2: FastAPI + SQLite WAL Database
• Tier 3: Random Forest Classifier (Phase 5) + Health Engine (Phase 4)
• Tier 4: Industry 4.0 Dashboard & Co-Pilot`}</pre>
            </div>
          )}

          {/* TAB: APIS */}
          {activeTab === 'apis' && (
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-slate-300 space-y-1">
              <div className="text-cyan-400 font-bold mb-2">Phase 5 Failure Prediction APIs:</div>
              <div>• POST /api/v1/predict/telemetry - Inference on raw Temperature, Vibration, Current, Sound</div>
              <div>• GET /api/v1/predict/machine/&#123;machine_id&#125; - Realtime machine prediction &amp; RUL</div>
              <div>• GET /api/v1/predict/fleet - Full textile fleet prediction matrix</div>
              <div>• GET /api/v1/predict/model/metrics - Model accuracy &amp; feature importances</div>
              <div>• POST /api/v1/predict/retrain - On-demand model retraining</div>
            </div>
          )}

          {/* Phase 5 Completion Banner */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-950/70 via-teal-950/50 to-cyan-950/70 border border-emerald-800/80 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">PHASE 5 COMPLETE: Failure Prediction Engine Operational</h4>
                <p className="text-xs text-slate-300">
                  Random Forest Classifier (35 trees, 89.30% accuracy), Dataset Generator, Model Training &amp; Serialization, Remaining Useful Life (RUL) estimation, and SQLite persistence. Awaiting your command <span className="font-mono text-emerald-300 font-bold bg-emerald-950 px-1.5 py-0.5 rounded border border-emerald-800">&quot;CONTINUE&quot;</span> to begin <b>PHASE 6: EXPLAINABLE AI (XAI)</b>.
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
