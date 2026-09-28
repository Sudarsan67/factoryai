import React, { useState, useMemo } from 'react';
import {
  Bell,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  DollarSign,
  Clock,
  ShieldCheck,
  Send,
  MessageCircle,
  Phone,
  Sliders,
  Table,
  Check,
  RefreshCw,
  ExternalLink,
  ChevronRight,
  Info,
  Calendar,
  Sparkles,
  ArrowRight,
  Zap,
  Building,
  Wrench
} from 'lucide-react';
import { MachineProfile, LiveSensorState } from './ExplainableAIEngine';

export interface AlertsAndCostEngineProps {
  fleetState: Record<string, LiveSensorState>;
  machineFleet: MachineProfile[];
  selectedMachineId: string;
  onSelectMachine: (id: string) => void;
  onNavigateToCoPilot?: () => void;
}

interface WhatsAppAlert {
  id: number;
  machineId: string;
  machineName: string;
  title: string;
  severity: 'Info' | 'Warning' | 'Critical';
  phone: string;
  messageEn: string;
  messageTa: string;
  messageHi: string;
  time: string;
  isAcknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: string;
}

const INITIAL_ALERTS: WhatsAppAlert[] = [
  {
    id: 1,
    machineId: 'WVE-03',
    machineName: 'Air Jet Weaving Loom',
    title: 'Severe Bearing Vibration Surge (> 1.55g RMS)',
    severity: 'Critical',
    phone: '+91 98421 78920 (Weaving Master)',
    messageEn: `🚨 *CRITICAL ALERT: FACTORYPULSE AI*
━━━━━━━━━━━━━━━━━━
🏭 *Mill:* Coimbatore Textile Asset #1
⚙️ *Machine:* WVE-03 (Air Jet Weaving Loom)
📍 *Location:* Weaving Shed B
⚠️ *Severity:* *CRITICAL* (Bearing Vibration Surge)
━━━━━━━━━━━━━━━━━━
📊 *Trigger:* Vibration is +244.4% above normal (1.55g vs 0.45g baseline)
🔍 *Diagnosis:* Bearing Degradation & Raceway Spalling
⏳ *Remaining Life (RUL):* 14 Operating Hours
━━━━━━━━━━━━━━━━━━
🛠️ *Prescriptive Action:*
1. Halt loom under LOTO electrical lock.
2. Inspect bearing housing with acoustic probe.
3. Re-grease with ISO VG 220 synthetic lubricant.

📲 *Reply:* Tap 1 to Acknowledge | Tap 2 for SOP`,
    messageTa: `🚨 *தொழிற்சாலை எச்சரிக்கை: FACTORYPULSE AI*
━━━━━━━━━━━━━━━━━━
🏭 *ஆலை:* கோயம்புத்தூர் டெக்ஸ்டைல் யூனிட்
⚙️ *இயந்திரம்:* WVE-03 - Air Jet Weaving Loom
📍 *இடம்:* Weaving Shed B
⚠️ *நிலை:* *CRITICAL* (தாங்கி அதிர்வு எச்சரிக்கை)
━━━━━━━━━━━━━━━━━━
📊 *முதன்மை காரணி:* அதிர்வு +244.4% இயல்புக்கு மேல் (1.55g vs 0.45g)
🔍 *கண்டறியப்பட்ட பழுது:* தாங்கி தேய்மானம் & ரேஸ்வே பிளவுகள்
⏳ *எஞ்சிய பயனுள்ள காலம் (RUL):* 14 மணி நேரம்
━━━━━━━━━━━━━━━━━━
🛠️ *பரிந்துரைக்கப்பட்ட உடனடி நடவடிக்கை:*
1. LOTO பாதுகாப்பு விதியுடன் சுவிட்சை ஆஃப் செய்யவும்.
2. தாங்கி கூட்டில் கிரீஸ் (ISO VG 220) நிரப்பவும்.
3. அதிர்வு அளவை 0.40g-க்குள் கொண்டு வரவும்.

📲 *பதிலளிக்கவும்:* 1 ஐ அழுத்தவும் (ஏற்றுக்கொள்ள)`,
    messageHi: `🚨 *फैक्ट्री अलर्ट: FACTORYPULSE AI*
━━━━━━━━━━━━━━━━━━
🏭 *प्लांट:* सूरत टेक्सटाइल मिल्स
⚙️ *मशीन:* WVE-03 - Air Jet Weaving Loom
📍 *विभाग:* Weaving Shed B
⚠️ *गंभीरता:* *CRITICAL* (अत्यधिक कंपन चेतावनी)
━━━━━━━━━━━━━━━━━━
📊 *प्राथमिक ट्रिगर:* कंपन सामान्य से +244.4% अधिक (1.55g vs 0.45g)
🔍 *संभावित खराबी:* बेयरिंग घिसाव और स्पॉलिंग
⏳ *शेष उपयोगी जीवन (RUL):* 14 कार्य घंटे
━━━━━━━━━━━━━━━━━━
🛠️ *तत्काल निवारक कार्रवाई:*
1. LOTO लॉक लगाकर मशीन बंद करें।
2. बेयरिंग में ISO VG 220 सिंथेटिक ग्रीस भरें।
3. ट्रायल रन में कंपन 0.40g से नीचे सत्यापित करें।

📲 *रिप्लाई करें:* 1 (स्वीकार करें)`,
    time: '18:42:15',
    isAcknowledged: false
  },
  {
    id: 2,
    machineId: 'MTR-05',
    machineName: 'Carding Main Drive Motor (25HP)',
    title: 'Stator Surface Thermal Overload (78.0°C)',
    severity: 'Warning',
    phone: '+91 94432 45110 (Electrical Supervisor)',
    messageEn: `⚠️ *WARNING ALERT: FACTORYPULSE AI*
━━━━━━━━━━━━━━━━━━
🏭 *Mill:* Coimbatore Textile Asset #1
⚙️ *Machine:* MTR-05 (Carding Drive Motor)
📍 *Location:* Blowroom Section
⚠️ *Severity:* *WARNING* (Stator Temperature +69.6%)
━━━━━━━━━━━━━━━━━━
📊 *Trigger:* Surface Temp 78°C vs 46°C rated baseline
🔍 *Diagnosis:* Motor Stator Thermal Buildup & Winding Stress
⏳ *Remaining Life (RUL):* 54 Operating Hours
━━━━━━━━━━━━━━━━━━
🛠️ *Prescriptive Action:*
1. Clean cotton lint accumulation from motor cowl.
2. Verify 3-phase current balance (< 2% imbalance).
3. Throttle speed by 10% until temp stabilizes < 55°C.`,
    messageTa: `⚠️ *எச்சரிக்கை: FACTORYPULSE AI*
━━━━━━━━━━━━━━━━━━
🏭 *ஆலை:* கோயம்புத்தூர் டெக்ஸ்டைல் யூனிட்
⚙️ *இயந்திரம்:* MTR-05 (கார்டிங் மோட்டார்)
📍 *இடம்:* Blowroom Section
⚠️ *நிலை:* *WARNING* (மோட்டார் அதிக வெப்பம்)
━━━━━━━━━━━━━━━━━━
📊 *காரணி:* வெப்பநிலை 78°C (இயல்பு: 46°C)
🔍 *காரணம்:* மோட்டார் வைண்டிங் வெப்ப அழுத்தம்
🛠️ *நடவடிக்கை:* கூலிங் ஃபேனில் பஞ்சு தூசிகளை அகற்றவும்.`,
    messageHi: `⚠️ *चेतावनी अलर्ट: FACTORYPULSE AI*
━━━━━━━━━━━━━━━━━━
🏭 *प्लांट:* सूरत टेक्सटाइल मिल्स
⚙️ *मशीन:* MTR-05 (कार्डिंग मोटर)
📍 *विभाग:* Blowroom Section
⚠️ *गंभीरता:* *WARNING* (तापमान वृद्धि 78°C)
━━━━━━━━━━━━━━━━━━
📊 *ट्रिगर:* तापमान 78°C vs 46°C सामान्य
🛠️ *कार्रवाई:* कूलिंग पंखे से रुई साफ करें।`,
    time: '18:35:40',
    isAcknowledged: true,
    acknowledgedBy: 'S. Ramanathan (Chief Tech)',
    acknowledgedAt: '18:38:12'
  }
];

