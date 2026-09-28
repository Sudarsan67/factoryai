"""
FactoryPulse AI - Multilingual Maintenance Co-Pilot Engine (Phase 7)
Subtitle: AI Maintenance Co-Pilot for Textile MSMEs
Languages: English (en), Tamil (ta), Hindi (hi)
"""

import os
import sys
import json
import sqlite3
import re
from datetime import datetime
from typing import Dict, Any, List, Optional, Tuple

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../../..")))

from backend.app.services.xai_engine import (
    explain_machine_from_db,
    explain_machine_telemetry,
    get_machine_baseline,
    DEFAULT_BASELINES
)

DB_PATH = os.path.join(os.path.dirname(__file__), "../../database/factorypulse.db")

# Textile Standard Operating Procedures (SOPs) Knowledge Base
TEXTILE_SOPS: List[Dict[str, Any]] = [
    {
        "sop_id": "SOP-MECH-01",
        "category": "Bearings",
        "title_en": "High-Speed Spindle & Loom Bearing Replacement Protocol",
        "title_ta": "அதிவேக ஸ்பிண்டில் மற்றும் தறி தாங்கி (Bearing) மாற்றுதல் நெறிமுறை",
        "title_hi": "हाई-स्पीड स्पिंडल और लूम बेयरिंग प्रतिस्थापन प्रक्रिया",
        "machine_type": "Weaving Loom / Spinning Machine",
        "frequency": "Upon vibration > 1.8g RMS or 8,000 operational hours",
        "safety_precautions": [
            "Lockout/Tagout (LOTO) main electrical isolator switch before opening housing",
            "Wear cut-resistant safety gloves and safety goggles",
            "Allow bearing housing to cool below 40°C before dismounting"
        ],
        "steps_en": [
            "Halt machine and verify main 415V supply is mechanically locked out.",
            "Remove drive belt guard and slacken timing belts using tensioner adjustment bolt.",
            "Use hydraulic bearing puller on the inner raceway to extract degraded bearing without scoring shaft.",
            "Clean spindle journal with solvent cleaner and inspect for fretting corrosion or shaft runout (< 0.02mm).",
            "Induction-heat replacement spherical roller bearing (ISO VG 220 pre-lubricated) to 110°C and slide onto shaft.",
            "Fasten locknut to 65 Nm torque and rotate by hand to confirm zero binding.",
            "Run 15-minute cold idle test and record baseline vibration (< 0.40g RMS)."
        ],
        "steps_ta": [
            "இயந்திரத்தை நிறுத்தி, மெயின் 415V சுவிட்சில் LOTO பாதுகாப்பு பூட்டு போடவும்.",
            "டிரைவ் பெல்ட் கவரை அகற்றி, டென்ஷனர் போல்ட்டை தளர்த்தி டைமிங் பெல்ட்டைக் கழற்றவும்.",
            "ஹைட்ராலிக் புல்லர் (Puller) பயன்படுத்தி பழைய தேய்ந்த தாங்கியை (Bearing) தண்டு சேதமடையாமல் வெளியே எடுக்கவும்.",
            "ஷாப்ட் பரப்பை சால்வென்ட் கொண்டு சுத்தம் செய்து, கீறல்கள் அல்லது வளைவு இல்லை என்பதை உறுதிப்படுத்தவும்.",
            "புதிய ஸ்பெரிக்கல் ரோலர் பேரிங்கை இண்டக்ஷன் ஹீட்டரில் 110°C வரை சூடாக்கி ஷாஃப்டில் மெதுவாகப் பொருத்தவும்.",
            "லாக்நட்டை 65 Nm அளவுக்கு முறுக்கி, கைகளால் சுழற்றி தடையின்றி இயங்குவதை சோதிக்கவும்.",
            "15 நிமிடங்கள் குறைந்த வேகத்தில் இயக்கி அதிர்வு 0.40g-க்கு கீழ் இருப்பதை உறுதி செய்யவும்."
        ],
        "steps_hi": [
            "मशीन को बंद करें और मुख्य 415V विद्युत स्विच को LOTO लॉक से सुरक्षित करें।",
            "ड्राइव बेल्ट गार्ड को हटाकर टेंशनर बोल्ट की सहायता से बेल्ट को ढीला करें।",
            "हाइड्रोलिक बियरिंग पुलर का उपयोग करके पुरानी बेयरिंग को बिना शाफ्ट खराब किए बाहर निकालें।",
            "शाफ्ट को सॉल्वेंट से अच्छी तरह साफ करें और घिसाव की जांच करें (< 0.02mm)।",
            "नई स्फेरिकल रोलर बेयरिंग को इंडक्शन हीटर में 110°C तक गर्म करके शाफ्ट पर फिट करें।",
            "लॉकनट को 65 Nm टॉर्क पर कसें और हाथ से घुमाकर सुनिश्चित करें कि कोई जाम नहीं है।",
            "15 मिनट का ट्रायल रन चलाएं और सुनिश्चित करें कि कंपन 0.40g RMS से कम है।"
        ]
    },
    {
        "sop_id": "SOP-ELEC-02",
        "category": "Motor",
        "title_en": "Carding & Spinning Drive Motor Overheating Mitigation",
        "title_ta": "கார்டிங் மற்றும் ஸ்பின்னிங் மோட்டார் அதிக வெப்பம் தணிக்கும் முறை",
        "title_hi": "कार्डिंग और कताई मोटर ओवरहीटिंग निवारण प्रक्रिया",
        "machine_type": "Industrial Motor (15-45 kW)",
        "frequency": "Upon stator surface temp > 65°C or weekly maintenance",
        "safety_precautions": [
            "Do not touch motor housing with bare hands while operating",
            "Discharge power factor correction capacitors before inspecting terminal box"
        ],
        "steps_en": [
            "Isolate electrical supply and allow motor surface to cool.",
            "Use compressed dry air (4 bar) to thoroughly blow out textile lint and fluff from the rear cooling cowl and stator fins.",
            "Open terminal box; inspect for loose lead lugs, burned insulation, or phase discoloration.",
            "Measure 3-phase winding resistance using a micro-ohmmeter; ensure resistance imbalance is under 2%.",
            "Verify cooling fan blades are intact and not dragging against cowl shroud.",
            "Check mechanical driven load for bearing seizure or overtightened drive belts.",
            "Re-energize motor, monitor steady-state temperature with infrared thermometer (< 55°C)."
        ],
        "steps_ta": [
            "மின்சாரத்தை துண்டித்து, மோட்டார் குளிர்ச்சியடையும் வரை காத்திருக்கவும்.",
            "கம்ப்ரெஸ் செய்யப்பட்ட உலர் காற்றைக் கொண்டு மோட்டார் கூலிங் ஃபேன் மற்றும் கூடுகளிலுள்ள பஞ்சுத் துகள்களை முழுமையாக ஊதி அகற்றவும்.",
            "டெர்மினல் பாக்ஸை திறந்து வயர் இணைப்புகள் தளர்வாகவோ அல்லது தீய்ந்துபோய் உள்ளதா என ஆய்வு செய்யவும்.",
            "மைக்ரோ-ஓம் மீட்டரைக் கொண்டு 3-பேஸ் வைண்டிங் மின்தடையை அளவிடவும்; சமநிலையின்மை 2%-க்குள் இருக்க வேண்டும்.",
            "கூலிங் ஃபேன் இறக்கைகள் உடையாமல் சுத்தமாக உள்ளதா என பரிசோதிக்கவும்.",
            "மோட்டார் பெல்ட் அதிக இறுக்கமாக இல்லாமல் சரியான அளவில் உள்ளதா என சரிபார்க்கவும்.",
            "இயந்திரத்தை இயக்கி, அகச்சிவப்பு தெர்மோமீட்டர் கொண்டு வெப்பநிலை 55°C-க்கு கீழ் உள்ளதை உறுதிப்படுத்தவும்."
        ],
        "steps_hi": [
            "बिजली आपूर्ति बंद करें और मोटर को ठंडा होने दें।",
            "कंप्रेस्ड हवा की मदद से मोटर के कूलिंग पंखे और वेंटिलेशन ग्रिल से रुई/लिंट को पूरी तरह साफ करें।",
            "टर्मिनल बॉक्स खोलें और जांचें कि कोई केबल ढीली या जली हुई तो नहीं है।",
            "3-फेज वाइंडिंग रेजिस्टेंस मापें; असंतुलन 2% से कम होना चाहिए।",
            "कूलिंग फैन के ब्लेड की जांच करें कि वे टूटे या मुड़े हुए न हों।",
            "ड्राइव बेल्ट के अत्यधिक तनाव को कम करें ताकि मोटर पर अतिरिक्त भार न पड़े।",
            "मोटर चालू करें और इंफ्रारेड थर्मामीटर से पुष्टि करें कि तापमान 55°C से नीचे स्थिर हो गया है।"
        ]
    }
]


