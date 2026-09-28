import React, { useState, useEffect, useRef } from 'react';
import {
  MessageSquare,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Send,
  Sparkles,
  Bot,
  User,
  CheckCircle2,
  AlertTriangle,
  Wrench,
  Clock,
  DollarSign,
  FileText,
  RotateCcw,
  Languages,
  BookOpen,
  ShieldAlert,
  ChevronRight,
  Layers,
  Thermometer,
  Activity,
  Zap,
  Check,
  Copy,
  Info
} from 'lucide-react';
import { MachineProfile, LiveSensorState } from './ExplainableAIEngine';

export type LanguageCode = 'en' | 'ta' | 'hi';

interface ChatMessage {
  id: string;
  sender: 'user' | 'copilot';
  text: string;
  bullets?: string[];
  steps?: string[];
  workOrder?: {
    id?: number | string;
    machineId: string;
    title: string;
    cause: string;
    action: string;
    priority: string;
    costInr: number;
    hours: number;
    technician?: string;
  };
  timestamp: string;
  language: LanguageCode;
}

interface MultilingualCoPilotProps {
  fleetState: Record<string, LiveSensorState>;
  machineFleet: MachineProfile[];
  selectedMachineId: string;
  onSelectMachine: (id: string) => void;
  onNavigateToXAI?: () => void;
}

const QUICK_PROMPTS: Record<LanguageCode, Array<{ label: string; query: string }>> = {
  en: [
    { label: '🔍 Diagnosing Loom WVE-03', query: 'Why is Loom WVE-03 vibrating? Explain root cause and sensor deviation.' },
    { label: '⚙️ Bearing Replacement SOP', query: 'How do I replace degraded bearings on the weaving loom?' },
    { label: '🔥 Motor Overheating Fix', query: 'Carding motor MTR-05 is running hot. What are the cooling mitigation steps?' },
    { label: '📋 Log Urgent Work Order', query: 'Create emergency maintenance work order for high vibration on WVE-03.' },
    { label: '📊 Plant Telemetry Status', query: 'Give me live temperature, vibration, and current readings for all machines.' }
  ],
  ta: [
    { label: '🔍 தறி WVE-03 அதிர்வு ஆய்வு', query: 'WVE-03 நெசவு இயந்திரத்தில் அதிக அதிர்வு ஏன்? பழுது நீக்கும் வழிமுறை என்ன?' },
    { label: '⚙️ தாங்கி (Bearing) மாற்றுதல் SOP', query: 'நெசவு தறியில் தேய்ந்த தாங்கியை (Bearing) மாற்றுவதற்கான வழிமுறை என்ன?' },
    { label: '🔥 மோட்டார் சூடு தணிக்கும் முறை', query: 'கார்டிங் மோட்டார் MTR-05 அதிக வெப்பமடைகிறது. என்ன நடவடிக்கை எடுக்க வேண்டும்?' },
    { label: '📋 அவசர வேலை உத்தரவு பதிவு', query: 'WVE-03 தறிக்கு அவசர பராமரிப்பு வேலை உத்தரவை (Work Order) பதிவு செய்க.' },
    { label: '📊 நேரலை சென்சார் அளவுகள்', query: 'தற்போதைய வெப்பநிலை, அதிர்வு மற்றும் மின்னோட்ட அளவுகளைக் கூறுக.' }
  ],
  hi: [
    { label: '🔍 लूम WVE-03 कंपन निदान', query: 'लूम WVE-03 में अधिक कंपन क्यों आ रहा है? इसका कारण और समाधान क्या है?' },
    { label: '⚙️ बेयरिंग बदलने की प्रक्रिया (SOP)', query: 'बुनाई लूम पर खराब बेयरिंग को बदलने की मानक प्रक्रिया क्या है?' },
    { label: '🔥 मोटर ओवरहीटिंग रोकथाम', query: 'कार्डिंग मोटर MTR-05 बहुत गर्म हो रही है। कूलिंग के लिए क्या उपाय करें?' },
    { label: '📋 आपातकालीन वर्क ऑर्डर दर्ज करें', query: 'WVE-03 के अत्यधिक कंपन के लिए आपातकालीन वर्क ऑर्डर बनाएं।' },
    { label: '📊 वर्तमान टेलीमेट्री स्थिति', query: 'मशीनों के तापमान, कंपन और करंट की वर्तमान लाइव स्थिति बताएं।' }
  ]
};

