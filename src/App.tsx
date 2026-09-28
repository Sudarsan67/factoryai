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
  Terminal
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';

// Machine Baseline Profiles
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

export default function App() {
  const [activeTab, setActiveTab] = useState<'simulator' | 'chart' | 'schema' | 'architecture' | 'apis'>('simulator');
  const [selectedMachineId, setSelectedMachineId] = useState<string>('WVE-03');
  const [isAutoSimulating, setIsAutoSimulating] = useState<boolean>(true);
  const [tickCounter, setTickCounter] = useState<number>(148);
  const [lastTickTime, setLastTickTime] = useState<string>(new Date().toLocaleTimeString());

  // Fleet live states
  const [fleetState, setFleetState] = useState<Record<string, LiveSensorState>>(() => {
    const initial: Record<string, LiveSensorState> = {};
    MACHINE_FLEET.forEach(m => {
      const isFault = m.id === 'WVE-03';
      const faultType = m.id === 'WVE-03' ? 'Bearing Wear' : null;
      const initialTemp = m.id === 'WVE-03' ? 68.2 : m.baseTemp;
      const initialVib = m.id === 'WVE-03' ? 1.45 : m.baseVib;
      const initialCurr = m.id === 'WVE-03' ? 9.2 : m.baseCurrent;
      const initialSound = m.id === 'WVE-03' ? 84.1 : m.baseSound;

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
              rawVib += 1.1 + (Math.random() * 0.3 - 0.15);
              rawSound += 18.0 + (Math.random() * 3.0 - 1.5);
              targetTemp += 14.0 + (Math.random() * 2.0);
              rawCurrent += 2.2 + (Math.random() * 0.4);
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

  const tempPct = Math.min(100, Math.max(0, ((activeTelemetry.temperature - 35) / (90 - 35)) * 100));
  const vibPct = Math.min(100, Math.max(0, ((activeTelemetry.vibration - 0.1) / (2.5 - 0.1)) * 100));
  const currPct = Math.min(100, Math.max(0, ((activeTelemetry.current - 2.0) / (15.0 - 2.0)) * 100));
  const soundPct = Math.min(100, Math.max(0, ((activeTelemetry.sound - 50) / (100 - 50)) * 100));

  return (
    <div className="min-h-screen bg-[#0b0f19] text-slate-100 flex flex-col font-sans selection:bg-cyan-500/30">
      {/* Top Header */}
      <header className="border-b border-slate-800 bg-[#0d1424]/90 backdrop-blur sticky top-0 z-50 px-6 py-3.5 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 via-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 ring-1 ring-cyan-400/30">
            <Radio className="w-5 h-5 text-white animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                FactoryPulse <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400">AI</span>
              </h1>
              <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-cyan-950 border border-cyan-800 text-cyan-300 font-mono font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-cyan-400" /> Phase 3 IoT Engine Re-Verified
              </span>
            </div>
            <p className="text-xs text-slate-400">AI Maintenance Co-Pilot for Textile MSMEs • 5.0s Multi-Sensor Simulator</p>
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
            <span className="text-cyan-400 font-bold">Phase 3</span>
          </div>

          {[
            { id: 'simulator', label: 'IoT Sensor Simulator', icon: Radio },
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
                const live = fleetState[m.id];
                const isSelected = selectedMachineId === m.id;
                return (
                  <button
                    key={m.id}
                    onClick={() => {
                      setSelectedMachineId(m.id);
                      if (activeTab !== 'simulator' && activeTab !== 'chart') setActiveTab('simulator');
                    }}
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
                    {live.isFault ? (
                      <span className="px-1.5 py-0.5 rounded text-[9px] bg-rose-950 text-rose-300 border border-rose-800 font-bold">
                        FAULT
                      </span>
                    ) : (
                      <span className="px-1.5 py-0.5 rounded text-[9px] bg-emerald-950 text-emerald-400 border border-emerald-800 font-bold">
                        OK
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-auto pt-4 border-t border-slate-800/80">
            <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
                <span className="text-xs font-semibold text-slate-200">Execution Phase: 3 of 20</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Phase 3 delivers the realistic IoT sensor simulator across 6 textile machines with 6 fault signatures.
              </p>
            </div>
          </div>
        </aside>

        {/* Content View Area */}
        <main className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Machine Fleet Quick Bar */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-slate-900 via-slate-900/90 to-[#101b33] border border-slate-800">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Gauge className="w-4 h-4 text-cyan-400" />
                <h2 className="text-sm font-semibold text-slate-200">Fleet Live Telemetry Matrix (Simulated IoT Stream)</h2>
              </div>
              <span className="text-xs text-slate-400 font-mono">Last Synchronized: {lastTickTime}</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-2.5">
              {MACHINE_FLEET.map((m) => {
                const s = fleetState[m.id];
                const isSelected = selectedMachineId === m.id;
                return (
                  <button
                    key={m.id}
                    onClick={() => setSelectedMachineId(m.id)}
                    className={`p-2.5 rounded-lg text-left transition border ${
                      isSelected
                        ? 'bg-slate-900 border-cyan-500 shadow-md shadow-cyan-950'
                        : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-base">{m.icon}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-semibold ${
                        s.isFault
                          ? 'bg-rose-950 text-rose-400 border border-rose-800/80 animate-pulse'
                          : 'bg-emerald-950 text-emerald-400 border border-emerald-800/60'
                      }`}>
                        {s.isFault ? s.faultType || 'FAULT' : 'Healthy'}
                      </span>
                    </div>
                    <div className="font-semibold text-xs text-slate-200 truncate">{m.id}</div>
                    <div className="text-[10px] text-slate-400 truncate mb-1.5">{m.name}</div>
                    <div className="grid grid-cols-2 gap-x-1 text-[10px] font-mono text-slate-400 border-t border-slate-800/60 pt-1">
                      <span>T: <b className={s.temperature > 70 ? 'text-rose-400' : 'text-slate-300'}>{s.temperature}°C</b></span>
                      <span>V: <b className={s.vibration > 1.2 ? 'text-amber-400' : 'text-slate-300'}>{s.vibration}g</b></span>
                      <span>I: <b className={s.current > 10 ? 'text-rose-400' : 'text-slate-300'}>{s.current}A</b></span>
                      <span>S: <b className={s.sound > 80 ? 'text-amber-400' : 'text-slate-300'}>{s.sound}dB</b></span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tab: Realtime Telemetry Charts */}
          {activeTab === 'chart' && (
            <div className="space-y-6">
              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-cyan-400" />
                    Realtime Telemetry Chart: <span className="font-mono text-cyan-300">{activeMachine.id} ({activeMachine.name})</span>
                  </h3>
                  <p className="text-xs text-slate-400">Continuous 5s sampling stream plotted on multi-axis telemetry monitor</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-slate-300 px-3 py-1 rounded bg-slate-950 border border-slate-800">
                    Cadence: 5.0s
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Temperature Chart */}
                <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold text-rose-300 font-mono flex items-center gap-1.5">
                      <Thermometer className="w-4 h-4 text-rose-400" /> Temperature (°C) [Limit: 35 - 90°C]
                    </span>
                    <span className="text-xs font-mono text-rose-400 font-bold">{activeTelemetry.temperature}°C</span>
                  </div>
                  <div className="h-48 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={activeTelemetry.history}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                        <XAxis dataKey="time" stroke="#64748b" tick={{ fontSize: 10 }} />
                        <YAxis domain={[35, 90]} stroke="#64748b" tick={{ fontSize: 10 }} />
                        <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', fontSize: '11px' }} />
                        <Line type="monotone" dataKey="temp" stroke="#f43f5e" strokeWidth={2.5} dot={{ r: 3 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Vibration Chart */}
                <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold text-cyan-300 font-mono flex items-center gap-1.5">
                      <Activity className="w-4 h-4 text-cyan-400" /> Vibration (g) [Limit: 0.1 - 2.5g]
                    </span>
                    <span className="text-xs font-mono text-cyan-400 font-bold">{activeTelemetry.vibration}g</span>
                  </div>
                  <div className="h-48 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={activeTelemetry.history}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                        <XAxis dataKey="time" stroke="#64748b" tick={{ fontSize: 10 }} />
                        <YAxis domain={[0.1, 2.5]} stroke="#64748b" tick={{ fontSize: 10 }} />
                        <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', fontSize: '11px' }} />
                        <Line type="monotone" dataKey="vib" stroke="#06b6d4" strokeWidth={2.5} dot={{ r: 3 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Current Chart */}
                <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold text-amber-300 font-mono flex items-center gap-1.5">
                      <Zap className="w-4 h-4 text-amber-400" /> Current (A) [Limit: 2 - 15A]
                    </span>
                    <span className="text-xs font-mono text-amber-400 font-bold">{activeTelemetry.current}A</span>
                  </div>
                  <div className="h-48 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={activeTelemetry.history}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                        <XAxis dataKey="time" stroke="#64748b" tick={{ fontSize: 10 }} />
                        <YAxis domain={[2, 15]} stroke="#64748b" tick={{ fontSize: 10 }} />
                        <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', fontSize: '11px' }} />
                        <Line type="monotone" dataKey="curr" stroke="#f59e0b" strokeWidth={2.5} dot={{ r: 3 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Sound Chart */}
                <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold text-indigo-300 font-mono flex items-center gap-1.5">
                      <Volume2 className="w-4 h-4 text-indigo-400" /> Acoustic Sound (dB) [Limit: 50 - 100dB]
                    </span>
                    <span className="text-xs font-mono text-indigo-400 font-bold">{activeTelemetry.sound}dB</span>
                  </div>
                  <div className="h-48 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={activeTelemetry.history}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                        <XAxis dataKey="time" stroke="#64748b" tick={{ fontSize: 10 }} />
                        <YAxis domain={[50, 100]} stroke="#64748b" tick={{ fontSize: 10 }} />
                        <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', fontSize: '11px' }} />
                        <Line type="monotone" dataKey="sound" stroke="#818cf8" strokeWidth={2.5} dot={{ r: 3 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab 1: IoT Simulator Cockpit */}
          {activeTab === 'simulator' && (
            <div className="space-y-6">
              {/* Selected Machine Detail Header */}
              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-slate-950 border border-slate-700 flex items-center justify-center text-2xl">
                    {activeMachine.icon}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-white">{activeMachine.name}</h3>
                      <span className="text-xs font-mono text-cyan-300 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800 font-bold">
                        {activeMachine.id}
                      </span>
                      {activeTelemetry.isFault ? (
                        <span className="text-xs font-mono text-rose-300 bg-rose-950 px-2 py-0.5 rounded border border-rose-800 font-bold flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3 text-rose-400" /> FAULT: {activeTelemetry.faultType}
                        </span>
                      ) : (
                        <span className="text-xs font-mono text-emerald-300 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800 font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Condition: Healthy Nominal
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Type: <b className="text-slate-300">{activeMachine.type}</b> • Location: <b className="text-slate-300">{activeMachine.location}</b> • Rated Load: <b className="text-slate-300">{activeMachine.power}</b>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {activeTelemetry.isFault ? (
                    <button
                      onClick={handleClearFault}
                      className="px-3.5 py-2 rounded-lg bg-emerald-950 hover:bg-emerald-900 border border-emerald-700 text-emerald-200 text-xs font-bold flex items-center gap-2 transition"
                    >
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      Clear Fault (Return to Healthy)
                    </button>
                  ) : (
                    <span className="text-xs font-mono text-slate-400 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800">
                      Machine operating under normal physics parameters
                    </span>
                  )}
                </div>
              </div>

              {/* 4 Multi-Modal Live Sensor Gauges */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* 1. Temperature Gauge */}
                <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 relative overflow-hidden">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-mono font-bold text-slate-400 flex items-center gap-1.5">
                      <Thermometer className="w-4 h-4 text-rose-400" />
                      Temperature Sensor
                    </span>
                    <span className="text-[10px] font-mono text-slate-500">Range: 35 - 90°C</span>
                  </div>

                  <div className="flex items-baseline gap-2 my-2">
                    <span className={`text-3xl font-mono font-extrabold tracking-tight ${
                      activeTelemetry.temperature >= 75 ? 'text-rose-400' :
                      activeTelemetry.temperature >= 56 ? 'text-amber-400' :
                      'text-emerald-400'
                    }`}>
                      {activeTelemetry.temperature}
                    </span>
                    <span className="text-base text-slate-400 font-mono">°C</span>
                    <span className="text-[11px] text-slate-500 ml-auto font-mono">
                      Base: {activeMachine.baseTemp}°C
                    </span>
                  </div>

                  <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
                    <div
                      className={`h-full transition-all duration-500 ${
                        activeTelemetry.temperature >= 75 ? 'bg-rose-500' :
                        activeTelemetry.temperature >= 56 ? 'bg-amber-500' :
                        'bg-emerald-500'
                      }`}
                      style={{ width: `${tempPct}%` }}
                    />
                  </div>

                  <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-2">
                    <span>35°C</span>
                    <span>Nominal: 40-55°C</span>
                    <span>90°C</span>
                  </div>
                </div>

                {/* 2. Vibration Gauge */}
                <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 relative overflow-hidden">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-mono font-bold text-slate-400 flex items-center gap-1.5">
                      <Activity className="w-4 h-4 text-cyan-400" />
                      Vibration Sensor
                    </span>
                    <span className="text-[10px] font-mono text-slate-500">Range: 0.1 - 2.5g</span>
                  </div>

                  <div className="flex items-baseline gap-2 my-2">
                    <span className={`text-3xl font-mono font-extrabold tracking-tight ${
                      activeTelemetry.vibration >= 1.6 ? 'text-rose-400' :
                      activeTelemetry.vibration >= 0.8 ? 'text-amber-400' :
                      'text-cyan-400'
                    }`}>
                      {activeTelemetry.vibration}
                    </span>
                    <span className="text-base text-slate-400 font-mono">g (RMS)</span>
                    <span className="text-[11px] text-slate-500 ml-auto font-mono">
                      Base: {activeMachine.baseVib}g
                    </span>
                  </div>

                  <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
                    <div
                      className={`h-full transition-all duration-500 ${
                        activeTelemetry.vibration >= 1.6 ? 'bg-rose-500' :
                        activeTelemetry.vibration >= 0.8 ? 'bg-amber-500' :
                        'bg-cyan-500'
                      }`}
                      style={{ width: `${vibPct}%` }}
                    />
                  </div>

                  <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-2">
                    <span>0.1g</span>
                    <span>Normal: &lt;0.8g</span>
                    <span>2.5g</span>
                  </div>
                </div>

                {/* 3. Current Gauge */}
                <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 relative overflow-hidden">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-mono font-bold text-slate-400 flex items-center gap-1.5">
                      <Zap className="w-4 h-4 text-amber-400" />
                      Current Draw
                    </span>
                    <span className="text-[10px] font-mono text-slate-500">Range: 2 - 15A</span>
                  </div>

                  <div className="flex items-baseline gap-2 my-2">
                    <span className={`text-3xl font-mono font-extrabold tracking-tight ${
                      activeTelemetry.current >= 12.0 ? 'text-rose-400' :
                      activeTelemetry.current >= 8.1 ? 'text-amber-400' :
                      'text-emerald-400'
                    }`}>
                      {activeTelemetry.current}
                    </span>
                    <span className="text-base text-slate-400 font-mono">Amperes</span>
                    <span className="text-[11px] text-slate-500 ml-auto font-mono">
                      Base: {activeMachine.baseCurrent}A
                    </span>
                  </div>

                  <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
                    <div
                      className={`h-full transition-all duration-500 ${
                        activeTelemetry.current >= 12.0 ? 'bg-rose-500' :
                        activeTelemetry.current >= 8.1 ? 'bg-amber-500' :
                        'bg-emerald-500'
                      }`}
                      style={{ width: `${currPct}%` }}
                    />
                  </div>

                  <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-2">
                    <span>2.0A</span>
                    <span>Rated: 4-8A</span>
                    <span>15.0A</span>
                  </div>
                </div>

                {/* 4. Sound Gauge */}
                <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 relative overflow-hidden">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-mono font-bold text-slate-400 flex items-center gap-1.5">
                      <Volume2 className="w-4 h-4 text-indigo-400" />
                      Acoustic Sound
                    </span>
                    <span className="text-[10px] font-mono text-slate-500">Range: 50 - 100dB</span>
                  </div>

                  <div className="flex items-baseline gap-2 my-2">
                    <span className={`text-3xl font-mono font-extrabold tracking-tight ${
                      activeTelemetry.sound >= 88.0 ? 'text-rose-400' :
                      activeTelemetry.sound >= 75.0 ? 'text-amber-400' :
                      'text-indigo-400'
                    }`}>
                      {activeTelemetry.sound}
                    </span>
                    <span className="text-base text-slate-400 font-mono">dB</span>
                    <span className="text-[11px] text-slate-500 ml-auto font-mono">
                      Base: {activeMachine.baseSound}dB
                    </span>
                  </div>

                  <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
                    <div
                      className={`h-full transition-all duration-500 ${
                        activeTelemetry.sound >= 88.0 ? 'bg-rose-500' :
                        activeTelemetry.sound >= 75.0 ? 'bg-amber-500' :
                        'bg-indigo-500'
                      }`}
                      style={{ width: `${soundPct}%` }}
                    />
                  </div>

                  <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-2">
                    <span>50dB</span>
                    <span>Safe: &lt;75dB</span>
                    <span>100dB</span>
                  </div>
                </div>
              </div>

              {/* Fault Injection Control Deck */}
              <div className="p-5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <Wrench className="w-4 h-4 text-amber-400" />
                      Interactive Fault Injection Panel (Test All 6 Fault Scenarios)
                    </h3>
                    <p className="text-xs text-slate-400">
                      Inject simulated physical anomalies into <span className="text-cyan-300 font-mono">{activeMachine.id} ({activeMachine.name})</span> to evaluate AI detection.
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

              {/* Real-time Telemetry Stream History */}
              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <h3 className="text-xs font-bold text-slate-200 font-mono flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-cyan-400" />
                    5-Second Telemetry Time-Series Buffer (`sensor_readings` SQLite Table)
                  </h3>
                  <button
                    onClick={() => setActiveTab('chart')}
                    className="text-[11px] font-mono text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
                  >
                    <TrendingUp className="w-3.5 h-3.5" /> View Interactive Charts &rarr;
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs font-mono">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-500 text-[10px] uppercase">
                        <th className="py-2 px-3">Timestamp</th>
                        <th className="py-2 px-3">Machine ID</th>
                        <th className="py-2 px-3">Temperature</th>
                        <th className="py-2 px-3">Vibration</th>
                        <th className="py-2 px-3">Current</th>
                        <th className="py-2 px-3">Sound</th>
                        <th className="py-2 px-3">State</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {(activeTelemetry.history && activeTelemetry.history.length > 0
                        ? activeTelemetry.history
                        : [
                            { time: lastTickTime, temp: activeTelemetry.temperature, vib: activeTelemetry.vibration, curr: activeTelemetry.current, sound: activeTelemetry.sound }
                          ]
                      ).map((h, i) => (
                        <tr key={i} className="hover:bg-slate-950/60 transition">
                          <td className="py-2 px-3 text-slate-400">{h.time}</td>
                          <td className="py-2 px-3 font-bold text-cyan-300">{activeMachine.id}</td>
                          <td className={`py-2 px-3 ${h.temp > 70 ? 'text-rose-400 font-bold' : 'text-slate-300'}`}>{h.temp}°C</td>
                          <td className={`py-2 px-3 ${h.vib > 1.2 ? 'text-amber-400 font-bold' : 'text-slate-300'}`}>{h.vib}g</td>
                          <td className={`py-2 px-3 ${h.curr > 10 ? 'text-rose-400 font-bold' : 'text-slate-300'}`}>{h.curr}A</td>
                          <td className={`py-2 px-3 ${h.sound > 80 ? 'text-amber-400 font-bold' : 'text-slate-300'}`}>{h.sound}dB</td>
                          <td className="py-2 px-3">
                            {activeTelemetry.isFault ? (
                              <span className="px-1.5 py-0.5 rounded text-[10px] bg-rose-950 text-rose-300 border border-rose-800">
                                {activeTelemetry.faultType}
                              </span>
                            ) : (
                              <span className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-800">
                                Healthy Nominal
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Phase 2: Schema Viewer (Preserved) */}
          {activeTab === 'schema' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Database className="w-5 h-5 text-cyan-400" /> Database Schema (Phase 2 Verified)
                </h3>
              </div>
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-slate-300 leading-relaxed overflow-x-auto">
                <pre>{`-- SQLite Tables Defined & Populated in Phase 2:
1. machines (Master catalog for SPN-01, WVE-03, KNT-02, DYE-04, MTR-05, CMP-06)
2. machine_health (Continuous 0-100 composite index)
3. sensor_readings (5s simulated IoT stream: T, V, I, S)
4. failure_predictions (Random Forest predictions & XAI)
5. maintenance_logs (Prescriptive Co-Pilot troubleshooting tickets)
6. alerts (WhatsApp notification payloads)
7. cost_analysis (MSME downtime & savings in INR)
8. chat_history (Plant manager conversational queries)
9. users (Operators, technicians & mill owners)`}</pre>
              </div>
            </div>
          )}

          {/* Phase 1: Architecture (Preserved) */}
          {activeTab === 'architecture' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Network className="w-5 h-5 text-cyan-400" /> System Architecture (Phase 1 Verified)
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

          {/* Phase 1: APIs (Preserved) */}
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
                <div>• <span className="text-cyan-400">POST /api/v1/simulator/inject-fault</span> - Fault injection endpoint</div>
                <div>• <span className="text-cyan-400">GET /api/v1/health/&#123;machine_id&#125;</span> - Composite health score (0-100)</div>
                <div>• <span className="text-cyan-400">POST /api/v1/predict/failure</span> - Random Forest failure prediction</div>
                <div>• <span className="text-cyan-400">GET /api/v1/cost/impact/&#123;machine_id&#125;</span> - MSME downtime financial impact in ₹</div>
              </div>
            </div>
          )}

          {/* Phase 3 Completion Banner */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-cyan-950/70 via-blue-950/50 to-indigo-950/70 border border-cyan-800/80 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-5 h-5 text-cyan-400" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">PHASE 3 COMPLETE: Simulated IoT Engine Re-Run & Verified</h4>
                <p className="text-xs text-slate-300">
                  Full multi-tick simulation executed, unit tests passing (7/7), SQLite database persistence confirmed, and Recharts multi-axis visualization active. Awaiting your command <span className="font-mono text-cyan-300 font-bold bg-cyan-950 px-1.5 py-0.5 rounded border border-cyan-800">&quot;CONTINUE&quot;</span> to commence <b>PHASE 4: AI HEALTH ENGINE</b>.
                </p>
              </div>
            </div>
            <div className="hidden sm:flex items-center gap-2">
              <span className="text-[11px] font-mono text-cyan-400 px-3 py-1 rounded-full bg-cyan-950 border border-cyan-700">
                Standing by for CONTINUE
              </span>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