def detect_language(query: str, default: str = "en") -> str:
    """Detect if query is in Tamil, Hindi, or English based on script unicode ranges."""
    # Tamil Unicode block: \u0B80-\u0BFF
    if re.search(r"[\u0B80-\u0BFF]", query):
        return "ta"
    # Devanagari/Hindi Unicode block: \u0900-\u097F
    if re.search(r"[\u0900-\u097F]", query):
        return "hi"
    return default


def extract_machine_id(query: str, default_id: str = "WVE-03") -> str:
    """Extract machine identifier from query string if mentioned."""
    query_upper = query.upper()
    for mid in DEFAULT_BASELINES.keys():
        if mid in query_upper:
            return mid

    # Match common textile machine terms
    if "SPIN" in query_upper or "நூற்பு" in query or "कताई" in query:
        return "SPN-01"
    if "WEAV" in query_upper or "LOOM" in query_upper or "நெசவு" in query or "தறி" in query or "लूम" in query or "बुनाई" in query:
        return "WVE-03"
    if "KNIT" in query_upper or "பின்னல்" in query or "बुना" in query:
        return "KNT-02"
    if "DYE" in query_upper or "சாயம்" in query or "डाइंग" in query or "रंगाई" in query:
        return "DYE-04"
    if "MOTOR" in query_upper or "CARDING" in query_upper or "மோட்டார்" in query or "मोटर" in query:
        return "MTR-05"
    if "COMPRESS" in query_upper or "கம்ப்ரசர்" in query or "कंप्रेसर" in query:
        return "CMP-06"

    return default_id