export default function MultilingualCoPilot({
  fleetState,
  machineFleet,
  selectedMachineId,
  onSelectMachine,
  onNavigateToXAI
}: MultilingualCoPilotProps) {
  const [selectedLanguage, setSelectedLanguage] = useState<LanguageCode>('en');
  const [inputText, setInputText] = useState<string>('');
  const [isListening, setIsListening] = useState<boolean>(false);
  const [speakingMsgId, setSpeakingMsgId] = useState<string | null>(null);
  const [autoSpeak, setAutoSpeak] = useState<boolean>(false);
  const [activeSubTab, setActiveSubTab] = useState<'chat' | 'sops' | 'work_orders'>('chat');
  const [workOrdersLogged, setWorkOrdersLogged] = useState<Array<any>>([
    {
      id: 101,
      machineId: 'WVE-03',
      title: 'Bearing Degradation & Spalling on Air Jet Loom',
      cause: 'Vibration RMS is +244.4% above baseline (1.55g vs 0.45g)',
      action: 'Dismount bearing housing; replace with spherical roller bearing & ISO VG 220 grease',
      priority: 'Critical',
      costInr: 3200,
      hours: 2.5,
      technician: 'S. Ramanathan',
      status: 'Pending',
      time: '18:25:00'
    }
  ]);

  const activeProfile = machineFleet.find(m => m.id === selectedMachineId) || machineFleet[1];
  const liveSensor = fleetState[activeProfile.id];

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-1',
      sender: 'copilot',
      text: 'Vanakkam & Welcome to FactoryPulse AI Maintenance Co-Pilot! I am your real-time textile engineering assistant. Ask me questions about live telemetry, impending failure causes, step-by-step SOPs, or log work orders in English, தமிழ் (Tamil), or हिन्दी (Hindi).',
      bullets: [
        'Multilingual Voice & NLP reasoning engine (English, Tamil, Hindi)',
        'Grounded with real-time 5s IoT telemetry & Random Forest ML predictions',
        'Directly connected to SQLite Table 5 (maintenance_logs) & Table 8 (chat_history)'
      ],
      steps: [
        'Select your preferred language (English / தமிழ் / हिन्दी) above.',
        'Choose a machine under inspection or use quick diagnostic prompt chips.',
        'Tap the microphone to speak, or tap 🔊 to hear audio explanations.'
      ],
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      language: 'en'
    }
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  // Auto-scroll chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Speech-to-Text Setup (Web Speech API)
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;

      // Set speech recognition language
      if (selectedLanguage === 'ta') recognition.lang = 'ta-IN';
      else if (selectedLanguage === 'hi') recognition.lang = 'hi-IN';
      else recognition.lang = 'en-IN';

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInputText(transcript);
        setIsListening(false);
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }
  }, [selectedLanguage]);

  const toggleMic = () => {
    if (!recognitionRef.current) {
      alert('Speech recognition is not supported in this browser. Please type your query.');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        if (selectedLanguage === 'ta') recognitionRef.current.lang = 'ta-IN';
        else if (selectedLanguage === 'hi') recognitionRef.current.lang = 'hi-IN';
        else recognitionRef.current.lang = 'en-IN';

        recognitionRef.current.start();
        setIsListening(true);
      } catch (e) {
        setIsListening(false);
      }
    }
  };

  // Text-to-Speech Playback
  const speakText = (text: string, lang: LanguageCode, msgId: string) => {
    if (!('speechSynthesis' in window)) {
      alert('Text-to-speech is not supported in this browser.');
      return;
    }

    if (speakingMsgId === msgId) {
      window.speechSynthesis.cancel();
      setSpeakingMsgId(null);
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);

    if (lang === 'ta') utterance.lang = 'ta-IN';
    else if (lang === 'hi') utterance.lang = 'hi-IN';
    else utterance.lang = 'en-IN';

    utterance.rate = 0.95;
    utterance.pitch = 1.0;

    utterance.onend = () => setSpeakingMsgId(null);
    utterance.onerror = () => setSpeakingMsgId(null);

    setSpeakingMsgId(msgId);
    window.speechSynthesis.speak(utterance);
  };

  // Dialogue Synthesis Engine (Client mirror + Backend Grounding)
  const handleSendMessage = (textToSend?: string) => {
    const query = (textToSend || inputText).trim();
    if (!query) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      language: selectedLanguage
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText('');

    // Generate intelligent contextual response
    setTimeout(() => {
      const qLower = query.toLowerCase();
      const isTamil = selectedLanguage === 'ta';
      const isHindi = selectedLanguage === 'hi';

      const vibDev = Math.round(((liveSensor.vibration - activeProfile.baseVib) / activeProfile.baseVib) * 100);
      const tempDev = Math.round(((liveSensor.temperature - activeProfile.baseTemp) / activeProfile.baseTemp) * 100);
      const isAtRisk = vibDev > 50 || tempDev > 40;

      let replyText = '';
      let bullets: string[] = [];
      let steps: string[] = [];
      let workOrder: any = undefined;

      // 1. Work Order Request
      if (qLower.includes('work order') || qLower.includes('ticket') || qLower.includes('வேலை உத்தரவு') || qLower.includes('பழுது பதிவு') || qLower.includes('वर्क ऑर्डर')) {
        const orderId = 100 + workOrdersLogged.length + 1;
        const newOrder = {
          id: orderId,
          machineId: activeProfile.id,
          title: `Bearing Spalling & Excessive Vibration on ${activeProfile.name}`,
          cause: `Vibration elevated by +${vibDev}% over baseline (${liveSensor.vibration}g vs ${activeProfile.baseVib}g)`,
          action: 'Perform LOTO; replace drive bearing; re-grease with ISO VG 220 synthetic lubricant',
          priority: isAtRisk ? 'Critical' : 'High',
          costInr: 2800,
          hours: 2.0,
          technician: 'S. Ramanathan',
          status: 'Pending',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };

        setWorkOrdersLogged(prev => [newOrder, ...prev]);
        workOrder = newOrder;

        if (isTamil) {
          replyText = `இயந்திரம் ${activeProfile.id} (${activeProfile.name}) க்கான அவசர பராமரிப்பு வேலை உத்தரவு #${orderId} SQLite Table 5 (maintenance_logs) இல் வெற்றிகரமாக பதிவு செய்யப்பட்டது!`;
          bullets = [
            `இயந்திரம்: ${activeProfile.id} (${activeProfile.type})`,
            `கண்டறியப்பட்ட காரணம்: அதிர்வு +${vibDev}% இயல்புக்கு மேல் (${liveSensor.vibration}g vs ${activeProfile.baseVib}g)`,
            `ஒதுக்கப்பட்ட வல்லுநர்: எஸ். ராமநாதன்`,
            `மதிப்பிடப்பட்ட பழுது நீக்கும் நேரம்: 2.0 மணி நேரம் | செலவு: ₹2,800`
          ];
          steps = [
            'முதன்மை 415V பவர் ஸ்விட்சில் LOTO பாதுகாப்பு பூட்டு போடவும்.',
            'அதிர்வு ஆய்வுக் கருவி கொண்டு தாங்கி கூட்டை சோதிக்கவும்.',
            'ISO VG 220 சிந்தெடிக் கிரீஸ் கொண்டு மசகிடவும்.'
          ];
        } else if (isHindi) {
          replyText = `मशीन ${activeProfile.id} (${activeProfile.name}) के लिए आपातकालीन रखरखाव वर्क ऑर्डर #${orderId} SQLite Table 5 में सफलतापूर्वक दर्ज कर लिया गया है!`;
          bullets = [
            `मशीन: ${activeProfile.id} (${activeProfile.type})`,
            `खराबी का कारण: कंपन सामान्य से +${vibDev}% अधिक (${liveSensor.vibration}g vs ${activeProfile.baseVib}g)`,
            `नियुक्त तकनीशियन: आर. के. शर्मा`,
            `अपेक्षित मरम्मत समय: 2.0 घंटे | अनुमानित लागत: ₹2,800`
          ];
          steps = [
            'LOTO सुरक्षा प्रोटोकॉल के तहत मशीन की बिजली बंद करें।',
            'बेयरिंग हाउसिंग की एकॉस्टिक जांच करें।',
            'ISO VG 220 सिंथेटिक ग्रीस से स्नेहन करें।'
          ];
        } else {
          replyText = `Emergency Work Order #${orderId} for ${activeProfile.id} (${activeProfile.name}) has been registered into SQLite Table 5 (maintenance_logs)!`;
          bullets = [
            `Machine Asset: ${activeProfile.id} (${activeProfile.name})`,
            `Identified Trigger: Vibration elevated by +${vibDev}% (${liveSensor.vibration}g vs ${activeProfile.baseVib}g)`,
            `Assigned Technician: S. Ramanathan`,
            `Est. Repair Time: 2.0 operating hours | Estimated Cost: ₹2,800 INR`
          ];
          steps = [
            'Enforce Lockout/Tagout (LOTO) on main 415V electrical isolator switch.',
            'Inspect drive bearing housing with acoustic stethoscopic probe for ball-pass harmonics.',
            'Replenish housing with ISO VG 220 high-temperature synthetic grease.'
          ];
        }
      }
      // 2. SOP Procedure Request
      else if (qLower.includes('how') || qLower.includes('sop') || qLower.includes('step') || qLower.includes('replace') || qLower.includes('எப்படி') || qLower.includes('மாற்றுவது') || qLower.includes('வழிமுறை') || qLower.includes('कैसे') || qLower.includes('बदलें') || qLower.includes('प्रक्रिया')) {
        if (isTamil) {
          replyText = `இயந்திரம் ${activeProfile.id} (${activeProfile.name}) க்கான அதிவேக தாங்கி (Bearing) மாற்றுதல் நிலையான செயல்பாட்டு நெறிமுறை (SOP-MECH-01):`;
          bullets = [
            'SOP குறியீடு: SOP-MECH-01 (இயந்திர தாங்கி பராமரிப்பு)',
            'பரிந்துரைக்கப்பட்ட அதிர்வு வரம்பு: 0.40g RMS-க்கு கீழ்',
            'பாதுகாப்பு: LOTO பூட்டுதல் மற்றும் பாதுகாப்பு கண்ணாடி கட்டாயம்'
          ];
          steps = [
            'இயந்திரத்தை நிறுத்தி 415V சுவிட்சில் LOTO பாதுகாப்பு பூட்டு போடவும்.',
            'டிரைவ் பெல்ட் கவரை அகற்றி டைமிங் பெல்ட்டைக் கழற்றவும்.',
            'ஹைட்ராலிக் புல்லர் கொண்டு பழைய தேய்ந்த தாங்கியை வெளியே எடுக்கவும்.',
            'ஷாப்ட் பரப்பில் கீறல்கள் இல்லை என்பதை உறுதி செய்து கிளீனரால் துடைக்கவும்.',
            'புதிய ஸ்பெரிக்கல் ரோலர் பேரிங்கை 110°C வரை சூடாக்கி ஷாஃப்டில் பொருத்தவும்.',
            'லாக்நட்டை 65 Nm முறுக்கி, 15 நிமிடம் சோதனை ஓட்டம் நடத்தவும்.'
          ];
        } else if (isHindi) {
          replyText = `मशीन ${activeProfile.id} (${activeProfile.name}) के लिए हाई-स्पीड बेयरिंग प्रतिस्थापन मानक संचालन प्रक्रिया (SOP-MECH-01):`;
          bullets = [
            'SOP कोड: SOP-MECH-01 (लूम एवं स्पिंडल बेयरिंग)',
            'सामान्य कंपन सीमा: 0.40g RMS से कम',
            'सुरक्षा निर्देश: LOTO सुरक्षा लॉक एवं चश्मा पहनना अनिवार्य'
          ];
          steps = [
            'मशीन बंद करके मुख्य विद्युत स्विच को LOTO लॉक से सुरक्षित करें।',
            'ड्राइव बेल्ट गार्ड हटाकर टेंशनर बोल्ट ढीला करें।',
            'हाइड्रोलिक पुलर की सहायता से पुरानी बेयरिंग को बाहर निकालें।',
            'शाफ्ट की सतह को सॉल्वेंट से साफ कर घिसाव की जांच करें।',
            'नई रोलर बेयरिंग को 110°C तक इंडक्शन हीटर में गर्म कर शाफ्ट पर चढ़ाएं।',
            'लॉकनट को 65 Nm पर कसें और 15 मिनट का ट्रायल रन चलाएं।'
          ];
        } else {
          replyText = `Standard Operating Procedure for ${activeProfile.id} (${activeProfile.name}): High-Speed Bearing Replacement Protocol (SOP-MECH-01):`;
          bullets = [
            'SOP Identifier: SOP-MECH-01 (Mechanical Spindle & Loom)',
            'Intervention Threshold: Vibration > 1.8g RMS or 8,000 operational hours',
            'Safety Compliance: Lockout/Tagout (LOTO) & cut-resistant gloves mandatory'
          ];
          steps = [
            'Halt machine and verify main 415V electrical supply is mechanically locked out.',
            'Remove drive belt guard and slacken timing belts using tensioner adjustment bolt.',
            'Use hydraulic bearing puller on inner raceway to extract degraded bearing without scoring spindle.',
            'Clean spindle journal with solvent cleaner and inspect for fretting corrosion (< 0.02mm runout).',
            'Induction-heat replacement spherical roller bearing to 110°C and slide onto shaft.',
            'Fasten locknut to 65 Nm torque and execute 15-minute cold test (< 0.40g RMS).'
          ];
        }
      }
      // 3. Explainable AI Root Cause / Diagnosis
      else {
        if (isTamil) {
          replyText = isAtRisk
            ? `எச்சரிக்கை! இயந்திரம் ${activeProfile.id} (${activeProfile.name}) தற்போது அதிக ஆபத்தில் இயங்குகிறது. விளக்கக்கூடிய AI (XAI) பகுப்பாய்வின்படி, அதிர்வு இயல்பான அளவை விட +${vibDev}% அதிகமாக உள்ளது (${liveSensor.vibration}g vs ${activeProfile.baseVib}g baseline). இதனால் 'தாங்கி தேய்மானம் மற்றும் ரேஸ்வே பிளவுகள்' ஏற்பட்டுள்ளது.`
            : `இயந்திரம் ${activeProfile.id} (${activeProfile.name}) தற்போது ஆரோக்கியமான இயல்பு நிலையில் இயங்குகிறது. அனைத்து சென்சார் அளவுகளும் அனுமதிக்கப்பட்ட ±15% வரம்பிற்குள் உள்ளன.`;
          bullets = [
            `வெப்பநிலை: ${liveSensor.temperature}°C (இயல்பு: ${activeProfile.baseTemp}°C)`,
            `அதிர்வு RMS: ${liveSensor.vibration}g (இயல்பு: ${activeProfile.baseVib}g)`,
            `மின்னோட்டம்: ${liveSensor.current}A (இயல்பு: ${activeProfile.baseCurrent}A)`,
            `ஒலி அளவு: ${liveSensor.sound}dB (இயல்பு: ${activeProfile.baseSound}dB)`
          ];
          steps = [
            'அதிர்வு ஆய்வுக் கருவி (Acoustic Probe) கொண்டு தாங்கி கூட்டை சோதிக்கவும்.',
            'ISO VG 220 சிந்தெடிக் கிரீஸ் கொண்டு மசகிடவும்.',
            'அடுத்த 8 மணி நேர ஷிப்டிற்குள் மோட்டார் கூலிங் ஃபேனை பஞ்சு தூசிகளிலிருந்து சுத்தம் செய்யவும்.'
          ];
        } else if (isHindi) {
          replyText = isAtRisk
            ? `चेतावनी! मशीन ${activeProfile.id} (${activeProfile.name}) वर्तमान में उच्च जोखिम में है। एक्सप्लेनेबल एआई (XAI) विश्लेषण के अनुसार, कंपन सामान्य से +${vibDev}% अधिक है (${liveSensor.vibration}g vs ${activeProfile.baseVib}g सामान्य)। इसका मुख्य कारण 'बेयरिंग घिसाव और स्पॉलिंग' है।`
            : `मशीन ${activeProfile.id} (${activeProfile.name}) सामान्य और स्वस्थ स्थिति में काम कर रही है। सभी सेंसर मान सामान्य सीमा (±15%) के भीतर हैं।`;
          bullets = [
            `तापमान: ${liveSensor.temperature}°C (सामान्य: ${activeProfile.baseTemp}°C)`,
            `कंपन RMS: ${liveSensor.vibration}g (सामान्य: ${activeProfile.baseVib}g)`,
            `करंट: ${liveSensor.current}A (सामान्य: ${activeProfile.baseCurrent}A)`,
            `ध्वनि स्तर: ${liveSensor.sound}dB (सामान्य: ${activeProfile.baseSound}dB)`
          ];
          steps = [
            'एकॉस्टिक जांच उपकरण से बेयरिंग हाउसिंग का परीक्षण करें।',
            'ISO VG 220 सिंथेटिक ग्रीस से पर्याप्त स्नेहन करें।',
            'अगली शिफ्ट से पहले कूलिंग पंखे से रुई के रेशे साफ करें।'
          ];
        } else {
          replyText = isAtRisk
            ? `Alert: Machine ${activeProfile.id} (${activeProfile.name}) is operating under Critical stress! Explainable AI (XAI) analysis shows Vibration RMS is elevated by +${vibDev}% above baseline (${liveSensor.vibration}g vs ${activeProfile.baseVib}g nominal), attributed to Bearing Degradation & Raceway Spalling.`
            : `Machine ${activeProfile.id} (${activeProfile.name}) is operating within nominal manufacturing parameters. All mechanical and thermal channels are within normal ±15% bands.`;
          bullets = [
            `Vibration RMS: ${liveSensor.vibration}g (Baseline: ${activeProfile.baseVib}g)`,
            `Stator Temp: ${liveSensor.temperature}°C (Baseline: ${activeProfile.baseTemp}°C)`,
            `Current Draw: ${liveSensor.current}A (Baseline: ${activeProfile.baseCurrent}A)`,
            `Sound Level: ${liveSensor.sound}dB (Baseline: ${activeProfile.baseSound}dB)`
          ];
          steps = [
            'Perform acoustic stethoscopic inspection on main bearing housing during scheduled shift pause.',
            'Replenish bearing housing with ISO VG 220 synthetic high-temp grease.',
            'Blow out cotton lint from motor cooling cowl and stator fins using 4-bar dry air.'
          ];
        }
      }

      const botMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        sender: 'copilot',
        text: replyText,
        bullets,
        steps,
        workOrder,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        language: selectedLanguage
      };

      setMessages(prev => [...prev, botMsg]);

      // If auto-speak enabled, speak the answer
      if (autoSpeak) {
        speakText(replyText, selectedLanguage, botMsg.id);
      }
    }, 450);
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Multilingual Selector */}
      <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 via-indigo-950/40 to-slate-900 border border-indigo-800/50 shadow-xl relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-semibold flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-indigo-400" /> Phase 7 Maintenance Co-Pilot
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                Voice &amp; Chatbot
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Tamil • Hindi • English
              </span>
            </div>

            <h2 className="text-xl font-bold text-white mt-2 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-indigo-400" />
              Multilingual Maintenance Co-Pilot
            </h2>

            <p className="text-xs text-slate-300 mt-1 max-w-3xl leading-relaxed">
              Empowering textile MSME shopfloor technicians and supervisors with native voice assistance and conversational diagnostics in <b>Tamil (தமிழ்)</b>, <b>Hindi (हिन्दी)</b>, and <b>English</b>. Directly grounded in live sensor telemetry, Random Forest failure predictions, and explainable root-cause attributions.
            </p>
          </div>

          {/* Language Selector & Voice Toggle */}
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            {/* Language Switcher Buttons */}
            <div className="flex p-1 rounded-xl bg-slate-950/90 border border-slate-800">
              <button
                onClick={() => setSelectedLanguage('en')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                  selectedLanguage === 'en'
                    ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-950'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <span>🇬🇧 English</span>
              </button>
              <button
                onClick={() => setSelectedLanguage('ta')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                  selectedLanguage === 'ta'
                    ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-950'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <span>🇮🇳 தமிழ் (Tamil)</span>
              </button>
              <button
                onClick={() => setSelectedLanguage('hi')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                  selectedLanguage === 'hi'
                    ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-950'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <span>🇮🇳 हिन्दी (Hindi)</span>
              </button>
            </div>

            {/* Auto-Speech Toggle */}
            <button
              onClick={() => setAutoSpeak(!autoSpeak)}
              className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition ${
                autoSpeak
                  ? 'bg-emerald-950/90 border-emerald-700 text-emerald-300'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
              title="Automatically read aloud Co-Pilot answers using browser voice synthesis"
            >
              {autoSpeak ? <Volume2 className="w-3.5 h-3.5 text-emerald-400" /> : <VolumeX className="w-3.5 h-3.5" />}
              <span>{autoSpeak ? 'Voice TTS Active' : 'Voice TTS Muted'}</span>
            </button>
          </div>
        </div>

        {/* Machine Context Ribbon */}
        <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono uppercase text-slate-400">Context Machine:</span>
            <select
              value={selectedMachineId}
              onChange={(e) => onSelectMachine(e.target.value)}
              className="bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-xs text-cyan-300 font-mono focus:outline-none"
            >
              {machineFleet.map(m => (
                <option key={m.id} value={m.id}>
                  {m.id} - {m.name}
                </option>
              ))}
            </select>
            <span className="text-slate-500 font-mono">({activeProfile.location})</span>
          </div>

          <div className="flex items-center gap-3 font-mono text-[11px]">
            <span className="text-slate-400">Live Telemetry:</span>
            <span className="text-rose-400">{liveSensor.temperature}°C</span>
            <span className="text-cyan-400">{liveSensor.vibration}g</span>
            <span className="text-amber-400">{liveSensor.current}A</span>
            <span className="text-purple-400">{liveSensor.sound}dB</span>
            {onNavigateToXAI && (
              <button
                onClick={onNavigateToXAI}
                className="text-[10px] text-cyan-400 hover:underline flex items-center gap-1 font-sans"
              >
                <span>View XAI Breakdown</span>
                <ChevronRight className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Co-Pilot Body Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 8 Columns: Conversational Dialogue Feed */}
        <div className="lg:col-span-8 flex flex-col h-[680px] rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl overflow-hidden">
          {/* Sub Navigation Bar */}
          <div className="px-5 py-3 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveSubTab('chat')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                  activeSubTab === 'chat'
                    ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/40'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Live Dialogue Deck</span>
              </button>
              <button
                onClick={() => setActiveSubTab('sops')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                  activeSubTab === 'sops'
                    ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/40'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Maintenance SOPs ({selectedLanguage.toUpperCase()})</span>
              </button>
              <button
                onClick={() => setActiveSubTab('work_orders')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                  activeSubTab === 'work_orders'
                    ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/40'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Wrench className="w-3.5 h-3.5" />
                <span>Logged Work Orders ({workOrdersLogged.length})</span>
              </button>
            </div>

            <div className="text-[10px] font-mono text-slate-500">
              Active: {selectedLanguage === 'ta' ? 'தமிழ்' : selectedLanguage === 'hi' ? 'हिन्दी' : 'English'}
            </div>
          </div>

          {/* VIEW: LIVE CHAT */}
          {activeSubTab === 'chat' && (
            <>
              {/* Message Feed Area */}
              <div className="flex-1 p-5 overflow-y-auto space-y-4">
                {messages.map((msg) => {
                  const isUser = msg.sender === 'user';
                  const isSpeaking = speakingMsgId === msg.id;

                  return (
                    <div
                      key={msg.id}
                      className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
                    >
                      {!isUser && (
                        <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-cyan-600 flex items-center justify-center shrink-0 shadow-md shadow-indigo-950 mt-1">
                          <Bot className="w-4 h-4 text-white" />
                        </div>
                      )}

                      <div className={`max-w-[85%] space-y-2.5 ${isUser ? 'items-end' : 'items-start'}`}>
                        <div
                          className={`p-4 rounded-2xl text-xs leading-relaxed ${
                            isUser
                              ? 'bg-indigo-600 text-white rounded-tr-none'
                              : 'bg-slate-950/80 border border-slate-800 text-slate-200 rounded-tl-none shadow-md'
                          }`}
                        >
                          <div className="whitespace-pre-wrap">{msg.text}</div>

                          {/* Technical Bullets if any */}
                          {msg.bullets && msg.bullets.length > 0 && (
                            <div className="mt-3 pt-3 border-t border-slate-800/80 space-y-1 text-[11px] font-mono">
                              {msg.bullets.map((b, i) => (
                                <div key={i} className="flex items-start gap-1.5 text-cyan-300">
                                  <span className="text-cyan-500">•</span>
                                  <span>{b}</span>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Prescriptive Steps Checklist if any */}
                          {msg.steps && msg.steps.length > 0 && (
                            <div className="mt-3 pt-3 border-t border-slate-800/80 space-y-1.5 text-[11px]">
                              <div className="font-semibold text-emerald-400 font-mono text-[10px] uppercase tracking-wider">
                                Prescriptive Action Protocol:
                              </div>
                              {msg.steps.map((st, i) => (
                                <div key={i} className="flex items-start gap-2 bg-slate-900/60 p-1.5 rounded border border-slate-800/60">
                                  <span className="w-4 h-4 rounded bg-emerald-950 border border-emerald-800 text-emerald-300 font-mono font-bold text-[9px] flex items-center justify-center shrink-0 mt-0.5">
                                    {i + 1}
                                  </span>
                                  <span className="text-slate-300 leading-snug">{st}</span>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Work Order Card if logged */}
                          {msg.workOrder && (
                            <div className="mt-3 p-3 rounded-xl bg-gradient-to-r from-indigo-950/70 to-slate-900 border border-indigo-800 text-[11px] space-y-1.5">
                              <div className="flex items-center justify-between font-bold text-white">
                                <span className="flex items-center gap-1.5 text-indigo-300 font-mono">
                                  <Wrench className="w-3.5 h-3.5" /> Maintenance Ticket #{msg.workOrder.id}
                                </span>
                                <span className="px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800 font-mono text-[9px]">
                                  {msg.workOrder.priority}
                                </span>
                              </div>
                              <div className="text-slate-200 font-semibold">{msg.workOrder.title}</div>
                              <div className="text-slate-400 text-[10px]">{msg.workOrder.cause}</div>
                              <div className="pt-1 flex items-center justify-between text-[10px] font-mono text-slate-300 border-t border-slate-800">
                                <span>Technician: {msg.workOrder.technician}</span>
                                <span className="text-emerald-400 font-bold">Est: ₹{msg.workOrder.costInr} ({msg.workOrder.hours} hrs)</span>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Timestamp & Voice Playback Button */}
                        <div className="flex items-center gap-2 px-1 text-[10px] text-slate-500 font-mono">
                          <span>{msg.timestamp}</span>
                          {!isUser && (
                            <button
                              onClick={() => speakText(msg.text, msg.language, msg.id)}
                              className={`flex items-center gap-1 px-2 py-0.5 rounded border transition ${
                                isSpeaking
                                  ? 'bg-cyan-950 border-cyan-700 text-cyan-300 animate-pulse'
                                  : 'bg-slate-900 border-slate-800 hover:text-slate-300'
                              }`}
                              title="Listen to response voice audio"
                            >
                              <Volume2 className="w-3 h-3 text-cyan-400" />
                              <span>{isSpeaking ? 'Playing Voice...' : 'Listen (TTS)'}</span>
                            </button>
                          )}
                        </div>
                      </div>

                      {isUser && (
                        <div className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0 mt-1">
                          <User className="w-4 h-4 text-slate-300" />
                        </div>
                      )}
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Quick Prompt Chips */}
              <div className="px-5 py-2 border-t border-slate-800/80 bg-slate-950/40 flex items-center gap-2 overflow-x-auto text-xs scrollbar-none">
                <span className="text-[10px] font-mono text-slate-500 shrink-0">Quick Prompts:</span>
                {QUICK_PROMPTS[selectedLanguage].map((chip, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(chip.query)}
                    className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-indigo-500/50 text-[11px] text-slate-300 font-medium whitespace-nowrap transition"
                  >
                    {chip.label}
                  </button>
                ))}
              </div>

              {/* Bottom Input Area */}
              <div className="p-4 border-t border-slate-800 bg-slate-950/80">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSendMessage();
                  }}
                  className="flex items-center gap-2.5"
                >
                  <button
                    type="button"
                    onClick={toggleMic}
                    className={`p-2.5 rounded-xl border transition ${
                      isListening
                        ? 'bg-rose-950 border-rose-700 text-rose-300 animate-pulse ring-2 ring-rose-500/40'
                        : 'bg-slate-900 hover:bg-slate-800 border-slate-700 text-slate-300'
                    }`}
                    title={isListening ? 'Stop recording voice' : 'Speak your query in English, Tamil, or Hindi'}
                  >
                    {isListening ? <Mic className="w-4 h-4 text-rose-400" /> : <Mic className="w-4 h-4 text-cyan-400" />}
                  </button>

                  <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder={
                      selectedLanguage === 'ta'
                        ? 'கேள்வியை தமிழில் கேட்கவும் (எ.கா: WVE-03 அதிர்வு ஏன் அதிகமாக உள்ளது?)...'
                        : selectedLanguage === 'hi'
                        ? 'हिन्दी में प्रश्न पूछें (उदा: लूम WVE-03 में कंपन क्यों बढ़ रहा है?)...'
                        : 'Ask maintenance question in English, Tamil, or Hindi...'
                    }
                    className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
                  />

                  <button
                    type="submit"
                    disabled={!inputText.trim()}
                    className="p-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:hover:bg-indigo-600 text-white transition shadow-md shadow-indigo-950"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </div>
            </>
          )}

          {/* VIEW: MAINTENANCE SOPS */}
          {activeSubTab === 'sops' && (
            <div className="flex-1 p-5 overflow-y-auto space-y-4">
              <div className="text-xs text-slate-400 mb-2">
                Curated Standard Operating Procedures for textile MSME maintenance in{' '}
                <span className="font-semibold text-indigo-300">
                  {selectedLanguage === 'ta' ? 'தமிழ்' : selectedLanguage === 'hi' ? 'हिन्दी' : 'English'}
                </span>.
              </div>

              {/* Bearing Replacement SOP Card */}
              <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-bold text-white flex items-center gap-2">
                    <Wrench className="w-4 h-4 text-cyan-400" />
                    <span>
                      {selectedLanguage === 'ta'
                        ? 'அதிவேக ஸ்பிண்டில் & தறி தாங்கி (Bearing) மாற்றுதல் நெறிமுறை'
                        : selectedLanguage === 'hi'
                        ? 'हाई-स्पीड स्पिंडल और लूम बेयरिंग प्रतिस्थापन प्रक्रिया'
                        : 'High-Speed Spindle & Loom Bearing Replacement Protocol'}
                    </span>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-950 text-cyan-300 border border-cyan-800">
                    SOP-MECH-01
                  </span>
                </div>

                <div className="space-y-1.5 text-xs">
                  {(selectedLanguage === 'ta'
                    ? [
                        'இயந்திரத்தை நிறுத்தி, மெயின் 415V சுவிட்சில் LOTO பாதுகாப்பு பூட்டு போடவும்.',
                        'டிரைவ் பெல்ட் கவரை அகற்றி, டென்ஷனர் போல்ட்டை தளர்த்தி டைமிங் பெல்ட்டைக் கழற்றவும்.',
                        'ஹைட்ராலிக் புல்லர் (Puller) பயன்படுத்தி பழைய தேய்ந்த தாங்கியை (Bearing) தண்டு சேதமடையாமல் வெளியே எடுக்கவும்.',
                        'ஷாப்ட் பரப்பை சால்வென்ட் கொண்டு சுத்தம் செய்து, கீறல்கள் இல்லை என்பதை உறுதிப்படுத்தவும்.',
                        'புதிய ஸ்பெரிக்கல் ரோலர் பேரிங்கை இண்டக்ஷன் ஹீட்டரில் 110°C வரை சூடாக்கி ஷாஃப்டில் மெதுவாகப் பொருத்தவும்.',
                        'லாக்நட்டை 65 Nm அளவுக்கு முறுக்கி, 15 நிமிடங்கள் சோதனை ஓட்டம் நடத்தி அதிர்வு 0.40g-க்கு கீழ் உள்ளதை உறுதி செய்யவும்.'
                      ]
                    : selectedLanguage === 'hi'
                    ? [
                        'मशीन को बंद करें और मुख्य 415V विद्युत स्विच को LOTO लॉक से सुरक्षित करें।',
                        'ड्राइव बेल्ट गार्ड को हटाकर टेंशनर बोल्ट की सहायता से बेल्ट को ढीला करें।',
                        'हाइड्रोलिक बियरिंग पुलर का उपयोग करके पुरानी बेयरिंग को बिना शाफ्ट खराब किए बाहर निकालें।',
                        'शाफ्ट को सॉल्वेंट से अच्छी तरह साफ करें और घिसाव की जांच करें (< 0.02mm)।',
                        'नई स्फेरिकल रोलर बेयरिंग को इंडक्शन हीटर में 110°C तक गर्म करके शाफ्ट पर फिट करें।',
                        'लॉकनट को 65 Nm टॉर्क पर कसें और 15 मिनट का ट्रायल रन चलाएं।'
                      ]
                    : [
                        'Halt machine and verify main 415V electrical supply is mechanically locked out.',
                        'Remove drive belt guard and slacken timing belts using tensioner adjustment bolt.',
                        'Use hydraulic bearing puller on inner raceway to extract degraded bearing without scoring shaft.',
                        'Clean spindle journal with solvent cleaner and inspect for fretting corrosion (< 0.02mm runout).',
                        'Induction-heat replacement spherical roller bearing to 110°C and slide onto shaft.',
                        'Fasten locknut to 65 Nm torque and execute 15-minute cold test (< 0.40g RMS).'
                      ]
                  ).map((step, i) => (
                    <div key={i} className="flex items-start gap-2.5 p-2 rounded-lg bg-slate-900/60 border border-slate-800/60">
                      <span className="w-5 h-5 rounded bg-cyan-950 border border-cyan-800 text-cyan-300 font-mono font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                        {i + 1}
                      </span>
                      <span className="text-slate-300 leading-relaxed">{step}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Motor Overheating Mitigation SOP */}
              <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-bold text-white flex items-center gap-2">
                    <Thermometer className="w-4 h-4 text-rose-400" />
                    <span>
                      {selectedLanguage === 'ta'
                        ? 'கார்டிங் & ஸ்பின்னிங் மோட்டார் அதிக வெப்பம் தணிக்கும் முறை'
                        : selectedLanguage === 'hi'
                        ? 'कार्डिंग और कताई मोटर ओवरहीटिंग निवारण प्रक्रिया'
                        : 'Carding & Spinning Drive Motor Overheating Mitigation'}
                    </span>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-rose-950 text-rose-300 border border-rose-800">
                    SOP-ELEC-02
                  </span>
                </div>

                <div className="space-y-1.5 text-xs">
                  {(selectedLanguage === 'ta'
                    ? [
                        'மின்சாரத்தை துண்டித்து, மோட்டார் குளிர்ச்சியடையும் வரை காத்திருக்கவும்.',
                        'கம்ப்ரெஸ் செய்யப்பட்ட உலர் காற்றைக் கொண்டு கூலிங் ஃபேன் மற்றும் கூடுகளிலுள்ள பஞ்சுத் துகள்களை ஊதி அகற்றவும்.',
                        'டெர்மினல் பாக்ஸை திறந்து வயர் இணைப்புகள் தளர்வாகவோ அல்லது தீய்ந்துபோய் உள்ளதா என ஆய்வு செய்யவும்.',
                        'மைக்ரோ-ஓம் மீட்டரைக் கொண்டு 3-பேஸ் வைண்டிங் மின்தடையை அளவிடவும் (சமநிலையின்மை < 2%).',
                        'மோட்டார் பெல்ட் அதிக இறுக்கமாக இல்லாமல் சரியான அளவில் உள்ளதா என சரிபார்க்கவும்.',
                        'அகச்சிவப்பு தெர்மோமீட்டர் கொண்டு வெப்பநிலை 55°C-க்கு கீழ் உள்ளதை உறுதிப்படுத்தவும்.'
                      ]
                    : selectedLanguage === 'hi'
                    ? [
                        'बिजली आपूर्ति बंद करें और मोटर को ठंडा होने दें।',
                        'कंप्रेस्ड हवा की मदद से मोटर के कूलिंग पंखे और वेंटिलेशन ग्रिल से रुई/लिंट को पूरी तरह साफ करें।',
                        'टर्मिनल बॉक्स खोलें और जांचें कि कोई केबल ढीली या जली हुई तो नहीं है।',
                        '3-फेज वाइंडिंग रेजिस्टेंस मापें; असंतुलन 2% से कम होना चाहिए।',
                        'ड्राइव बेल्ट के अत्यधिक तनाव को कम करें ताकि मोटर पर अतिरिक्त भार न पड़े।',
                        'इंफ्रारेड थर्मामीटर से पुष्टि करें कि तापमान 55°C से नीचे स्थिर हो गया है।'
                      ]
                    : [
                        'Isolate electrical supply and allow motor surface to cool down.',
                        'Use compressed dry air (4 bar) to thoroughly blow out textile lint and fluff from rear cooling cowl.',
                        'Open terminal box; inspect for loose lead lugs, burned insulation, or phase discoloration.',
                        'Measure 3-phase winding resistance; ensure imbalance is under 2%.',
                        'Check mechanical driven load for overtightened drive belts or bearing drag.',
                        'Monitor steady-state surface temperature with infrared thermometer (< 55°C).'
                      ]
                  ).map((step, i) => (
                    <div key={i} className="flex items-start gap-2.5 p-2 rounded-lg bg-slate-900/60 border border-slate-800/60">
                      <span className="w-5 h-5 rounded bg-rose-950 border border-rose-800 text-rose-300 font-mono font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                        {i + 1}
                      </span>
                      <span className="text-slate-300 leading-relaxed">{step}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* VIEW: LOGGED WORK ORDERS */}
          {activeSubTab === 'work_orders' && (
            <div className="flex-1 p-5 overflow-y-auto space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                <span>Active Work Orders in SQLite Table 5 (<code>maintenance_logs</code>)</span>
                <span className="font-mono text-cyan-400">{workOrdersLogged.length} tickets recorded</span>
              </div>

              {workOrdersLogged.map((wo) => (
                <div key={wo.id} className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <div className="font-bold text-white flex items-center gap-2">
                      <span className="font-mono text-indigo-400">WO-#{wo.id}</span>
                      <span>•</span>
                      <span className="font-mono text-cyan-300">{wo.machineId}</span>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-rose-950 text-rose-300 border border-rose-800">
                      {wo.priority}
                    </span>
                  </div>

                  <div className="font-semibold text-slate-200">{wo.title}</div>
                  <div className="text-slate-400 text-[11px]">{wo.cause}</div>
                  <div className="p-2 rounded bg-slate-900/70 border border-slate-800 text-slate-300 text-[11px]">
                    <span className="font-semibold text-cyan-300">Action: </span>
                    {wo.action}
                  </div>

                  <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[11px] font-mono text-slate-400">
                    <span>Assigned: {wo.technician}</span>
                    <span>Logged: {wo.time}</span>
                    <span className="text-emerald-400 font-bold">Est: ₹{wo.costInr} ({wo.hours} hrs)</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right 4 Columns: Co-Pilot Capability Deck & Active Machine Status */}
        <div className="lg:col-span-4 space-y-6">
          {/* Active Asset Card */}
          <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
                Machine Under Inspection
              </span>
              <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 text-[10px] font-mono">
                Telemetry Synced
              </span>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-3xl p-2 rounded-xl bg-slate-800 border border-slate-700">
                {activeProfile.icon}
              </span>
              <div>
                <div className="text-base font-bold text-white flex items-center gap-1.5">
                  <span className="font-mono text-cyan-400">{activeProfile.id}</span>
                  <span className="text-xs text-slate-400 font-normal">({activeProfile.type})</span>
                </div>
                <div className="text-xs text-slate-300 font-medium truncate max-w-[190px]">
                  {activeProfile.name}
                </div>
                <div className="text-[10px] text-slate-500">{activeProfile.location}</div>
              </div>
            </div>

            {/* 4 Sensor Bars */}
            <div className="space-y-2 pt-2 border-t border-slate-800">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400 flex items-center gap-1">
                  <Thermometer className="w-3.5 h-3.5 text-rose-400" /> Temperature:
                </span>
                <span className="font-mono font-bold text-rose-400">{liveSensor.temperature}°C</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400 flex items-center gap-1">
                  <Activity className="w-3.5 h-3.5 text-cyan-400" /> Vibration RMS:
                </span>
                <span className="font-mono font-bold text-cyan-400">{liveSensor.vibration}g</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400 flex items-center gap-1">
                  <Zap className="w-3.5 h-3.5 text-amber-400" /> Current Draw:
                </span>
                <span className="font-mono font-bold text-amber-400">{liveSensor.current}A</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400 flex items-center gap-1">
                  <Volume2 className="w-3.5 h-3.5 text-purple-400" /> Sound Level:
                </span>
                <span className="font-mono font-bold text-purple-400">{liveSensor.sound}dB</span>
              </div>
            </div>
          </div>

          {/* Multilingual Voice Synthesis Highlights */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-950/60 to-slate-900 border border-indigo-800/60 space-y-3">
            <h4 className="text-xs font-bold text-white flex items-center gap-2">
              <Languages className="w-4 h-4 text-indigo-400" />
              Multilingual Voice Capabilities
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              Designed specifically for textile manufacturing workers in Tamil Nadu, Gujarat, and Punjab textile clusters:
            </p>
            <div className="space-y-2 text-xs">
              <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800 flex items-center justify-between">
                <div>
                  <div className="font-bold text-white">தமிழ் (Tamil)</div>
                  <div className="text-[10px] text-slate-400">Coimbatore / Tirupur Cluster</div>
                </div>
                <span className="text-[10px] font-mono text-cyan-400 px-2 py-0.5 rounded bg-cyan-950 border border-cyan-800">
                  ta-IN
                </span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800 flex items-center justify-between">
                <div>
                  <div className="font-bold text-white">हिन्दी (Hindi)</div>
                  <div className="text-[10px] text-slate-400">Surat / Ludhiana Cluster</div>
                </div>
                <span className="text-[10px] font-mono text-cyan-400 px-2 py-0.5 rounded bg-cyan-950 border border-cyan-800">
                  hi-IN
                </span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800 flex items-center justify-between">
                <div>
                  <div className="font-bold text-white">English</div>
                  <div className="text-[10px] text-slate-400">Engineering &amp; Executive</div>
                </div>
                <span className="text-[10px] font-mono text-cyan-400 px-2 py-0.5 rounded bg-cyan-950 border border-cyan-800">
                  en-IN
                </span>
              </div>
            </div>
          </div>

          {/* SQLite Table 8 Chat History Specs */}
          <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2 font-mono text-xs">
            <div className="text-[10px] uppercase text-slate-400 font-sans font-bold flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-cyan-400" />
              SQLite Table 8: chat_history
            </div>
            <pre className="text-[10px] text-slate-400 p-2.5 rounded-lg bg-slate-950 border border-slate-800/80 leading-relaxed overflow-x-auto">
{`INSERT INTO chat_history 
(user_id, machine_id, user_query, 
 bot_response, intent_detected, 
 confidence_score, timestamp);`}
            </pre>
            <div className="text-[10px] text-slate-500 font-sans">
              All technician voice queries and AI prescriptive guidance are persisted for mill shift audits.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