export default function AlertsAndCostEngine({
  fleetState,
  machineFleet,
  selectedMachineId,
  onSelectMachine,
  onNavigateToCoPilot
}: AlertsAndCostEngineProps) {
  const [alerts, setAlerts] = useState<WhatsAppAlert[]>(INITIAL_ALERTS);
  const [alertLang, setAlertLang] = useState<'en' | 'ta' | 'hi'>('en');
  const [activeAlertId, setActiveAlertId] = useState<number>(1);
  const [isDispatching, setIsDispatching] = useState<boolean>(false);
  const [dispatchSuccess, setDispatchSuccess] = useState<boolean>(false);

  // Interactive ROI Calculator State
  const [calcHourlyLoss, setCalcHourlyLoss] = useState<number>(2500);
  const [calcUnplannedHours, setCalcUnplannedHours] = useState<number>(24);
  const [calcPreventiveHours, setCalcPreventiveHours] = useState<number>(2.5);
  const [calcPreventiveCost, setCalcPreventiveCost] = useState<number>(3500);
  const [calcCatastrophicCost, setCalcCatastrophicCost] = useState<number>(52000);

  const selectedAlert = alerts.find(a => a.id === activeAlertId) || alerts[0];
  const activeProfile = machineFleet.find(m => m.id === selectedMachineId) || machineFleet[1];

  // Dynamic ROI calculations
  const roiCalculations = useMemo(() => {
    const catastrophicProductionLoss = calcUnplannedHours * calcHourlyLoss;
    const totalCatastrophic = catastrophicProductionLoss + calcCatastrophicCost;

    const preventiveProductionLoss = calcPreventiveHours * calcHourlyLoss;
    const totalPreventive = preventiveProductionLoss + calcPreventiveCost;

    const netSavings = totalCatastrophic - totalPreventive;
    const roiMultiple = totalPreventive > 0 ? Number((netSavings / totalPreventive).toFixed(2)) : 1.0;
    const hoursSaved = Number((calcUnplannedHours - calcPreventiveHours).toFixed(1));

    return {
      catastrophicProductionLoss,
      totalCatastrophic,
      preventiveProductionLoss,
      totalPreventive,
      netSavings,
      roiMultiple,
      hoursSaved
    };
  }, [calcHourlyLoss, calcUnplannedHours, calcPreventiveHours, calcPreventiveCost, calcCatastrophicCost]);

  // Fleet-wide Economics Summary
  const fleetEconomics = useMemo(() => {
    const rates: Record<string, { loss: number; catCost: number; prevCost: number; unplanH: number; prevH: number }> = {
      'SPN-01': { loss: 3800, catCost: 65000, prevCost: 4200, unplanH: 28, prevH: 3.0 },
      'WVE-03': { loss: 2500, catCost: 52000, prevCost: 3500, unplanH: 24, prevH: 2.5 },
      'KNT-02': { loss: 1800, catCost: 38000, prevCost: 2800, unplanH: 18, prevH: 2.0 },
      'DYE-04': { loss: 4500, catCost: 85000, prevCost: 5500, unplanH: 32, prevH: 4.0 },
      'MTR-05': { loss: 2200, catCost: 42000, prevCost: 3000, unplanH: 20, prevH: 2.0 },
      'CMP-06': { loss: 3200, catCost: 58000, prevCost: 4000, unplanH: 22, prevH: 2.5 }
    };

    let totalSavings = 0;
    let totalDowntimeSaved = 0;
    let totalCatastrophicAvoided = 0;
    let totalPreventiveInvested = 0;

    const rows = machineFleet.map(m => {
      const e = rates[m.id] || rates['WVE-03'];
      const cat = (e.unplanH * e.loss) + e.catCost;
      const prev = (e.prevH * e.loss) + e.prevCost;
      const sav = cat - prev;
      const roi = Number((sav / prev).toFixed(2));
      const hoursSaved = e.unplanH - e.prevH;

      totalSavings += sav;
      totalDowntimeSaved += hoursSaved;
      totalCatastrophicAvoided += cat;
      totalPreventiveInvested += prev;

      return {
        ...m,
        hourlyLoss: e.loss,
        catastrophicCost: cat,
        preventiveCost: prev,
        netSavings: sav,
        roiMultiple: roi,
        hoursSaved
      };
    });

    const compositeRoi = Number((totalSavings / totalPreventiveInvested).toFixed(2));

    return {
      rows,
      totalSavings,
      totalDowntimeSaved,
      totalCatastrophicAvoided,
      totalPreventiveInvested,
      compositeRoi
    };
  }, [machineFleet]);

  const handleAcknowledgeAlert = (alertId: number) => {
    setAlerts(prev => prev.map(a => {
      if (a.id === alertId) {
        return {
          ...a,
          isAcknowledged: true,
          acknowledgedBy: 'S. Ramanathan (Floor Engineer)',
          acknowledgedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
      }
      return a;
    }));
  };

  const handleTriggerSimulatedAlert = () => {
    setIsDispatching(true);
    setTimeout(() => {
      const newId = alerts.length + 1;
      const newAlert: WhatsAppAlert = {
        id: newId,
        machineId: activeProfile.id,
        machineName: activeProfile.name,
        title: `Impending Mechanical Drag Detected on ${activeProfile.id}`,
        severity: 'Critical',
        phone: '+91 98421 78920 (Chief Mill Engineer)',
        messageEn: `🚨 *CRITICAL ALERT: FACTORYPULSE AI*
━━━━━━━━━━━━━━━━━━
🏭 *Mill:* Coimbatore Textile Asset #1
⚙️ *Machine:* ${activeProfile.id} (${activeProfile.name})
📍 *Location:* ${activeProfile.location}
⚠️ *Severity:* *CRITICAL* (Immediate Intervention Advised)
━━━━━━━━━━━━━━━━━━
📊 *Trigger:* Sensor excursion above critical threshold
🔍 *Diagnosis:* Mechanical Drag & Bearing Racine Friction
⏳ *Remaining Life (RUL):* 18 Operating Hours
━━━━━━━━━━━━━━━━━━
🛠️ *Prescriptive Action:*
1. Halt asset during shift break.
2. Inspect housing with acoustic probe.
3. Re-grease with ISO VG 220 synthetic lubricant.

📲 *Reply:* Tap 1 to Acknowledge`,
        messageTa: `🚨 *தொழிற்சாலை அவசர எச்சரிக்கை: FACTORYPULSE AI*
━━━━━━━━━━━━━━━━━━
⚙️ *இயந்திரம்:* ${activeProfile.id} - ${activeProfile.name}
⚠️ *நிலை:* *CRITICAL* (உடனடி நடவடிக்கை தேவை)
📊 *காரணி:* தீவிர அதிர்வு & வெப்பநிலை உயர்வு
🛠️ *நடவடிக்கை:* LOTO முறையில் இயந்திரத்தை நிறுத்தி மசகிடவும்.`,
        messageHi: `🚨 *फैक्ट्री आपातकालीन अलर्ट: FACTORYPULSE AI*
━━━━━━━━━━━━━━━━━━
⚙️ *मशीन:* ${activeProfile.id} - ${activeProfile.name}
⚠️ *गंभीरता:* *CRITICAL* (त्वरित जांच आवश्यक)
🛠️ *कार्रवाई:* मशीन को बंद करके बेयरिंग में ग्रीस भरें।`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isAcknowledged: false
      };

      setAlerts(prev => [newAlert, ...prev]);
      setActiveAlertId(newId);
      setIsDispatching(false);
      setDispatchSuccess(true);
      setTimeout(() => setDispatchSuccess(false), 3500);
    }, 800);
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Fleet Financial KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Net Financial Savings */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-950/80 via-slate-900 to-slate-900 border border-emerald-800/60 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between text-xs font-mono uppercase tracking-wider text-slate-400">
            <span>Net Financial Savings</span>
            <span className="p-1 rounded-lg bg-emerald-500/20 text-emerald-400">
              <DollarSign className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 text-3xl font-extrabold text-white font-mono tracking-tight">
            ₹{(fleetEconomics.totalSavings / 100000).toFixed(2)} <span className="text-sm font-normal text-emerald-300">Lakhs</span>
          </div>
          <div className="mt-1 text-xs text-emerald-400 flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>₹{fleetEconomics.totalSavings.toLocaleString('en-IN')} INR Total Value</span>
          </div>
        </div>

        {/* KPI 2: Downtime Hours Saved */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-cyan-950/80 via-slate-900 to-slate-900 border border-cyan-800/60 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between text-xs font-mono uppercase tracking-wider text-slate-400">
            <span>Downtime Prevented</span>
            <span className="p-1 rounded-lg bg-cyan-500/20 text-cyan-400">
              <Clock className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 text-3xl font-extrabold text-white font-mono tracking-tight">
            {fleetEconomics.totalDowntimeSaved} <span className="text-sm font-normal text-cyan-300">Hours</span>
          </div>
          <div className="mt-1 text-xs text-cyan-400 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Across all 6 production machinery assets</span>
          </div>
        </div>

        {/* KPI 3: Catastrophic Loss Avoidance */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-950/80 via-slate-900 to-slate-900 border border-indigo-800/60 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between text-xs font-mono uppercase tracking-wider text-slate-400">
            <span>Catastrophic Avoidance</span>
            <span className="p-1 rounded-lg bg-indigo-500/20 text-indigo-400">
              <ShieldCheck className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 text-3xl font-extrabold text-white font-mono tracking-tight">
            ₹{(fleetEconomics.totalCatastrophicAvoided / 100000).toFixed(2)} <span className="text-sm font-normal text-indigo-300">Lakhs</span>
          </div>
          <div className="mt-1 text-xs text-indigo-300 flex items-center gap-1">
            <span>Emergency overhauls &amp; rewinds prevented</span>
          </div>
        </div>

        {/* KPI 4: Fleet Composite ROI Multiple */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-amber-950/80 via-slate-900 to-slate-900 border border-amber-800/60 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between text-xs font-mono uppercase tracking-wider text-slate-400">
            <span>Composite ROI Multiple</span>
            <span className="p-1 rounded-lg bg-amber-500/20 text-amber-400">
              <TrendingUp className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 text-3xl font-extrabold text-white font-mono tracking-tight">
            {fleetEconomics.compositeRoi} <span className="text-sm font-normal text-amber-300">x Multiple</span>
          </div>
          <div className="mt-1 text-xs text-amber-400 flex items-center gap-1">
            <span>₹{fleetEconomics.compositeRoi} returned per ₹1 invested</span>
          </div>
        </div>
      </div>

      {/* Main Grid: WhatsApp Alert Simulator (Left 6) + ROI Financial Cockpit (Right 6) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 6 Columns: WhatsApp Notification Smartphone Simulator */}
        <div className="lg:col-span-6 p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <MessageCircle className="w-4 h-4 text-emerald-400" />
                  Automated Smart WhatsApp Alert Simulator
                </h3>
                <p className="text-xs text-slate-400">
                  Real-time push alert simulator directly linked to SQLite Table 6 (<code>alerts</code>).
                </p>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setAlertLang('en')}
                  className={`px-2 py-0.5 rounded text-[10px] font-semibold transition ${
                    alertLang === 'en' ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  EN
                </button>
                <button
                  onClick={() => setAlertLang('ta')}
                  className={`px-2 py-0.5 rounded text-[10px] font-semibold transition ${
                    alertLang === 'ta' ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  தமிழ்
                </button>
                <button
                  onClick={() => setAlertLang('hi')}
                  className={`px-2 py-0.5 rounded text-[10px] font-semibold transition ${
                    alertLang === 'hi' ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  हिन्दी
                </button>
              </div>
            </div>

            {/* Smartphone UI Mockup */}
            <div className="mt-4 rounded-2xl bg-[#0b141a] border-4 border-slate-800 shadow-2xl overflow-hidden font-sans">
              {/* WhatsApp App Header */}
              <div className="bg-[#1f2c34] px-4 py-3 flex items-center justify-between text-white border-b border-[#2a3942]">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center font-bold text-xs shadow">
                    FP
                  </div>
                  <div>
                    <div className="text-xs font-bold leading-tight flex items-center gap-1.5">
                      <span>FactoryPulse AI Co-Pilot</span>
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                    </div>
                    <div className="text-[10px] text-emerald-400 font-mono">online • official enterprise bot</div>
                  </div>
                </div>

                <div className="text-[10px] text-slate-400 font-mono">
                  {selectedAlert.phone}
                </div>
              </div>

              {/* Chat Message Canvas */}
              <div className="p-4 space-y-3 bg-[#0c1317] min-h-[300px] flex flex-col justify-end">
                <div className="p-3.5 rounded-2xl bg-[#005c4b] text-white text-xs leading-relaxed max-w-[95%] shadow-md rounded-tl-none font-mono">
                  <pre className="whitespace-pre-wrap font-sans text-xs">
                    {alertLang === 'ta'
                      ? selectedAlert.messageTa
                      : alertLang === 'hi'
                      ? selectedAlert.messageHi
                      : selectedAlert.messageEn}
                  </pre>
                  <div className="mt-2 flex items-center justify-end gap-1 text-[10px] text-emerald-200/70 font-mono">
                    <span>{selectedAlert.time}</span>
                    <span className="text-cyan-300 font-bold">✓✓</span>
                  </div>
                </div>

                {/* Acknowledgment Action Panel */}
                <div className="p-3 rounded-xl bg-[#1f2c34] border border-[#2a3942] flex items-center justify-between text-xs">
                  <div>
                    <div className="text-[10px] text-slate-400 uppercase font-mono">Dispatch Status</div>
                    <div className="font-semibold text-slate-200 mt-0.5">
                      {selectedAlert.isAcknowledged ? (
                        <span className="text-emerald-400 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Acknowledged by {selectedAlert.acknowledgedBy}
                        </span>
                      ) : (
                        <span className="text-amber-400 flex items-center gap-1">
                          <AlertTriangle className="w-3.5 h-3.5" /> Awaiting Floor Acknowledgment
                        </span>
                      )}
                    </div>
                  </div>

                  {!selectedAlert.isAcknowledged && (
                    <button
                      onClick={() => handleAcknowledgeAlert(selectedAlert.id)}
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1 transition shadow"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Acknowledge Alert</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Trigger Test Alert Button */}
          <div className="flex items-center justify-between gap-3 pt-2 border-t border-slate-800">
            <button
              onClick={handleTriggerSimulatedAlert}
              disabled={isDispatching}
              className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-600 disabled:opacity-50 text-white text-xs font-semibold flex items-center gap-2 transition shadow-lg shadow-emerald-950"
            >
              <Send className={`w-3.5 h-3.5 ${isDispatching ? 'animate-spin' : ''}`} />
              <span>{isDispatching ? 'Dispatching WhatsApp API...' : 'Dispatch Automated Alert'}</span>
            </button>

            {dispatchSuccess && (
              <span className="text-xs font-mono text-emerald-400 flex items-center gap-1 animate-fadeIn">
                <CheckCircle2 className="w-3.5 h-3.5" /> Dispatched &amp; Persisted to Table 6!
              </span>
            )}

            {onNavigateToCoPilot && (
              <button
                onClick={onNavigateToCoPilot}
                className="text-xs text-indigo-400 hover:underline flex items-center gap-1"
              >
                <span>Voice Co-Pilot</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Right 6 Columns: Financial ROI Savings Engine & Interactive Calculator */}
        <div className="lg:col-span-6 p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl flex flex-col justify-between space-y-5">
          <div>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-cyan-400" />
                  Financial ROI &amp; Downtime Cost Engine
                </h3>
                <p className="text-xs text-slate-400">
                  Target Asset: <span className="font-semibold text-cyan-300">{activeProfile.name} ({activeProfile.id})</span>
                </p>
              </div>
              <span className="px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800 text-[10px] font-mono">
                SQLite Table 7
              </span>
            </div>

            {/* Side-by-Side Financial Comparison */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
              {/* Path A: Catastrophic Breakdown */}
              <div className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-900/60 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-rose-300">Catastrophic Breakdown</span>
                  <span className="text-[10px] font-mono text-rose-400 bg-rose-950 px-1.5 py-0.2 rounded border border-rose-800">
                    Unplanned Stoppage
                  </span>
                </div>
                <div className="text-2xl font-extrabold text-white font-mono">
                  ₹{roiCalculations.totalCatastrophic.toLocaleString('en-IN')}
                </div>
                <div className="space-y-1 text-[11px] font-mono text-slate-400">
                  <div>• Production Loss ({calcUnplannedHours}h): ₹{roiCalculations.catastrophicProductionLoss.toLocaleString('en-IN')}</div>
                  <div>• Emergency Parts &amp; Overhaul: ₹{calcCatastrophicCost.toLocaleString('en-IN')}</div>
                </div>
              </div>

              {/* Path B: Preventive AI Intervention */}
              <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-900/60 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-emerald-300">FactoryPulse AI Intervention</span>
                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950 px-1.5 py-0.2 rounded border border-emerald-800">
                    Scheduled Shift Stop
                  </span>
                </div>
                <div className="text-2xl font-extrabold text-emerald-300 font-mono">
                  ₹{roiCalculations.totalPreventive.toLocaleString('en-IN')}
                </div>
                <div className="space-y-1 text-[11px] font-mono text-slate-400">
                  <div>• Planned Shift Pause ({calcPreventiveHours}h): ₹{roiCalculations.preventiveProductionLoss.toLocaleString('en-IN')}</div>
                  <div>• Proactive Part &amp; Grease: ₹{calcPreventiveCost.toLocaleString('en-IN')}</div>
                </div>
              </div>
            </div>

            {/* Net Financial Delta Highlight Banner */}
            <div className="mt-3 p-4 rounded-xl bg-gradient-to-r from-emerald-950/90 via-cyan-950/70 to-slate-900 border border-emerald-700/80 flex items-center justify-between">
              <div>
                <div className="text-[10px] font-mono uppercase text-emerald-400 font-bold">
                  Net Financial Savings Per Incident
                </div>
                <div className="text-2xl font-black text-white font-mono mt-0.5">
                  ₹{roiCalculations.netSavings.toLocaleString('en-IN')} <span className="text-xs text-emerald-300 font-normal">INR Saved</span>
                </div>
                <div className="text-xs text-slate-300 mt-0.5">
                  Avoids <span className="text-cyan-300 font-bold">{roiCalculations.hoursSaved} operational hours</span> of mill loom stoppage.
                </div>
              </div>

              <div className="text-right">
                <div className="text-3xl font-extrabold text-cyan-300 font-mono">
                  {roiCalculations.roiMultiple}x
                </div>
                <div className="text-[10px] font-mono text-slate-400">ROI Multiple</div>
              </div>
            </div>

            {/* Interactive What-If ROI Controls */}
            <div className="mt-4 p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3 text-xs">
              <div className="font-bold text-slate-200 flex items-center gap-1.5 text-xs">
                <Sliders className="w-3.5 h-3.5 text-cyan-400" />
                <span>Interactive What-If Financial Modeler</span>
              </div>

              {/* Slider 1: Production Loss Rate */}
              <div className="space-y-1">
                <div className="flex justify-between text-[11px] font-mono">
                  <span className="text-slate-400">Loom Output Value Rate:</span>
                  <span className="text-cyan-300 font-bold">₹{calcHourlyLoss.toLocaleString('en-IN')}/hr</span>
                </div>
                <input
                  type="range"
                  min="1000"
                  max="10000"
                  step="250"
                  value={calcHourlyLoss}
                  onChange={(e) => setCalcHourlyLoss(parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                />
              </div>

              {/* Slider 2: Unplanned Stoppage Hours */}
              <div className="space-y-1">
                <div className="flex justify-between text-[11px] font-mono">
                  <span className="text-slate-400">Unplanned Downtime Duration:</span>
                  <span className="text-rose-400 font-bold">{calcUnplannedHours} Hours</span>
                </div>
                <input
                  type="range"
                  min="8"
                  max="72"
                  step="2"
                  value={calcUnplannedHours}
                  onChange={(e) => setCalcUnplannedHours(parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-rose-500"
                />
              </div>

              {/* Slider 3: Catastrophic Overhaul Cost */}
              <div className="space-y-1">
                <div className="flex justify-between text-[11px] font-mono">
                  <span className="text-slate-400">Emergency Repair &amp; Spindle Cost:</span>
                  <span className="text-amber-400 font-bold">₹{calcCatastrophicCost.toLocaleString('en-IN')}</span>
                </div>
                <input
                  type="range"
                  min="15000"
                  max="150000"
                  step="5000"
                  value={calcCatastrophicCost}
                  onChange={(e) => setCalcCatastrophicCost(parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                />
              </div>
            </div>
          </div>

          <div className="text-[11px] font-mono text-slate-500 pt-1 border-t border-slate-800 flex justify-between">
            <span>Model Version: ROI-MSME-v2.1</span>
            <span>Based on Southern India Mills Association (SIMA) Benchmarks</span>
          </div>
        </div>
      </div>

      {/* Fleet-Wide Financial Cost Analysis Matrix Table */}
      <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Table className="w-4 h-4 text-emerald-400" />
              Textile Plant Fleet Financial ROI &amp; Savings Matrix
            </h3>
            <p className="text-xs text-slate-400">
              Machine-by-machine downtime loss avoidance and net financial return across all 6 plant assets.
            </p>
          </div>
          <span className="text-xs font-mono text-slate-400">
            Target SQLite: <code>cost_analysis</code>
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-950/80 text-slate-400 font-mono uppercase text-[10px] border-b border-slate-800">
              <tr>
                <th className="p-3">Asset</th>
                <th className="p-3">Section</th>
                <th className="p-3">Hourly Output Rate</th>
                <th className="p-3">Catastrophic Loss</th>
                <th className="p-3">Proactive Cost</th>
                <th className="p-3">Net Savings (INR)</th>
                <th className="p-3">ROI Multiple</th>
                <th className="p-3">Downtime Saved</th>
                <th className="p-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {fleetEconomics.rows.map((row) => (
                <tr key={row.id} className="hover:bg-slate-800/30 transition">
                  <td className="p-3 font-semibold text-slate-200">
                    <div className="flex items-center gap-2">
                      <span>{row.icon}</span>
                      <span className="font-mono text-cyan-400 font-bold">{row.id}</span>
                      <span className="text-slate-300 font-normal">({row.type})</span>
                    </div>
                  </td>
                  <td className="p-3 text-slate-400">{row.location}</td>
                  <td className="p-3 font-mono font-semibold text-slate-300">₹{row.hourlyLoss.toLocaleString('en-IN')}/hr</td>
                  <td className="p-3 font-mono text-rose-400">₹{row.catastrophicCost.toLocaleString('en-IN')}</td>
                  <td className="p-3 font-mono text-cyan-300">₹{row.preventiveCost.toLocaleString('en-IN')}</td>
                  <td className="p-3 font-mono font-bold text-emerald-400">
                    ₹{row.netSavings.toLocaleString('en-IN')}
                  </td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 rounded font-mono font-bold text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-800">
                      {row.roiMultiple}x ROI
                    </span>
                  </td>
                  <td className="p-3 font-mono text-slate-300">{row.hoursSaved} hrs</td>
                  <td className="p-3 text-right">
                    <button
                      onClick={() => {
                        onSelectMachine(row.id);
                        setCalcHourlyLoss(row.hourlyLoss);
                      }}
                      className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-semibold border border-slate-700 transition"
                    >
                      Model Asset
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