def classify_intent(query: str) -> Tuple[str, float]:
    """Classify user intent into diagnostic, telemetry, SOP, work order, or general inquiry."""
    q_lower = query.lower()

    # Work Order Creation intent
    if any(k in q_lower for k in ["ticket", "work order", "வேலை உத்தரவு", "பழுது பதிவு", "वर्क ऑर्डर", "शिकायत"]):
        return "create_work_order", 0.95

    # SOP / Repair Instruction intent
    if any(k in q_lower for k in [
        "how to", "sop", "steps", "procedure", "guide", "protocol", "replace",
        "எப்படி", "வழிமுறை", "மாற்றுவது", "நெறிமுறை", "செய்முறை",
        "कैसे", "प्रक्रिया", "बदलें", "चरण", "गाइड"
    ]):
        return "prescriptive_sop", 0.92

    # Explainable AI Root Cause intent
    if any(k in q_lower for k in [
        "why", "cause", "reason", "xai", "explain", "attribution",
        "ஏன்", "காரணம்", "விளக்கு", "ஏற்பட்டது",
        "क्यों", "कारण", "वजह", "समझाओ"
    ]):
        return "xai_explanation", 0.90

    # Real-time Telemetry inquiry
    if any(k in q_lower for k in [
        "temperature", "vibration", "current", "sound", "reading", "value", "telemetry",
        "வெப்பநிலை", "அதிர்வு", "மின்னோட்டம்", "சத்தம்", "அளவு",
        "तापमान", "कंपन", "करंट", "ध्वनि", "रीडिंग"
    ]):
        return "telemetry_inquiry", 0.88

    # General Machine Diagnosis
    if any(k in q_lower for k in [
        "health", "status", "condition", "fail", "breakdown", "state", "risk",
        "நிலை", "ஆரோக்கியம்", "பழுது", "ஆபத்து",
        "स्थिति", "हालत", "स्वास्थ्य", "खराबी", "जोखिम"
    ]):
        return "machine_diagnosis", 0.85

    return "general_inquiry", 0.70


