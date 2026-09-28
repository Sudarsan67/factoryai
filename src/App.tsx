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
  AlertCircle
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
    const decay = excess / (critThresh * 0.5);
    return Math.max(0.0, Math.round((50.0 - decay * 50.0) * 10) / 10);
  }
}

function calculateHealth(t: number, v: number, c: number, s: number, prof: MachineProfile) {
  const sTemp = computeSubScore(t, prof.baseTemp, 1.25, 1.55);
  const sVib = computeSubScore(v, prof.baseVib, 1.75, 2.75);
  const sCurr = computeSubScore(c, prof.baseCurrent, 1.35, 1.80);
  const sSound = computeSubScore(s, prof.baseSound, 1.18, 1.35);

  const composite = 0.35 * sVib + 0.30 * sTemp + 0.20 * sCurr + 0.15 * sSound;
  const roundedScore = Math.max(0, Math.min(100, Math.round(composite * 10) / 10));

  let category: 'Excellent' | 'Good' | 'Warning' | 'Critical';
  if (roundedScore >= 90.0) category = 'Excellent';
  else if (roundedScore >= 70.0) category = 'Good';
  else if (roundedScore >= 50.0) category = 'Warning';
  else category = 'Critical';

  // Primary risk
  const scores = [
    { name: 'Vibration', score: sVib, val: v, base: prof.baseVib, unit: 'g' },
    { name: 'Temperature', score: sTemp, val: t, base: prof.baseTemp, unit: '°C' },
    { name: 'Current', score: sCurr, val: c, base: prof.baseCurrent, unit: 'A' },
    { name: 'Sound', score: sSound, val: s, base: prof.baseSound, unit: 'dB' }
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

export default function App() {
  const [activeTab, setActiveTab] = useState<'health' | 'simulator' | 'chart' | 'schema' | 'architecture' | 'apis'>('health');
  const [selectedMachineId, setSelectedMachineId] = useState<string>('WVE-03');
  const [isAutoSimulating, setIsAutoSimulating] = useState<boolean>(true);
  const [tickCounter, setTickCounter] = useState<number>(156);
  const [lastTickTime, setLastTickTime] = useState<string>(new Date().toLocaleTimeString());

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
              targetTemp += 34.0 + (Math.random() * 4.0 - 2.0);
              rawCurrent += 4.5 + (Math.random() * 0.8 - 0.4);
              rawVib += 0.5 + (Math.random() * 0.1);
              rawSound += 12.0 + (Math.random() * 2.0);
              break;
            case 'Bearing Wear':
              rawVib += 0.85 + (Math.random() * 0.25);
              rawSound += 14.0 + (Math.random() * 2.5);
              targetTemp += 12.0 + (Math.random() * 1.5);
              rawCurrent += 1.8 + (Math.random() * 0.3);
              break;
            case 'High Current Draw':
              rawCurrent += 5.8 + (Math.random() * 1.2 - 0.6);
              targetTemp += 20.0 + (Math.random() * 2.5);
              rawSound += 10.0 + (Math.random() * 2.0);
              break;
            case 'Excessive Noise':
              rawSound += 26.0 + (Math.random() * 4.0 - 2.0);
              rawVib += 0.65 + (Math.random() * 0.15);
              targetTemp += 7.0 + (Math.random() * 1.5);
              break;
            case 'Misalignment':
              rawVib += 1.25 + (Math.random() * 0.25);
              rawCurrent += 3.2 + (Math.random() * 0.5);
              targetTemp += 12.0 + (Math.random() * 2.0);
              rawSound += 14.0 + (Math.random() * 2.0);
              break;
            case 'Loose Components':
              rawVib += 1.55 + (Math.random() * 0.35);
              rawSound += 24.0 + (Math.random() * 4.0);
              break;
          }
        }

        const alpha = 0.2;
        const newTemp = current.temperature + alpha * (targetTemp - current.temperature);

        const clampedTemp = Math.max(35.0, Math.min(90.0, Number(newTemp.toFixed(1))));
        const clampedVib = Math.max(0.10, Math.min(2.50, Number(rawVib.toFixed(2))));
        const clampedCurrent = Math.max(2.0, Math.min(15.0, Number(rawCurrent.toFixed(1))));
        const clampedSound = Math.max(50.0, Math.min(100.0, Number(rawSound.toFixed(1))));

        const historySlice = [
          ...(current.history || []),
          { time: nowStr, temp: clampedTemp, vib: clampedVib, curr: clampedCurrent, sound: clampedSound }
        ].slice(-12);

        updated[prof.id] = {
          ...current,
          temperature: clampedTemp,
          vibration: clampedVib,
          current: clampedCurrent,
          sound: clampedSound,
          history: historySlice
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

  const activeMachine = MACHINE_FLEET.find(m => m.id === selectedMachineId)!;
  const activeTelemetry = fleetState[selectedMachineId];
  const activeHealth = calculateHealth(
    activeTelemetry.temperature,
    activeTelemetry.vibration,
    activeTelemetry.current,
    activeTelemetry.sound,
    activeMachine
  );

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
                <CheckCircle2 className="w-3 h-3 text-cyan-400" /> Phase 4 AI Health Engine Active
              </span>
            </div>
            <p className="text-xs text-slate-400">AI Maintenance Co-Pilot for Textile MSMEs • 0-100 Multi-Factor Health Index</p>
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
            <span className="text-cyan-400 font-bold">Phase 4</span>
          </div>

          {[
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

          {/* Machine Selector in Sidebar */}
          <div className="mt-4 pt-3 border-t border-slate-800/80">
            <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-semibold px-2 mb-2 flex items-center justify-between">
              <span>Select Machine:</span>
              <span className="text-cyan-400">{selectedMachineId}</span>
            </div>
            <div className="space-y-1">
              {MACHINE_FLEET.map((m) => {
                const s = fleetState[m.id];
                const h = calculateHealth(s.temperature, s.vibration, s.current, s.sound, m);
                const isSelected = selectedMachineId === m.id;
                return (
                  <button
                    key={m.id}
                    onClick={() => setSelectedMachineId(m.id)}
                    className={`w-full text-left px-2.5 py-2 rounded-lg text-xs font-mono flex items-center justify-between transition ${
                      isSelected
                        ? 'bg-cyan-950 text-cyan-200 border border-cyan-700 font-bold'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span className="text-sm">{m.icon}</span>
                      <span className="truncate">{m.id}</span>
                    </div>
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                      h.category === 'Excellent' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' :
                      h.category === 'Good' ? 'bg-blue-950 text-blue-400 border border-blue-800' :
                      h.category === 'Warning' ? 'bg-amber-950 text-amber-400 border border-amber-800' :
                      'bg-rose-950 text-rose-400 border border-rose-800'
                    }`}>
                      {h.score}%
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-auto pt-4 border-t border-slate-800/80">
            <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
                <span className="text-xs font-semibold text-slate-200">Execution Phase: 4 of 20</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Phase 4 calculates multi-factor composite health scores (0-100) and risk categorizations.
              </p>
            </div>
          </div>
        </aside>

        {/* Content View Area */}
        <main className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Fleet Health Summary Overview Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
              <div className="text-[11px] font-mono text-slate-400 uppercase">Total Assets</div>
              <div className="text-2xl font-mono font-bold text-white mt-1">6 Machines</div>
              <div className="text-[10px] text-slate-500 font-mono">100% Online</div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
              <div className="text-[11px] font-mono text-slate-400 uppercase">Avg Fleet Health</div>
              <div className={`text-2xl font-mono font-bold mt-1 ${
                avgFleetHealth >= 90 ? 'text-emerald-400' :
                avgFleetHealth >= 70 ? 'text-blue-400' :
                avgFleetHealth >= 50 ? 'text-amber-400' :
                'text-rose-400'
              }`}>
                {avgFleetHealth}%
              </div>
              <div className="text-[10px] text-slate-500 font-mono">Weighted Multi-modal</div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
              <div className="text-[11px] font-mono text-emerald-400 uppercase">Excellent (90-100)</div>
              <div className="text-2xl font-mono font-bold text-emerald-300 mt-1">{excellentCount}</div>
              <div className="text-[10px] text-emerald-500/80 font-mono">Zero Intervention</div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
              <div className="text-[11px] font-mono text-blue-400 uppercase">Good (70-89)</div>
              <div className="text-2xl font-mono font-bold text-blue-300 mt-1">{goodCount}</div>
              <div className="text-[10px] text-blue-500/80 font-mono">Routine Service</div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
              <div className="text-[11px] font-mono text-amber-400 uppercase">Warning (50-69)</div>
              <div className="text-2xl font-mono font-bold text-amber-300 mt-1">{warningCount}</div>
              <div className="text-[10px] text-amber-500/80 font-mono">Inspect &lt; 24h</div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
              <div className="text-[11px] font-mono text-rose-400 uppercase">Critical (&lt;50)</div>
              <div className="text-2xl font-mono font-bold text-rose-300 mt-1">{criticalCount}</div>
              <div className="text-[10px] text-rose-500/80 font-mono">Immediate Stop</div>
            </div>
          </div>

          {/* Tab 1: AI Health Engine Dashboard (Phase 4 Core Deliverable) */}
          {activeTab === 'health' && (
            <div className="space-y-6">
              {/* Main Machine Health Banner */}
              <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-[#0e1628] to-[#101b33] border border-slate-800 flex flex-col lg:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                  {/* Circular Radial Score Display */}
                  <div className="relative w-28 h-28 flex items-center justify-center shrink-0">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r="42" stroke="#1e293b" strokeWidth="8" fill="transparent" />
                      <circle
                        cx="50"
                        cy="50"
                        r="42"
                        stroke={
                          activeHealth.category === 'Excellent' ? '#10b981' :
                          activeHealth.category === 'Good' ? '#3b82f6' :
                          activeHealth.category === 'Warning' ? '#f59e0b' :
                          '#f43f5e'
                        }
                        strokeWidth="8"
                        strokeDasharray={264}
                        strokeDashoffset={264 - (264 * activeHealth.score) / 100}
                        strokeLinecap="round"
                        fill="transparent"
                        className="transition-all duration-700 ease-out"
                      />
                    </svg>
                    <div className="absolute flex flex-col items-center justify-center">
                      <span className="text-2xl font-extrabold font-mono text-white">{activeHealth.score}%</span>
                      <span className="text-[9px] uppercase font-mono text-slate-400">Health</span>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg">{activeMachine.icon}</span>
                      <h3 className="text-lg font-bold text-white">{activeMachine.name}</h3>
                      <span className="text-xs font-mono text-cyan-300 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800">
                        {activeMachine.id}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400">
                      Type: <b className="text-slate-300">{activeMachine.type}</b> • Section: <b className="text-slate-300">{activeMachine.location}</b> • Nominal Power: <b className="text-slate-300">{activeMachine.power}</b>
                    </p>
                    <div className="flex items-center gap-2 mt-3">
                      <span className={`px-2.5 py-1 rounded text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 ${
                        activeHealth.category === 'Excellent' ? 'bg-emerald-950 text-emerald-300 border border-emerald-700' :
                        activeHealth.category === 'Good' ? 'bg-blue-950 text-blue-300 border border-blue-700' :
                        activeHealth.category === 'Warning' ? 'bg-amber-950 text-amber-300 border border-amber-700 animate-pulse' :
                        'bg-rose-950 text-rose-300 border border-rose-700 animate-pulse'
                      }`}>
                        <Award className="w-3.5 h-3.5" /> Grade: {activeHealth.category} ({
                          activeHealth.category === 'Excellent' ? '90-100%' :
                          activeHealth.category === 'Good' ? '70-89%' :
                          activeHealth.category === 'Warning' ? '50-69%' :
                          '<50%'
                        })
                      </span>

                      <span className="px-2.5 py-1 rounded bg-slate-950 border border-slate-800 text-xs font-mono text-slate-300 flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                        Risk: <b className="text-slate-200">{activeHealth.primaryRisk}</b>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Quick Action Button */}
                <div className="flex flex-col sm:flex-row items-center gap-2 shrink-0">
                  {activeTelemetry.isFault ? (
                    <button
                      onClick={handleClearFault}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold font-mono flex items-center gap-2 transition shadow-lg shadow-emerald-950"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      Restore Machine to Healthy
                    </button>
                  ) : (
                    <button
                      onClick={() => handleInjectFault('Bearing Wear')}
                      className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold font-mono flex items-center gap-2 transition shadow-lg shadow-amber-950"
                    >
                      <Flame className="w-4 h-4" />
                      Test Fault (Degrade Health)
                    </button>
                  )}
                </div>
              </div>

              {/* 4 Multi-Factor Sub-Score Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* 1. Vibration Sub-Score (Weight: 35%) */}
                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-mono font-bold text-slate-300 flex items-center gap-1.5">
                      <Activity className="w-4 h-4 text-cyan-400" /> Vibration Health (35%)
                    </span>
                    <span className="text-[10px] font-mono text-cyan-400">Weight: 0.35</span>
                  </div>
                  <div className="text-2xl font-mono font-extrabold text-white my-1">
                    {activeHealth.sVib}%
                  </div>
                  <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800 my-2">
                    <div
                      className={`h-full transition-all duration-500 ${
                        activeHealth.sVib >= 70 ? 'bg-cyan-500' : activeHealth.sVib >= 50 ? 'bg-amber-500' : 'bg-rose-500'
                      }`}
                      style={{ width: `${activeHealth.sVib}%` }}
                    />
                  </div>
                  <div className="text-[11px] font-mono text-slate-400 flex justify-between">
                    <span>Live: <b className="text-slate-200">{activeTelemetry.vibration}g</b></span>
                    <span>Base: {activeMachine.baseVib}g</span>
                  </div>
                </div>

                {/* 2. Temperature Sub-Score (Weight: 30%) */}
                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-mono font-bold text-slate-300 flex items-center gap-1.5">
                      <Thermometer className="w-4 h-4 text-rose-400" /> Thermal Health (30%)
                    </span>
                    <span className="text-[10px] font-mono text-rose-400">Weight: 0.30</span>
                  </div>
                  <div className="text-2xl font-mono font-extrabold text-white my-1">
                    {activeHealth.sTemp}%
                  </div>
                  <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800 my-2">
                    <div
                      className={`h-full transition-all duration-500 ${
                        activeHealth.sTemp >= 70 ? 'bg-emerald-500' : activeHealth.sTemp >= 50 ? 'bg-amber-500' : 'bg-rose-500'
                      }`}
                      style={{ width: `${activeHealth.sTemp}%` }}
                    />
                  </div>
                  <div className="text-[11px] font-mono text-slate-400 flex justify-between">
                    <span>Live: <b className="text-slate-200">{activeTelemetry.temperature}°C</b></span>
                    <span>Base: {activeMachine.baseTemp}°C</span>
                  </div>
                </div>

                {/* 3. Current Sub-Score (Weight: 20%) */}
                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-mono font-bold text-slate-300 flex items-center gap-1.5">
                      <Zap className="w-4 h-4 text-amber-400" /> Electrical Load (20%)
                    </span>
                    <span className="text-[10px] font-mono text-amber-400">Weight: 0.20</span>
                  </div>
                  <div className="text-2xl font-mono font-extrabold text-white my-1">
                    {activeHealth.sCurr}%
                  </div>
                  <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800 my-2">
                    <div
                      className={`h-full transition-all duration-500 ${
                        activeHealth.sCurr >= 70 ? 'bg-emerald-500' : activeHealth.sCurr >= 50 ? 'bg-amber-500' : 'bg-rose-500'
                      }`}
                      style={{ width: `${activeHealth.sCurr}%` }}
                    />
                  </div>
                  <div className="text-[11px] font-mono text-slate-400 flex justify-between">
                    <span>Live: <b className="text-slate-200">{activeTelemetry.current}A</b></span>
                    <span>Base: {activeMachine.baseCurrent}A</span>
                  </div>
                </div>

                {/* 4. Sound Sub-Score (Weight: 15%) */}
                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-mono font-bold text-slate-300 flex items-center gap-1.5">
                      <Volume2 className="w-4 h-4 text-indigo-400" /> Acoustic Health (15%)
                    </span>
                    <span className="text-[10px] font-mono text-indigo-400">Weight: 0.15</span>
                  </div>
                  <div className="text-2xl font-mono font-extrabold text-white my-1">
                    {activeHealth.sSound}%
                  </div>
                  <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800 my-2">
                    <div
                      className={`h-full transition-all duration-500 ${
                        activeHealth.sSound >= 70 ? 'bg-indigo-500' : activeHealth.sSound >= 50 ? 'bg-amber-500' : 'bg-rose-500'
                      }`}
                      style={{ width: `${activeHealth.sSound}%` }}
                    />
                  </div>
                  <div className="text-[11px] font-mono text-slate-400 flex justify-between">
                    <span>Live: <b className="text-slate-200">{activeTelemetry.sound}dB</b></span>
                    <span>Base: {activeMachine.baseSound}dB</span>
                  </div>
                </div>
              </div>

              {/* Mathematical Formula & Standards Explanation Panel */}
              <div className="p-5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <h4 className="text-xs font-bold text-cyan-300 font-mono flex items-center gap-2">
                    <Cpu className="w-4 h-4 text-cyan-400" />
                    Mathematical Formula & Industrial Normalization Matrix (Phase 4 Specification)
                  </h4>
                  <span className="text-[10px] font-mono text-slate-400">Industry 4.0 Standard</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono text-slate-300">
                  <div className="p-3 rounded-lg bg-slate-950 border border-slate-800/80 space-y-2">
                    <div className="text-cyan-400 font-bold">1. Multi-Modal Composite Health Formula:</div>
                    <code className="text-emerald-300 block bg-slate-900 p-2 rounded text-[11px]">
                      H = (0.35 × S_vib) + (0.30 × S_temp) + (0.20 × S_curr) + (0.15 × S_sound)
                    </code>
                    <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
                      Weights reflect mechanical degradation dominance in spinning and weaving plants. Vibration and temperature are leading indicators of bearing raceway fatigue and motor winding thermal breakdown.
                    </p>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-950 border border-slate-800/80 space-y-2">
                    <div className="text-cyan-400 font-bold">2. Industry 4.0 Grading Categories:</div>
                    <div className="space-y-1 text-[11px]">
                      <div className="flex justify-between p-1 rounded bg-emerald-950/40 text-emerald-300">
                        <span>90 - 100: Excellent</span>
                        <span>Nominal Operation</span>
                      </div>
                      <div className="flex justify-between p-1 rounded bg-blue-950/40 text-blue-300">
                        <span>70 - 89: Good</span>
                        <span>Routine Inspection</span>
                      </div>
                      <div className="flex justify-between p-1 rounded bg-amber-950/40 text-amber-300">
                        <span>50 - 69: Warning</span>
                        <span>Action Due &lt; 24h</span>
                      </div>
                      <div className="flex justify-between p-1 rounded bg-rose-950/40 text-rose-300">
                        <span>Below 50: Critical</span>
                        <span>Emergency Shutdown</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: IoT Sensor Simulator Cockpit */}
          {activeTab === 'simulator' && (
            <div className="space-y-6">
              {/* Fault Injection Control Deck */}
              <div className="p-5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <Wrench className="w-4 h-4 text-amber-400" />
                      Interactive Fault Injection Panel (Test All 6 Fault Scenarios)
                    </h3>
                    <p className="text-xs text-slate-400">
                      Inject simulated physical anomalies into <span className="text-cyan-300 font-mono">{activeMachine.id} ({activeMachine.name})</span>.
                    </p>
                  </div>
                  <span className="px-2.5 py-1 bg-amber-950/80 text-amber-300 border border-amber-800/80 rounded font-mono text-xs font-semibold">
                    6 Industrial Signatures
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {FAULT_TYPES.map((f) => {
                    const isCurrentlyActive = activeTelemetry.isFault && activeTelemetry.faultType === f.name;
                    return (
                      <div
                        key={f.name}
                        className={`p-3.5 rounded-xl border transition flex flex-col justify-between ${
                          isCurrentlyActive
                            ? 'bg-rose-950/40 border-rose-700 shadow-md shadow-rose-950'
                            : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="font-bold text-xs text-slate-200">{f.name}</span>
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 text-slate-300 border border-slate-800">
                              {f.badge}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400 mb-2 leading-relaxed">{f.desc}</p>
                          <div className="text-[10px] font-mono text-cyan-300/80 bg-slate-900/60 p-1.5 rounded border border-slate-800/60 mb-3">
                            <b>Impact:</b> {f.impact}
                          </div>
                        </div>

                        <button
                          onClick={() => handleInjectFault(f.name)}
                          className={`w-full py-1.5 px-3 rounded text-xs font-semibold font-mono transition flex items-center justify-center gap-1.5 ${
                            isCurrentlyActive
                              ? 'bg-rose-600 text-white'
                              : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                          }`}
                        >
                          {isCurrentlyActive ? (
                            <>
                              <AlertTriangle className="w-3.5 h-3.5 text-white animate-bounce" />
                              Active Fault
                            </>
                          ) : (
                            <>
                              <Flame className="w-3.5 h-3.5 text-amber-400" />
                              Inject {f.name}
                            </>
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Tab 3: Charts */}
          {activeTab === 'chart' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-cyan-400" /> Realtime Telemetry Monitor
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
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Phase 2 Schema & Architecture tabs preserved */}
          {activeTab === 'schema' && (
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-slate-300">
              <pre>{`-- SQLite Tables (Phase 2):
1. machines
2. machine_health
3. sensor_readings
4. failure_predictions
5. maintenance_logs
6. alerts
7. cost_analysis
8. chat_history
9. users`}</pre>
            </div>
          )}

          {activeTab === 'architecture' && (
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-slate-300">
              <pre>{`-- Complete System Architecture (Phase 1):
• Tier 1: Simulated IoT Engine (5s telemetry)
• Tier 2: FastAPI + SQLite WAL Database
• Tier 3: AI Health & Prediction Models
• Tier 4: Industry 4.0 Dashboard & Co-Pilot`}</pre>
            </div>
          )}

          {activeTab === 'apis' && (
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-slate-300 space-y-1">
              <div>• GET /api/v1/health/&#123;machine_id&#125; - Realtime health score (0-100) &amp; category</div>
              <div>• GET /api/v1/health/fleet/summary - Aggregated fleet health stats</div>
              <div>• POST /api/v1/health/compute - Ad-hoc health score calculation</div>
              <div>• GET /api/v1/health/history/&#123;machine_id&#125; - Historical health trends</div>
            </div>
          )}

          {/* Phase 4 Completion Banner */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-950/70 via-teal-950/50 to-cyan-950/70 border border-emerald-800/80 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">PHASE 4 COMPLETE: AI Health Score Engine Operational</h4>
                <p className="text-xs text-slate-300">
                  0-100 formula, Excellent/Good/Warning/Critical categories, Python service, FastAPI routes, and unit tests verified. Awaiting your command <span className="font-mono text-emerald-300 font-bold bg-emerald-950 px-1.5 py-0.5 rounded border border-emerald-800">&quot;CONTINUE&quot;</span> to begin <b>PHASE 5: FAILURE PREDICTION ENGINE</b>.
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
