import React, { useState, useMemo } from 'react';
import {
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Sliders,
  TrendingUp,
  Cpu,
  Layers,
  Wrench,
  ShieldAlert,
  Flame,
  Volume2,
  Thermometer,
  Zap,
  Activity,
  Copy,
  Check,
  RefreshCw,
  Terminal,
  FileCode2,
  Table,
  ArrowRight,
  ExternalLink,
  ChevronRight,
  Info
} from 'lucide-react';

export interface MachineProfile {
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

export interface LiveSensorState {
  temperature: number;
  vibration: number;
  current: number;
  sound: number;
  isFault: boolean;
  faultType: string | null;
  history: Array<{ time: string; temp: number; vib: number; curr: number; sound: number }>;
}

interface SensorDevResult {
  name: string;
  actual: number;
  normal: number;
  unit: string;
  devPct: number;
  weight: number;
  severity: 'Nominal' | 'Elevated' | 'Warning' | 'Critical';
  statusMsg: string;
  icon: React.ReactNode;
  color: string;
}

interface XAIResult {
  machineId: string;
  machineName: string;
  machineType: string;
  location: string;
  isAtRisk: boolean;
  riskLevel: 'Nominal' | 'Elevated' | 'Warning' | 'Critical';
  topSensor: string;
  topDevPct: number;
  topUnit: string;
  topActual: number;
  topNormal: number;
  rootCause: string;
  summary: string;
  rationale: string;
  actions: string[];
  deviations: SensorDevResult[];
  rawJson: object;
}

export function computeXAIExplanation(
  temp: number,
  vib: number,
  curr: number,
  sound: number,
  prof: MachineProfile
): XAIResult {
  const calcDev = (val: number, base: number) => {
    return Math.round(((val - base) / base) * 1000) / 10;
  };

  const getSeverity = (dev: number): 'Nominal' | 'Elevated' | 'Warning' | 'Critical' => {
    if (dev <= 15.0) return 'Nominal';
    if (dev <= 50.0) return 'Elevated';
    if (dev <= 100.0) return 'Warning';
    return 'Critical';
  };

  const vDev = calcDev(vib, prof.baseVib);
  const tDev = calcDev(temp, prof.baseTemp);
  const cDev = calcDev(curr, prof.baseCurrent);
  const sDev = calcDev(sound, prof.baseSound);

  // Sensor domain weighting factors:
  // Vibration (1.5x) - highest mechanical vibration wear indicator
  // Temperature (1.3x) - coil thermal degradation
  // Current (1.2x) - electrical/torque overload
  // Sound (1.0x) - acoustic signature
  const rawRiskV = Math.max(0, vDev) * 1.5;
  const rawRiskT = Math.max(0, tDev) * 1.3;
  const rawRiskC = Math.max(0, cDev) * 1.2;
  const rawRiskS = Math.max(0, sDev) * 1.0;
  const totalRisk = rawRiskV + rawRiskT + rawRiskC + rawRiskS;

  const weights = totalRisk > 0.001 ? {
    v: Math.round((rawRiskV / totalRisk) * 1000) / 10,
    t: Math.round((rawRiskT / totalRisk) * 1000) / 10,
    c: Math.round((rawRiskC / totalRisk) * 1000) / 10,
    s: Math.round((rawRiskS / totalRisk) * 1000) / 10
  } : { v: 25.0, t: 25.0, c: 25.0, s: 25.0 };

  const deviations: SensorDevResult[] = [
    {
      name: 'Vibration RMS',
      actual: Number(vib.toFixed(3)),
      normal: prof.baseVib,
      unit: 'g',
      devPct: vDev,
      weight: weights.v,
      severity: getSeverity(vDev),
      statusMsg: `${vib.toFixed(2)} g vs ${prof.baseVib.toFixed(2)} g baseline`,
      icon: <Activity className="w-4 h-4 text-cyan-400" />,
      color: 'cyan'
    },
    {
      name: 'Temperature',
      actual: Number(temp.toFixed(1)),
      normal: prof.baseTemp,
      unit: '°C',
      devPct: tDev,
      weight: weights.t,
      severity: getSeverity(tDev),
      statusMsg: `${temp.toFixed(1)} °C vs ${prof.baseTemp.toFixed(1)} °C baseline`,
      icon: <Thermometer className="w-4 h-4 text-rose-400" />,
      color: 'rose'
    },
    {
      name: 'Current Draw',
      actual: Number(curr.toFixed(2)),
      normal: prof.baseCurrent,
      unit: 'A',
      devPct: cDev,
      weight: weights.c,
      severity: getSeverity(cDev),
      statusMsg: `${curr.toFixed(1)} A vs ${prof.baseCurrent.toFixed(1)} A baseline`,
      icon: <Zap className="w-4 h-4 text-amber-400" />,
      color: 'amber'
    },
    {
      name: 'Acoustic Sound',
      actual: Number(sound.toFixed(1)),
      normal: prof.baseSound,
      unit: 'dB',
      devPct: sDev,
      weight: weights.s,
      severity: getSeverity(sDev),
      statusMsg: `${sound.toFixed(1)} dB vs ${prof.baseSound.toFixed(1)} dB baseline`,
      icon: <Volume2 className="w-4 h-4 text-purple-400" />,
      color: 'purple'
    }
  ];

  const sorted = [...deviations].sort((a, b) => b.devPct - a.devPct);
  const top = sorted[0];

  const hasCrit = deviations.some(d => d.severity === 'Critical');
  const hasWarn = deviations.some(d => d.severity === 'Warning');
  const hasElev = deviations.some(d => d.severity === 'Elevated');

  let riskLevel: 'Nominal' | 'Elevated' | 'Warning' | 'Critical' = 'Nominal';
  if (hasCrit) riskLevel = 'Critical';
  else if (hasWarn) riskLevel = 'Warning';
  else if (hasElev) riskLevel = 'Elevated';

  const isAtRisk = hasCrit || hasWarn;

  let rootCause = 'Nominal Operating Parameters';
  let rationale = 'All physical parameters are operating within baseline tolerances (±15%). Stator thermal equilibrium, bearing lubrication films, and motor phase balance are in healthy equilibrium.';
  let actions = [
    'Continue standard textile spinning/weaving production schedule without interruption.',
    'Log routine visual inspection at next 8-hour shift change.',
    'Perform standard shift-end lint cleaning on motor intake cooling grates.'
  ];

  if (vDev >= 75.0 && (sDev >= 20.0 || vDev > tDev)) {
    rootCause = 'Bearing Degradation & Raceway Spalling';
    rationale = `Vibration level is elevated by +${vDev.toFixed(1)}% alongside sound elevation (+${sDev.toFixed(1)}%), matching high-frequency acoustic emissions from micro-spalling on inner/outer bearing raceways. Spindle harmonic resonance is propagating through the frame.`;
    actions = [
      'Halt loom during next shift transition to prevent spindle seizure.',
      'Inspect drive bearing housing using acoustic stethoscopic probe for ball-pass frequencies.',
      'Verify grease for metallic flake contamination; re-lubricate with ISO VG 220 high-temp grease.',
      'If vibration persists above 1.8g RMS during test spin, schedule spherical roller bearing replacement.'
    ];
  } else if (tDev >= 40.0 && cDev >= 25.0) {
    rootCause = 'Motor Stator Thermal Overload & Insulation Stress';
    rationale = `Temperature rise of +${tDev.toFixed(1)}% coupled with +${cDev.toFixed(1)}% current draw indicates stator coil overheating. Persistent heat accelerates Class F insulation breakdown and winding dielectric failure.`;
    actions = [
      'Inspect motor cooling fan cowl and blow out accumulated cotton lint fibers.',
      'Measure 3-phase resistance and current balance across stator terminals using clamp meter.',
      'Check carding cylinder belt tension to relieve unnecessary mechanical load.',
      'Temporarily throttle RPM setpoint by 10% until stator surface temperature stabilizes below 60°C.'
    ];
  } else if (cDev >= 50.0) {
    rootCause = 'Mechanical Over-Torque & Phase Load Surge';
    rationale = `Current draw is +${cDev.toFixed(1)}% above rated full load current (FLC), indicating excessive mechanical drag, stiff yarn delivery rollers, or phase imbalance.`;
    actions = [
      'Manually rotate drive shaft by hand to check for mechanical binding or tight spots.',
      'Inspect main drive gearbox lubrication oil level and viscosity.',
      'Verify yarn tensioners and guides are completely free from tangled waste threads.'
    ];
  } else if (sDev >= 30.0 && vDev >= 25.0) {
    rootCause = 'Gear Tooth Backlash & Acoustic Resonance';
    rationale = `Acoustic emissions (+${sDev.toFixed(1)}%) with elevated vibration (+${vDev.toFixed(1)}%) indicate gear tooth pitting, incorrect backlash clearance, or pneumatic nozzle chattering.`;
    actions = [
      'Open drive gear case and inspect gear teeth for pitting, wear steps, or backlash.',
      'Verify pneumatic nozzle pressure regulator is set to rated 5.5 bar.',
      'Tighten acoustic dampening enclosure panels and replace worn rubber shock dampers.'
    ];
  } else if (vDev >= 50.0 && cDev >= 20.0) {
    rootCause = 'Shaft Misalignment & Coupling Offset';
    rationale = `Combined radial vibration (+${vDev.toFixed(1)}%) and elevated current (+${cDev.toFixed(1)}%) point to 1X/2X rotational frequency coupling offset between motor and machine drive.`;
    actions = [
      'Perform laser or dial indicator alignment check between motor and drive shaft.',
      'Inspect flexible jaw coupling spider element for elastomeric fatigue or cracking.',
      'Torque motor mounting foot bolts to factory specification (85 Nm).'
    ];
  } else if (vDev >= 50.0) {
    rootCause = 'Structural Component Looseness & Anchor Slack';
    rationale = `Vibration spike of +${vDev.toFixed(1)}% without thermal overload is characteristic of loosened anchor bolts or frame structural resonance.`;
    actions = [
      'Torque machine base anchor bolts to specified factory torque.',
      'Inspect protective sheet metal covers and reinstall rubber dampers.'
    ];
  }

  let summary = '';
  if (isAtRisk) {
    summary = `Machine at risk: ${top.name} is +${top.devPct.toFixed(1)}% above normal (${top.actual} ${top.unit} vs ${top.normal} ${top.unit}), indicating ${rootCause.toLowerCase()}.`;
  } else if (riskLevel === 'Elevated') {
    summary = `Machine showing early stress: ${top.name} is elevated by +${top.devPct.toFixed(1)}% above baseline. Closely monitor trend to prevent escalation.`;
  } else {
    summary = 'Machine operating within normal parameters. All sensor readings are within healthy baseline tolerances (±15%).';
  }

  const rawJson = {
    machine_id: prof.id,
    machine_name: prof.name,
    is_at_risk: isAtRisk,
    risk_level: riskLevel,
    top_contributing_sensor: top.name,
    top_deviation_percent: top.devPct,
    diagnosed_root_cause: rootCause,
    human_readable_summary: summary,
    technical_rationale: rationale,
    immediate_prescriptive_action: actions.join('\n'),
    sensor_deviations: deviations.map(d => ({
      sensor_name: d.name,
      actual_value: d.actual,
      normal_value: d.normal,
      unit: d.unit,
      deviation_percent: d.devPct,
      contribution_weight: d.weight / 100,
      severity: d.severity
    })),
    generated_at: new Date().toISOString()
  };

  return {
    machineId: prof.id,
    machineName: prof.name,
    machineType: prof.type,
    location: prof.location,
    isAtRisk,
    riskLevel,
    topSensor: top.name,
    topDevPct: top.devPct,
    topUnit: top.unit,
    topActual: top.actual,
    topNormal: top.normal,
    rootCause,
    summary,
    rationale,
    actions,
    deviations,
    rawJson
  };
}

interface ExplainableAIEngineProps {
  fleetState: Record<string, LiveSensorState>;
  machineFleet: MachineProfile[];
  selectedMachineId: string;
  onSelectMachine: (id: string) => void;
  onNavigateToPredictor?: () => void;
}

export default function ExplainableAIEngine({
  fleetState,
  machineFleet,
  selectedMachineId,
  onSelectMachine,
  onNavigateToPredictor
}: ExplainableAIEngineProps) {
  const activeProfile = machineFleet.find(m => m.id === selectedMachineId) || machineFleet[1];
  const liveState = fleetState[activeProfile.id];

  // Interactive What-If Simulator state
  const [simTemp, setSimTemp] = useState<number>(liveState?.temperature || activeProfile.baseTemp);
  const [simVib, setSimVib] = useState<number>(liveState?.vibration || activeProfile.baseVib);
  const [simCurr, setSimCurr] = useState<number>(liveState?.current || activeProfile.baseCurrent);
  const [simSound, setSimSound] = useState<number>(liveState?.sound || activeProfile.baseSound);
  const [copiedJson, setCopiedJson] = useState<boolean>(false);
  const [isLiveSync, setIsLiveSync] = useState<boolean>(true);

  // When live sync is active, update simulator values
  React.useEffect(() => {
    if (isLiveSync && liveState) {
      setSimTemp(liveState.temperature);
      setSimVib(liveState.vibration);
      setSimCurr(liveState.current);
      setSimSound(liveState.sound);
    }
  }, [liveState, isLiveSync]);

  const xaiResult = useMemo(() => {
    return computeXAIExplanation(simTemp, simVib, simCurr, simSound, activeProfile);
  }, [simTemp, simVib, simCurr, simSound, activeProfile]);

  const handleCopyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(xaiResult.rawJson, null, 2));
    setCopiedJson(true);
    setTimeout(() => setCopiedJson(false), 2000);
  };

  const handleLoadPreset = (preset: 'bearing' | 'overheat' | 'electrical' | 'chatter' | 'misalignment' | 'healthy') => {
    setIsLiveSync(false);
    switch (preset) {
      case 'bearing':
        setSimTemp(Number((activeProfile.baseTemp + 12).toFixed(1)));
        setSimVib(Number((activeProfile.baseVib * 3.4).toFixed(2)));
        setSimCurr(Number((activeProfile.baseCurrent + 1.2).toFixed(1)));
        setSimSound(Number((activeProfile.baseSound + 16).toFixed(1)));
        break;
      case 'overheat':
        setSimTemp(Number((activeProfile.baseTemp + 32).toFixed(1)));
        setSimVib(Number((activeProfile.baseVib + 0.15).toFixed(2)));
        setSimCurr(Number((activeProfile.baseCurrent + 5.5).toFixed(1)));
        setSimSound(Number((activeProfile.baseSound + 6).toFixed(1)));
        break;
      case 'electrical':
        setSimTemp(Number((activeProfile.baseTemp + 16).toFixed(1)));
        setSimVib(Number((activeProfile.baseVib + 0.2).toFixed(2)));
        setSimCurr(Number((activeProfile.baseCurrent * 2.1).toFixed(1)));
        setSimSound(Number((activeProfile.baseSound + 5).toFixed(1)));
        break;
      case 'chatter':
        setSimTemp(Number((activeProfile.baseTemp + 7).toFixed(1)));
        setSimVib(Number((activeProfile.baseVib * 1.8).toFixed(2)));
        setSimCurr(Number((activeProfile.baseCurrent + 0.8).toFixed(1)));
        setSimSound(Number((activeProfile.baseSound + 22).toFixed(1)));
        break;
      case 'misalignment':
        setSimTemp(Number((activeProfile.baseTemp + 10).toFixed(1)));
        setSimVib(Number((activeProfile.baseVib * 2.5).toFixed(2)));
        setSimCurr(Number((activeProfile.baseCurrent + 2.4).toFixed(1)));
        setSimSound(Number((activeProfile.baseSound + 10).toFixed(1)));
        break;
      case 'healthy':
        setSimTemp(activeProfile.baseTemp);
        setSimVib(activeProfile.baseVib);
        setSimCurr(activeProfile.baseCurrent);
        setSimSound(activeProfile.baseSound);
        break;
    }
  };

  const handleSyncLive = () => {
    if (liveState) {
      setSimTemp(liveState.temperature);
      setSimVib(liveState.vibration);
      setSimCurr(liveState.current);
      setSimSound(liveState.sound);
      setIsLiveSync(true);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & XAI Specifications */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <div className="lg:col-span-3 p-5 rounded-2xl bg-gradient-to-br from-slate-900 via-cyan-950/40 to-slate-900 border border-cyan-800/50 shadow-xl relative overflow-hidden">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-wider bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-semibold flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-cyan-400" /> Explainable AI (XAI) Engine
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  Deterministic Attribution
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Natural Language Synthesis
                </span>
              </div>

              <h2 className="text-xl font-bold text-white mt-2 flex items-center gap-2">
                Explainable AI (XAI) Root Cause Attribution
              </h2>

              <p className="text-xs text-slate-300 mt-1 max-w-3xl leading-relaxed">
                Deconstructs multi-channel sensor signals into transparent percentage deviations against equipment baselines:{' '}
                <code className="text-cyan-300 font-mono bg-cyan-950/80 px-1.5 py-0.5 rounded border border-cyan-800/80">
                  Deviation % = ((Actual - Baseline) / Baseline) × 100
                </code>
                . Isolates the primary contributing stress factor, attributes physical root causes, and generates actionable prescriptive instructions for shopfloor technicians.
              </p>
            </div>

            <div className="flex flex-col gap-2 shrink-0">
              <button
                onClick={handleSyncLive}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition ${
                  isLiveSync
                    ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-600/30'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
                }`}
                title="Synchronize with live IoT telemetry stream"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLiveSync ? 'animate-spin' : ''}`} />
                <span>{isLiveSync ? 'Live Telemetry Linked' : 'Link Live Stream'}</span>
              </button>

              <button
                onClick={handleCopyJson}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition"
              >
                {copiedJson ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedJson ? 'Copied XAI JSON' : 'Export XAI JSON'}</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-slate-800/80 text-xs">
            <div>
              <div className="text-[10px] text-slate-400 font-mono">Attribution Logic</div>
              <div className="font-semibold text-slate-200">Exact Baseline Deviation</div>
            </div>
            <div>
              <div className="text-[10px] text-slate-400 font-mono">Tolerance Threshold</div>
              <div className="font-semibold text-emerald-300 font-mono">±15.0% Healthy Band</div>
            </div>
            <div>
              <div className="text-[10px] text-slate-400 font-mono">Critical Boundary</div>
              <div className="font-semibold text-rose-400 font-mono">&gt; +100% Deviation</div>
            </div>
            <div>
              <div className="text-[10px] text-slate-400 font-mono">Database Integration</div>
              <div className="font-semibold text-cyan-300 font-mono">failure_predictions.xai_*</div>
            </div>
          </div>
        </div>

        {/* Selected Machine Switcher Card */}
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Asset Under Inspection</div>
            <div className="mt-2 flex items-center gap-3">
              <span className="text-3xl p-2 rounded-xl bg-slate-800 border border-slate-700">{activeProfile.icon}</span>
              <div>
                <div className="text-base font-bold text-white flex items-center gap-1.5">
                  <span className="font-mono text-cyan-400">{activeProfile.id}</span>
                </div>
                <div className="text-xs text-slate-300 font-medium truncate max-w-[160px]">{activeProfile.name}</div>
                <div className="text-[10px] text-slate-500">{activeProfile.location}</div>
              </div>
            </div>
          </div>

          <div className="mt-3">
            <label className="text-[10px] font-mono text-slate-400 block mb-1">Switch Inspection Asset:</label>
            <select
              value={selectedMachineId}
              onChange={(e) => onSelectMachine(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-cyan-500"
            >
              {machineFleet.map(m => (
                <option key={m.id} value={m.id}>
                  {m.id} - {m.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Human-Readable Natural Language Explanation Banner */}
      <div className={`p-5 rounded-2xl border transition-all ${
        xaiResult.riskLevel === 'Critical'
          ? 'bg-gradient-to-r from-rose-950/80 via-red-950/60 to-rose-950/80 border-rose-700/80 shadow-lg shadow-rose-950/40'
          : xaiResult.riskLevel === 'Warning'
          ? 'bg-gradient-to-r from-amber-950/80 via-yellow-950/50 to-amber-950/80 border-amber-700/80 shadow-lg shadow-amber-950/40'
          : xaiResult.riskLevel === 'Elevated'
          ? 'bg-gradient-to-r from-blue-950/70 via-indigo-950/50 to-blue-950/70 border-blue-700/70 shadow-lg shadow-blue-950/30'
          : 'bg-gradient-to-r from-emerald-950/70 via-teal-950/50 to-emerald-950/70 border-emerald-700/70'
      }`}>
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
              xaiResult.riskLevel === 'Critical'
                ? 'bg-rose-500/20 border-rose-400/50 text-rose-400 animate-pulse'
                : xaiResult.riskLevel === 'Warning'
                ? 'bg-amber-500/20 border-amber-400/50 text-amber-400'
                : xaiResult.riskLevel === 'Elevated'
                ? 'bg-blue-500/20 border-blue-400/50 text-blue-400'
                : 'bg-emerald-500/20 border-emerald-400/50 text-emerald-400'
            }`}>
              {xaiResult.isAtRisk ? <AlertTriangle className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-900/80 text-slate-300 font-semibold border border-slate-700">
                  Natural Language Synthesis Output
                </span>
                <span className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded-full font-bold border ${
                  xaiResult.riskLevel === 'Critical'
                    ? 'bg-rose-900 text-rose-200 border-rose-600'
                    : xaiResult.riskLevel === 'Warning'
                    ? 'bg-amber-900 text-amber-200 border-amber-600'
                    : xaiResult.riskLevel === 'Elevated'
                    ? 'bg-blue-900 text-blue-200 border-blue-600'
                    : 'bg-emerald-900 text-emerald-200 border-emerald-600'
                }`}>
                  Risk Level: {xaiResult.riskLevel}
                </span>
              </div>

              <div className="text-base sm:text-lg font-bold text-white mt-1.5 tracking-tight leading-snug">
                &ldquo;{xaiResult.summary}&rdquo;
              </div>

              <p className="text-xs text-slate-300 mt-1">
                Primary factor identified:{' '}
                <span className="font-semibold text-cyan-300">{xaiResult.topSensor}</span> (+{xaiResult.topDevPct.toFixed(1)}% vs rated baseline).
              </p>
            </div>
          </div>

          <div className="shrink-0 flex items-center gap-2">
            <span className="px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-700 text-xs font-mono text-slate-300 flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-cyan-400" />
              <span>Factor: {xaiResult.topSensor}</span>
            </span>
          </div>
        </div>
      </div>

      {/* 4-Sensor Deviation & Normalized Risk Contribution Grid */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-cyan-400" />
              4-Channel Baseline Deviation &amp; Risk Contribution
            </h3>
            <p className="text-xs text-slate-400">
              Evaluated against nominal engineering setpoints for {activeProfile.name} ({activeProfile.id}).
            </p>
          </div>
          <div className="text-[11px] font-mono text-slate-400">
            Formula: <span className="text-cyan-300">((Actual - Baseline) / Baseline) × 100</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {xaiResult.deviations.map((dev) => {
            const isTop = dev.name === xaiResult.topSensor;
            let badgeBg = 'bg-emerald-950 text-emerald-300 border-emerald-700';
            if (dev.severity === 'Elevated') badgeBg = 'bg-blue-950 text-blue-300 border-blue-700';
            if (dev.severity === 'Warning') badgeBg = 'bg-amber-950 text-amber-300 border-amber-700';
            if (dev.severity === 'Critical') badgeBg = 'bg-rose-950 text-rose-300 border-rose-700 animate-pulse';

            return (
              <div
                key={dev.name}
                className={`p-4 rounded-xl bg-slate-900/80 border transition-all ${
                  isTop
                    ? 'border-cyan-500/80 ring-1 ring-cyan-500/30 shadow-lg shadow-cyan-950/50'
                    : 'border-slate-800'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-slate-800 border border-slate-700">
                      {dev.icon}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white">{dev.name}</div>
                      <div className="text-[10px] text-slate-400">{dev.statusMsg}</div>
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border ${badgeBg}`}>
                    {dev.severity}
                  </span>
                </div>

                {/* Big Deviation Metric */}
                <div className="mt-3 flex items-baseline justify-between">
                  <div className="text-2xl font-extrabold font-mono text-white">
                    <span className={dev.devPct > 50 ? 'text-rose-400' : dev.devPct > 15 ? 'text-amber-400' : 'text-emerald-400'}>
                      {dev.devPct >= 0 ? `+${dev.devPct.toFixed(1)}%` : `${dev.devPct.toFixed(1)}%`}
                    </span>
                  </div>
                  <div className="text-[11px] font-mono text-slate-400">
                    Normal: {dev.normal} {dev.unit}
                  </div>
                </div>

                {/* Contribution Weight Bar */}
                <div className="mt-3 pt-3 border-t border-slate-800/80 space-y-1">
                  <div className="flex justify-between text-[11px] font-mono">
                    <span className="text-slate-400">Attribution Weight:</span>
                    <span className="text-cyan-300 font-bold">{dev.weight.toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${
                        isTop ? 'bg-gradient-to-r from-cyan-400 to-blue-500' : 'bg-slate-500'
                      }`}
                      style={{ width: `${Math.min(100, dev.weight)}%` }}
                    />
                  </div>
                </div>

                {isTop && (
                  <div className="mt-2 text-[10px] font-mono text-cyan-400 font-semibold flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> Primary Risk Trigger
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Root Cause Diagnosis & Prescriptive Actions Cockpit */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 6 Columns: Physical Root Cause & Engineering Rationale */}
        <div className="lg:col-span-6 p-5 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-amber-400" />
                Physical Root Cause Attribution
              </h3>
              <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                Engineering Rationale
              </span>
            </div>

            <div className="mt-4 p-4 rounded-xl bg-slate-950/80 border border-slate-800">
              <div className="text-xs uppercase font-mono tracking-wider text-slate-400">Diagnosed Fault Signature</div>
              <div className="text-base font-bold text-white mt-1 flex items-center gap-2">
                <Wrench className="w-4 h-4 text-cyan-400 shrink-0" />
                <span>{xaiResult.rootCause}</span>
              </div>
              <div className="mt-3 text-xs text-slate-300 leading-relaxed font-sans">
                {xaiResult.rationale}
              </div>
            </div>

            <div className="mt-4 p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs space-y-2">
              <div className="font-semibold text-slate-200 flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-cyan-400" />
                <span>Textile MSME Operating Context</span>
              </div>
              <p className="text-slate-400 leading-relaxed">
                Textile machinery in spinning and weaving plants operates under continuous 24/7 duty cycles. Environmental fiber lint contamination and high room ambient humidity accelerate bearing micro-spalling and motor thermal insulation degradation.
              </p>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 font-mono text-[11px] text-slate-400 flex items-center justify-between">
            <span>Machine Location: <span className="text-slate-200">{activeProfile.location}</span></span>
            <span>Rated Power: <span className="text-cyan-400">{activeProfile.power}</span></span>
          </div>
        </div>

        {/* Right 6 Columns: Immediate Prescriptive Action Plan */}
        <div className="lg:col-span-6 p-5 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Wrench className="w-4 h-4 text-emerald-400" />
                Prescriptive Maintenance Action Checklist
              </h3>
              <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                Technician SOP
              </span>
            </div>

            <p className="text-xs text-slate-400 mt-1">
              Step-by-step diagnostic and remediation protocols generated by the AI Maintenance Co-Pilot.
            </p>

            <div className="mt-4 space-y-2.5">
              {xaiResult.actions.map((act, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 flex items-start gap-3 text-xs"
                >
                  <div className="w-6 h-6 rounded-lg bg-cyan-950 border border-cyan-800 text-cyan-300 font-mono font-bold flex items-center justify-center shrink-0 mt-0.5">
                    {idx + 1}
                  </div>
                  <div className="text-slate-200 leading-relaxed">{act}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-400">Need failure probability &amp; RUL?</span>
            {onNavigateToPredictor && (
              <button
                onClick={onNavigateToPredictor}
                className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold flex items-center gap-1.5 transition text-xs"
              >
                <span>View Random Forest Predictor</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Interactive What-If XAI Scenario Simulator */}
      <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Sliders className="w-4 h-4 text-cyan-400" />
              Interactive What-If XAI Scenario Simulator
            </h3>
            <p className="text-xs text-slate-400">
              Modulate input telemetry to observe real-time recalculation of baseline percentage deviations and natural language explanations.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[10px] font-mono text-slate-400 mr-1">Presets:</span>
            <button
              onClick={() => handleLoadPreset('bearing')}
              className="px-2.5 py-1 rounded-lg bg-rose-950/80 hover:bg-rose-900 border border-rose-800 text-rose-300 text-[10px] font-semibold transition"
            >
              Bearing Spalling (+240% Vib)
            </button>
            <button
              onClick={() => handleLoadPreset('overheat')}
              className="px-2.5 py-1 rounded-lg bg-amber-950/80 hover:bg-amber-900 border border-amber-800 text-amber-300 text-[10px] font-semibold transition"
            >
              Motor Overheat (+65% Temp)
            </button>
            <button
              onClick={() => handleLoadPreset('electrical')}
              className="px-2.5 py-1 rounded-lg bg-yellow-950/80 hover:bg-yellow-900 border border-yellow-800 text-yellow-300 text-[10px] font-semibold transition"
            >
              Phase Load Surge (+110% Curr)
            </button>
            <button
              onClick={() => handleLoadPreset('chatter')}
              className="px-2.5 py-1 rounded-lg bg-purple-950/80 hover:bg-purple-900 border border-purple-800 text-purple-300 text-[10px] font-semibold transition"
            >
              Gear Chatter (+35% Sound)
            </button>
            <button
              onClick={() => handleLoadPreset('healthy')}
              className="px-2.5 py-1 rounded-lg bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-800 text-emerald-300 text-[10px] font-semibold transition"
            >
              Healthy Baseline
            </button>
          </div>
        </div>

        {/* 4 Interactive Sliders */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Temperature Slider */}
          <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800/80 space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                <Thermometer className="w-3.5 h-3.5 text-rose-400" /> Temperature
              </span>
              <span className="font-mono font-bold text-rose-400">{simTemp.toFixed(1)} °C</span>
            </div>
            <input
              type="range"
              min="35.0"
              max="90.0"
              step="0.5"
              value={simTemp}
              onChange={(e) => {
                setIsLiveSync(false);
                setSimTemp(parseFloat(e.target.value));
              }}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-rose-500"
            />
            <div className="flex justify-between text-[10px] font-mono text-slate-500">
              <span>Base: {activeProfile.baseTemp}°C</span>
              <span>Dev: {(((simTemp - activeProfile.baseTemp) / activeProfile.baseTemp) * 100).toFixed(1)}%</span>
            </div>
          </div>

          {/* Vibration Slider */}
          <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800/80 space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-cyan-400" /> Vibration RMS
              </span>
              <span className="font-mono font-bold text-cyan-400">{simVib.toFixed(2)} g</span>
            </div>
            <input
              type="range"
              min="0.10"
              max="2.50"
              step="0.02"
              value={simVib}
              onChange={(e) => {
                setIsLiveSync(false);
                setSimVib(parseFloat(e.target.value));
              }}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
            />
            <div className="flex justify-between text-[10px] font-mono text-slate-500">
              <span>Base: {activeProfile.baseVib}g</span>
              <span>Dev: {(((simVib - activeProfile.baseVib) / activeProfile.baseVib) * 100).toFixed(1)}%</span>
            </div>
          </div>

          {/* Current Slider */}
          <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800/80 space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-amber-400" /> Current Draw
              </span>
              <span className="font-mono font-bold text-amber-400">{simCurr.toFixed(1)} A</span>
            </div>
            <input
              type="range"
              min="2.0"
              max="15.0"
              step="0.1"
              value={simCurr}
              onChange={(e) => {
                setIsLiveSync(false);
                setSimCurr(parseFloat(e.target.value));
              }}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
            />
            <div className="flex justify-between text-[10px] font-mono text-slate-500">
              <span>Base: {activeProfile.baseCurrent}A</span>
              <span>Dev: {(((simCurr - activeProfile.baseCurrent) / activeProfile.baseCurrent) * 100).toFixed(1)}%</span>
            </div>
          </div>

          {/* Sound Slider */}
          <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800/80 space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                <Volume2 className="w-3.5 h-3.5 text-purple-400" /> Sound Level
              </span>
              <span className="font-mono font-bold text-purple-400">{simSound.toFixed(1)} dB</span>
            </div>
            <input
              type="range"
              min="50.0"
              max="100.0"
              step="0.5"
              value={simSound}
              onChange={(e) => {
                setIsLiveSync(false);
                setSimSound(parseFloat(e.target.value));
              }}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
            />
            <div className="flex justify-between text-[10px] font-mono text-slate-500">
              <span>Base: {activeProfile.baseSound}dB</span>
              <span>Dev: {(((simSound - activeProfile.baseSound) / activeProfile.baseSound) * 100).toFixed(1)}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Fleet-Wide Explainable AI Anomaly Matrix */}
      <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Table className="w-4 h-4 text-cyan-400" />
              Textile Plant Fleet Explainable AI Anomaly Matrix
            </h3>
            <p className="text-xs text-slate-400">
              Continuous baseline deviation tracking and automated root-cause attribution across all 6 plant assets.
            </p>
          </div>
          <span className="text-xs font-mono text-slate-400">
            Target SQLite: <code>failure_predictions(xai_primary_factor)</code>
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-950/80 text-slate-400 font-mono uppercase text-[10px] border-b border-slate-800">
              <tr>
                <th className="p-3">Asset</th>
                <th className="p-3">Type &amp; Section</th>
                <th className="p-3">Live Telemetry</th>
                <th className="p-3">Top Deviating Factor</th>
                <th className="p-3">Risk Level</th>
                <th className="p-3">Diagnosed Physical Root Cause</th>
                <th className="p-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {machineFleet.map((m) => {
                const s = fleetState[m.id];
                const xai = computeXAIExplanation(s.temperature, s.vibration, s.current, s.sound, m);

                let badge = 'bg-emerald-950/80 text-emerald-300 border-emerald-800';
                if (xai.riskLevel === 'Elevated') badge = 'bg-blue-950/80 text-blue-300 border-blue-800';
                if (xai.riskLevel === 'Warning') badge = 'bg-amber-950/80 text-amber-300 border-amber-800';
                if (xai.riskLevel === 'Critical') badge = 'bg-rose-950/80 text-rose-300 border-rose-800 animate-pulse';

                const isCurrent = m.id === selectedMachineId;

                return (
                  <tr
                    key={m.id}
                    className={`transition ${isCurrent ? 'bg-slate-800/60' : 'hover:bg-slate-800/30'}`}
                  >
                    <td className="p-3 font-semibold text-slate-200">
                      <div className="flex items-center gap-2">
                        <span>{m.icon}</span>
                        <span className="font-mono text-cyan-400 font-bold">{m.id}</span>
                        {isCurrent && (
                          <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-cyan-900/60 text-cyan-300">
                            Active
                          </span>
                        )}
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
                      <div className="font-semibold text-slate-200">{xai.topSensor}</div>
                      <div className="font-mono text-[10px] text-cyan-400">
                        {xai.topDevPct >= 0 ? `+${xai.topDevPct.toFixed(1)}%` : `${xai.topDevPct.toFixed(1)}%`}
                      </div>
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded-full font-mono font-bold text-[10px] border ${badge}`}>
                        {xai.riskLevel}
                      </span>
                    </td>
                    <td className="p-3 text-slate-300 font-medium">
                      {xai.rootCause}
                    </td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => {
                          onSelectMachine(m.id);
                          setSimTemp(s.temperature);
                          setSimVib(s.vibration);
                          setSimCurr(s.current);
                          setSimSound(s.sound);
                          setIsLiveSync(true);
                        }}
                        className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-semibold border border-slate-700 transition"
                      >
                        Diagnose Asset
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Database Schema & REST API Inspector for Phase 6 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3 font-mono text-xs">
          <div className="flex items-center justify-between text-slate-300 font-sans font-bold">
            <span className="flex items-center gap-2">
              <FileCode2 className="w-4 h-4 text-cyan-400" />
              SQLite Schema Table 4: failure_predictions
            </span>
            <span className="text-[10px] font-mono text-emerald-400">Phase 6 Schema Columns</span>
          </div>
          <pre className="p-3 rounded-xl bg-slate-950 text-slate-300 text-[11px] overflow-x-auto leading-relaxed border border-slate-800">
{`-- XAI persistence columns in SQLite:
CREATE TABLE failure_predictions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    machine_id VARCHAR(32) NOT NULL,
    prediction_label VARCHAR(20) NOT NULL,
    failure_probability REAL NOT NULL,
    predicted_fault VARCHAR(100),
    estimated_rul_hours REAL,
    xai_primary_factor VARCHAR(50),      -- e.g. "Vibration"
    xai_explanation_json TEXT NOT NULL,  -- JSON breakdown of % changes
    predicted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);`}
          </pre>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3 font-mono text-xs">
          <div className="flex items-center justify-between text-slate-300 font-sans font-bold">
            <span className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-indigo-400" />
              FastAPI Endpoints (Phase 6)
            </span>
            <span className="text-[10px] font-mono text-cyan-400">router: /api/v1/xai</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-950 text-slate-300 text-[11px] space-y-1.5 border border-slate-800">
            <div><span className="text-emerald-400 font-bold">POST</span> /api/v1/xai/explain <span className="text-slate-500">- Arbitrary telemetry</span></div>
            <div><span className="text-blue-400 font-bold">GET</span>  /api/v1/xai/machine/&#123;id&#125; <span className="text-slate-500">- From SQLite latest</span></div>
            <div><span className="text-blue-400 font-bold">GET</span>  /api/v1/xai/fleet <span className="text-slate-500">- Entire textile plant</span></div>
            <div><span className="text-blue-400 font-bold">GET</span>  /api/v1/xai/baselines <span className="text-slate-500">- Machinery baselines</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}