def generate_multilingual_response(
    query: str,
    machine_id: str,
    language: str,
    user_id: str = "tech-01"
) -> Dict[str, Any]:
    """
    Main dialogue reasoning engine:
    1. Fetches real-time machine baseline, telemetry, and XAI explanation.
    2. Identifies user query intent.
    3. Synthesizes a response in English, Tamil, or Hindi.
    4. Provides technical bullets, step-by-step SOP actions, and work order recommendations.
    5. Persists the conversation into SQLite Table 8 (chat_history).
    """
    intent, confidence = classify_intent(query)
    baseline = get_machine_baseline(machine_id)
    xai = explain_machine_from_db(machine_id)

    top_sensor = xai.get("top_contributing_sensor", "Vibration")
    top_dev = xai.get("top_deviation_percent", 0.0)
    root_cause = xai.get("diagnosed_root_cause", "Nominal Operating Parameters")
    is_at_risk = xai.get("is_at_risk", False)
    risk_level = xai.get("risk_level", "Nominal")

    bullets: List[str] = []
    prescriptive_steps: List[str] = []
    work_order: Optional[Dict[str, Any]] = None

    # Fetch live sensor readings from DB or baseline
    curr_temp = baseline["temp"]
    curr_vib = baseline["vib"]
    curr_curr = baseline["current"]
    curr_sound = baseline["sound"]

    for dev in xai.get("sensor_deviations", []):
        if dev["sensor_name"] == "Temperature":
            curr_temp = dev["actual_value"]
        elif dev["sensor_name"] == "Vibration":
            curr_vib = dev["actual_value"]
        elif dev["sensor_name"] == "Current":
            curr_curr = dev["actual_value"]
        elif dev["sensor_name"] == "Sound":
            curr_sound = dev["actual_value"]

    # -------------------------------------------------------------
    # 1. TAMIL RESPONSE SYNTHESIS (தமிழ்)
    # -------------------------------------------------------------
    if language == "ta":
        if intent == "create_work_order":
            reply_text = (
                f"இயந்திரம் {machine_id} ({baseline['name']}) க்கான அவசர பராமரிப்பு வேலை உத்தரவு (Work Order) "
                f"SQLite தரவுத்தளத்தில் வெற்றிகரமாக பதிவு செய்யப்பட்டது. நிலை: {risk_level}."
            )
            bullets = [
                f"இயந்திரம்: {machine_id} ({baseline['type']})",
                f"கண்டறியப்பட்ட பழுது: {root_cause}",
                f"முதன்மை காரணி: {top_sensor} ({top_dev:+.1f}% மாற்றம்)",
                "முன்னுரிமை: அவசரம் (Critical) | தொழில்நுட்ப வல்லுநர்: எஸ். ராமநாதன்"
            ]
            prescriptive_steps = [
                "LOTO பாதுகாப்பு விதிமுறைகளை பின்பற்றி மெயின் பவர் சுவிட்சை ஆஃப் செய்யவும்.",
                "அதிர்வு ஆய்வுக் கருவி கொண்டு தாங்கி கூட்டை பரிசோதிக்கவும்.",
                "ISO VG 220 சிந்தெடிக் கிரீஸ் கொண்டு மசகிடவும்."
            ]
        elif intent == "prescriptive_sop":
            sop = TEXTILE_SOPS[0] if "vib" in top_sensor.lower() or "bear" in root_cause.lower() else TEXTILE_SOPS[1]
            reply_text = (
                f"இயந்திரம் {machine_id} க்கான நிலையான செயல்பாட்டு பராமரிப்பு நெறிமுறை (SOP): "
                f"{sop['title_ta']}."
            )
            bullets = [
                f"SOP எண்: {sop['sop_id']}",
                f"இயந்திர வகை: {sop['machine_type']}",
                f"பரிந்துரைக்கப்பட்ட பராமரிப்பு கால அளவு: {sop['frequency']}"
            ]
            prescriptive_steps = sop["steps_ta"]
        elif intent in ["xai_explanation", "machine_diagnosis"]:
            if is_at_risk:
                reply_text = (
                    f"எச்சரிக்கை! இயந்திரம் {machine_id} ({baseline['name']}) தற்போது ஆபத்தான நிலையில் உள்ளது. "
                    f"விளக்கக்கூடிய AI (XAI) பகுப்பாய்வின்படி, {top_sensor} இயல்பான அளவை விட {top_dev:+.1f}% அதிகமாக உள்ளது. "
                    f"இதனால் '{root_cause}' ஏற்படுவதற்கான வாய்ப்பு மிக அதிகம்."
                )
            else:
                reply_text = (
                    f"இயந்திரம் {machine_id} ({baseline['name']}) தற்போது ஆரோக்கியமான இயல்பு நிலையில் இயங்குகிறது. "
                    f"அனைத்து சென்சார் அளவுகளும் அனுமதிக்கப்பட்ட ±15% வரம்பிற்குள் உள்ளன."
                )
            bullets = [
                f"வெப்பநிலை: {curr_temp}°C (இயல்பு: {baseline['temp']}°C)",
                f"அதிர்வு RMS: {curr_vib}g (இயல்பு: {baseline['vib']}g)",
                f"மின்னோட்டம்: {curr_curr}A (இயல்பு: {baseline['current']}A)",
                f"சத்தம்: {curr_sound}dB (இயல்பு: {baseline['sound']}dB)"
            ]
            prescriptive_steps = [
                "அடுத்த ஷிப்ட் தொடங்குவதற்கு முன் மோட்டார் மற்றும் பேரிங் நிலையை சரிபார்க்கவும்.",
                "பஞ்சு கழிவுகளை காற்று பைப் கொண்டு தூய்மைப்படுத்தவும்.",
                "மசகு எண்ணெய் (Grease) அளவை சரிபார்க்கவும்."
            ]
        else:  # Telemetry or General
            reply_text = (
                f"இயந்திரம் {machine_id} ({baseline['name']}) தற்போதைய நேரலை சென்சார் அளவீடுகள்:"
            )
            bullets = [
                f"வெப்பநிலை: {curr_temp}°C | அதிர்வு: {curr_vib}g",
                f"மின்னோட்டம்: {curr_curr}A | ஒலி அளவு: {curr_sound}dB",
                f"இடம்: {baseline['location']} | திறன்: {baseline.get('power', 'Rated KW')}"
            ]
            prescriptive_steps = [
                "2 மணி நேரத்திற்கு ஒரு முறை நேரலை அளவீடுகளை கண்காணிக்கவும்."
            ]

    # -------------------------------------------------------------
    # 2. HINDI RESPONSE SYNTHESIS (हिन्दी)
    # -------------------------------------------------------------
    elif language == "hi":
        if intent == "create_work_order":
            reply_text = (
                f"मशीन {machine_id} ({baseline['name']}) के लिए आपातकालीन रखरखाव वर्क ऑर्डर (Work Order) "
                f"सफलतापूर्वक SQLite डेटाबेस में दर्ज कर लिया गया है। प्राथमिकता: {risk_level}।"
            )
            bullets = [
                f"मशीन आईडी: {machine_id} ({baseline['type']})",
                f"संभावित खराबी: {root_cause}",
                f"प्राथमिक कारक: {top_sensor} ({top_dev:+.1f}% विचलन)",
                "अपेक्षित मरम्मत समय: 2.5 घंटे | तकनीशियन: आर. के. शर्मा"
            ]
            prescriptive_steps = [
                "मशीन को LOTO प्रोटोकॉल के तहत बंद करें।",
                "बेयरिंग हाउसिंग की एकॉस्टिक जांच करें।",
                "ISO VG 220 सिंथेटिक ग्रीस से स्नेहन करें।"
            ]
        elif intent == "prescriptive_sop":
            sop = TEXTILE_SOPS[0] if "vib" in top_sensor.lower() or "bear" in root_cause.lower() else TEXTILE_SOPS[1]
            reply_text = (
                f"मशीन {machine_id} के लिए मानक संचालन प्रक्रिया (SOP): {sop['title_hi']}।"
            )
            bullets = [
                f"SOP कोड: {sop['sop_id']}",
                f"उपकरण श्रेणी: {sop['machine_type']}",
                f"रखरखाव आवृत्ति: {sop['frequency']}"
            ]
            prescriptive_steps = sop["steps_hi"]
        elif intent in ["xai_explanation", "machine_diagnosis"]:
            if is_at_risk:
                reply_text = (
                    f"चेतावनी! मशीन {machine_id} ({baseline['name']}) वर्तमान में जोखिम में है। "
                    f"एक्सप्लेनेबल एआई (XAI) इंजन के अनुसार, {top_sensor} सामान्य सीमा से {top_dev:+.1f}% अधिक है। "
                    f"इसका मुख्य कारण '{root_cause}' है।"
                )
            else:
                reply_text = (
                    f"मशीन {machine_id} ({baseline['name']}) सामान्य और स्वस्थ स्थिति में काम कर रही है। "
                    f"सभी सेंसर मान सामान्य सीमा (±15%) के भीतर हैं।"
                )
            bullets = [
                f"तापमान: {curr_temp}°C (सामान्य: {baseline['temp']}°C)",
                f"कंपन RMS: {curr_vib}g (सामान्य: {baseline['vib']}g)",
                f"करंट लोड: {curr_curr}A (सामान्य: {baseline['current']}A)",
                f"ध्वनि स्तर: {curr_sound}dB (सामान्य: {baseline['sound']}dB)"
            ]
            prescriptive_steps = [
                "अगली शिफ्ट से पहले कूलिंग फैन और बेयरिंग की स्थिति जांचें।",
                "हवा के दबाव से रुई के रेशों (Lint) को साफ करें।",
                "आवश्यकतानुसार ग्रीसिंग करें।"
            ]
        else:  # Telemetry or General
            reply_text = (
                f"मशीन {machine_id} ({baseline['name']}) की वर्तमान लाइव टेलीमेट्री रीडिंग:"
            )
            bullets = [
                f"तापमान: {curr_temp}°C | कंपन: {curr_vib}g",
                f"करंट: {curr_curr}A | ध्वनि: {curr_sound}dB",
                f"विभाग: {baseline['location']} | रेटेड पावर: {baseline.get('power', 'KW')}"
            ]
            prescriptive_steps = [
                "नियमित अंतराल पर लाइव टेलीमेट्री पर नजर रखें।"
            ]

    # -------------------------------------------------------------
    # 3. ENGLISH RESPONSE SYNTHESIS (Default)
    # -------------------------------------------------------------
    else:
        if intent == "create_work_order":
            reply_text = (
                f"A corrective maintenance work order ticket for {machine_id} ({baseline['name']}) "
                f"has been logged into SQLite Table 5 (maintenance_logs). Risk status: {risk_level}."
            )
            bullets = [
                f"Machine: {machine_id} - {baseline['name']}",
                f"Diagnosed Fault: {root_cause}",
                f"Primary Trigger: {top_sensor} (+{top_dev:.1f}% deviation)",
                f"Priority: {risk_level} | Estimated Repair Time: 2.0 hrs"
            ]
            prescriptive_steps = [
                "Enforce Lockout/Tagout (LOTO) on main 415V electrical isolator switch.",
                "Inspect spindle/drive bearing housing with acoustic stethoscopic probe.",
                "Replenish with ISO VG 220 high-temperature synthetic grease."
            ]
        elif intent == "prescriptive_sop":
            sop = TEXTILE_SOPS[0] if "vib" in top_sensor.lower() or "bear" in root_cause.lower() else TEXTILE_SOPS[1]
            reply_text = (
                f"Standard Operating Procedure for {machine_id}: {sop['title_en']} ({sop['sop_id']})."
            )
            bullets = [
                f"Category: {sop['category']}",
                f"Target Equipment: {sop['machine_type']}",
                f"Threshold Trigger: {sop['frequency']}"
            ]
            prescriptive_steps = sop["steps_en"]
        elif intent in ["xai_explanation", "machine_diagnosis"]:
            if is_at_risk:
                reply_text = (
                    f"Alert: Machine {machine_id} ({baseline['name']}) is operating at {risk_level} risk! "
                    f"Explainable AI (XAI) analysis shows {top_sensor} is {top_dev:+.1f}% above rated baseline "
                    f"({curr_vib if top_sensor == 'Vibration' else curr_temp} vs {baseline['vib'] if top_sensor == 'Vibration' else baseline['temp']} normal), "
                    f"diagnosed as '{root_cause}'."
                )
            else:
                reply_text = (
                    f"Machine {machine_id} ({baseline['name']}) is operating normally. "
                    f"All mechanical and electrical sensor channels are within healthy tolerance bands (±15%)."
                )
            bullets = [
                f"Vibration RMS: {curr_vib}g (Baseline: {baseline['vib']}g)",
                f"Stator Temp: {curr_temp}°C (Baseline: {baseline['temp']}°C)",
                f"Current Draw: {curr_curr}A (Baseline: {baseline['current']}A)",
                f"Acoustic Noise: {curr_sound}dB (Baseline: {baseline['sound']}dB)"
            ]
            prescriptive_steps = [
                "Inspect drive bearing housing during scheduled shift pause.",
                "Clear fiber lint from motor cooling cowl and stator heat fins.",
                "Verify shaft laser alignment to ensure vibration remains < 0.45g."
            ]
        else:
            reply_text = (
                f"Real-time operating telemetry and asset status for {machine_id} ({baseline['name']}):"
            )
            bullets = [
                f"Temperature: {curr_temp}°C | Vibration: {curr_vib}g",
                f"Current Draw: {curr_curr}A | Sound Level: {curr_sound}dB",
                f"Floor Location: {baseline['location']} | Status: {risk_level}"
            ]
            prescriptive_steps = [
                "Continue standard operating schedule; live readings are streaming every 5 seconds."
            ]

    # Structure Work Order Recommendation if at risk
    if is_at_risk or intent == "create_work_order":
        work_order = {
            "machine_id": machine_id,
            "problem_title": f"{root_cause} Detected on {machine_id}",
            "possible_cause": f"{top_sensor} is elevated by +{top_dev:.1f}% above rated baseline.",
            "recommended_action": prescriptive_steps[0] if prescriptive_steps else "Inspect equipment",
            "priority_level": "Critical" if risk_level == "Critical" else "High",
            "estimated_repair_time_hrs": 2.5,
            "estimated_repair_cost_inr": 2400.0
        }

    response_payload = {
        "user_query": query,
        "language": language,
        "intent_detected": intent,
        "confidence_score": confidence,
        "machine_id": machine_id,
        "machine_name": baseline["name"],
        "reply_text": reply_text,
        "technical_bullets": bullets,
        "prescriptive_steps": prescriptive_steps,
        "work_order": work_order,
        "created_at": datetime.utcnow().isoformat()
    }

    # Persist to SQLite Table 8: chat_history
    if os.path.exists(DB_PATH):
        try:
            conn = sqlite3.connect(DB_PATH)
            cursor = conn.cursor()
            cursor.execute(
                """
                INSERT INTO chat_history 
                (user_id, machine_id, user_query, bot_response, intent_detected, confidence_score, timestamp)
                VALUES (?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    user_id,
                    machine_id,
                    query,
                    reply_text,
                    intent,
                    confidence,
                    datetime.utcnow().isoformat()
                )
            )
            # If work order creation requested, insert into maintenance_logs
            if intent == "create_work_order" and work_order:
                cursor.execute(
                    """
                    INSERT INTO maintenance_logs
                    (machine_id, problem_title, possible_cause, recommended_action, priority_level, estimated_repair_time_hrs, estimated_repair_cost_inr, status, assigned_technician)
                    VALUES (?, ?, ?, ?, ?, ?, ?, 'Pending', 'S. Ramanathan')
                    """,
                    (
                        machine_id,
                        work_order["problem_title"],
                        work_order["possible_cause"],
                        work_order["recommended_action"],
                        work_order["priority_level"],
                        work_order["estimated_repair_time_hrs"],
                        work_order["estimated_repair_cost_inr"]
                    )
                )
            conn.commit()
            conn.close()
        except Exception as e:
            print(f"[!] Warning: failed to persist chat history to SQLite: {e}")

    return response_payload


def get_chat_history(limit: int = 15) -> List[Dict[str, Any]]:
    """Retrieve recent chat history records from SQLite database."""
    if not os.path.exists(DB_PATH):
        return []

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute(
        """
        SELECT id, user_id, machine_id, user_query, bot_response, intent_detected, confidence_score, timestamp
        FROM chat_history
        ORDER BY timestamp DESC
        LIMIT ?
        """,
        (limit,)
    )
    rows = cursor.fetchall()
    conn.close()

    history = []
    for r in rows:
        history.append({
            "id": r[0],
            "user_id": r[1],
            "machine_id": r[2],
            "user_query": r[3],
            "bot_response": r[4],
            "intent_detected": r[5],
            "confidence_score": r[6],
            "timestamp": r[7]
        })
    return history


def log_manual_work_order(
    machine_id: str,
    problem_title: str,
    possible_cause: str,
    recommended_action: str,
    priority: str = "Medium",
    repair_time_hrs: float = 2.0,
    repair_cost_inr: float = 1500.0,
    technician: str = "S. Ramanathan"
) -> Dict[str, Any]:
    """Manually create a work order record into SQLite Table 5 (maintenance_logs)."""
    if not os.path.exists(DB_PATH):
        return {"status": "error", "message": "Database not found"}

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute(
        """
        INSERT INTO maintenance_logs
        (machine_id, problem_title, possible_cause, recommended_action, priority_level, estimated_repair_time_hrs, estimated_repair_cost_inr, status, assigned_technician)
        VALUES (?, ?, ?, ?, ?, ?, ?, 'Pending', ?)
        """,
        (
            machine_id,
            problem_title,
            possible_cause,
            recommended_action,
            priority,
            repair_time_hrs,
            repair_cost_inr,
            technician
        )
    )
    log_id = cursor.lastrowid
    conn.commit()
    conn.close()

    return {
        "status": "success",
        "work_order_id": log_id,
        "machine_id": machine_id,
        "problem_title": problem_title,
        "priority_level": priority,
        "estimated_repair_cost_inr": repair_cost_inr,
        "assigned_technician": technician,
        "created_at": datetime.utcnow().isoformat()
    }


if __name__ == "__main__":
    print("[*] Testing Multilingual Maintenance Co-Pilot Engine...")
    
    # English Query
    res_en = generate_multilingual_response(
        query="Why is Loom WVE-03 vibrating? What bearing should I inspect?",
        machine_id="WVE-03",
        language="en"
    )
    print(f"\n[EN Response] {res_en['reply_text']}")
    
    # Tamil Query
    res_ta = generate_multilingual_response(
        query="WVE-03 நெசவு தறியில் அதிக அதிர்வு ஏன்? பழுது நீக்கம் என்ன?",
        machine_id="WVE-03",
        language="ta"
    )
    print(f"\n[TA Response] {res_ta['reply_text']}")
    
    # Hindi Query
    res_hi = generate_multilingual_response(
        query="लूम WVE-03 में अधिक कंपन क्यों आ रहा है? मुझे क्या करना चाहिए?",
        machine_id="WVE-03",
        language="hi"
    )
    print(f"\n[HI Response] {res_hi['reply_text']}")
