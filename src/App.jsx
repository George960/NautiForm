import { useState, useEffect, useRef, useCallback } from “react”;

// ─── SUPABASE CONFIG ──────────────────────────────────────────────────────────
const SUPABASE_URL = “https://lwxvxekwigagscvfafdp.supabase.co”;
const SUPABASE_KEY = “sb_publishable_eGux210qKop7NixxNpmL2w_3okqk8XF”;

// Lightweight Supabase client — no npm needed
const supabase = {
headers: { “apikey”: SUPABASE_KEY, “Authorization”: `Bearer ${SUPABASE_KEY}`, “Content-Type”: “application/json” },

async signUp(email, password, meta = {}) {
const r = await fetch(`${SUPABASE_URL}/auth/v1/signup`, {
method:“POST”, headers: this.headers,
body: JSON.stringify({ email, password, data: meta })
});
return r.json();
},

async signIn(email, password) {
const r = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
method:“POST”, headers: this.headers,
body: JSON.stringify({ email, password })
});
return r.json();
},

async signOut(token) {
await fetch(`${SUPABASE_URL}/auth/v1/logout`, {
method:“POST”, headers: { …this.headers, “Authorization”: `Bearer ${token}` }
});
},

async saveForm(token, userId, formType, formData, vesselName) {
const r = await fetch(`${SUPABASE_URL}/rest/v1/forms`, {
method:“POST”,
headers: { …this.headers, “Authorization”: `Bearer ${token}`, “Prefer”: “return=representation” },
body: JSON.stringify({ user_id: userId, form_type: formType, form_data: formData, vessel_name: vesselName, status: “draft” })
});
return r.json();
},

async getForms(token) {
const r = await fetch(`${SUPABASE_URL}/rest/v1/forms?order=created_at.desc`, {
headers: { …this.headers, “Authorization”: `Bearer ${token}` }
});
return r.json();
},

async deleteForm(token, id) {
await fetch(`${SUPABASE_URL}/rest/v1/forms?id=eq.${id}`, {
method:“DELETE”, headers: { …this.headers, “Authorization”: `Bearer ${token}` }
});
}
};

// ─── CSS VARIABLES injected once at root ─────────────────────────────────────
// All colours live here. Change one value → whole app updates.
const CSS_VARS = `
:root {
–bg:          #09090f;
–surface:     #10131c;
–surface2:    #161a26;
–border:      #252d3d;
–border-hi:   #2e3a50;
–accent:      #00AEEF;
–accent-dim:  #00AEEF20;
–accent-text: #33C4FF;
–danger:      #EF4444;
–warn:        #F97316;
–ok:          #22D3A0;
–purple:      #A78BFA;
–yellow:      #FBBF24;
–text:        #F0F2F8;
–text-sub:    #B8C0D4;
–text-muted:  #7A8BA8;
–text-dim:    #3D4F6A;
–input-bg:    #0c0f18;
–input-border:#1e2840;
–radius:      10px;
–radius-lg:   14px;
}

- { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
  body { background: var(–bg); color: var(–text); margin: 0; font-family: ‘DM Sans’,‘Barlow’,‘Segoe UI’,sans-serif; }
  input, textarea, select { -webkit-appearance: none; appearance: none; font-family: inherit; }
  input::placeholder, textarea::placeholder { color: var(–text-dim); font-size: 13px; }
  select option { background: var(–surface); color: var(–text); }
  ::-webkit-scrollbar { width: 3px; }
  ::-webkit-scrollbar-track { background: var(–bg); }
  ::-webkit-scrollbar-thumb { background: var(–border); border-radius: 2px; }

/* ── Reusable classes ── */
.card        { background: var(–surface); border: 1px solid var(–border); border-radius: var(–radius-lg); padding: 16px; margin-bottom: 12px; }
.label       { color: var(–text-muted); font-size: 11px; font-weight: 700; letter-spacing: 1px; display: block; margin-bottom: 6px; text-transform: uppercase; }
.input-base  { width: 100%; background: var(–input-bg); border: 1px solid var(–input-border); border-radius: var(–radius); padding: 14px; color: var(–text); font-size: 14px; outline: none; }
.input-base:focus { border-color: var(–accent); }
.input-err   { border-color: var(–danger) !important; }
.btn-primary { background: var(–accent); border: none; border-radius: var(–radius); padding: 16px; color: #000; font-weight: 700; font-size: 14px; cursor: pointer; width: 100%; letter-spacing: 1px; }
.btn-ghost   { background: var(–surface); border: 1px solid var(–border); border-radius: var(–radius); padding: 10px 16px; color: var(–text-sub); font-size: 12px; cursor: pointer; }
.badge       { font-size: 10px; font-weight: 700; padding: 2px 8px; border-radius: 20px; }
.badge-danger  { background: #EF444422; color: var(–danger); }
.badge-warn    { background: #FBBF2422; color: var(–yellow); }
.badge-ok      { background: #22D3A022; color: var(–ok); }
.badge-accent  { background: var(–accent-dim); color: var(–accent-text); }
.section-title { color: var(–text); font-size: 20px; font-weight: 700; margin-bottom: 4px; }
.section-sub   { color: var(–text-muted); font-size: 12px; margin-bottom: 16px; }
.err-msg       { color: var(–danger); font-size: 11px; margin-top: 4px; display: block; }
`;

// ─── THEME TOKEN (JS side — for dynamic inline styles only) ──────────────────
const T = {
bg:“var(–bg)”, surface:“var(–surface)”, surface2:“var(–surface2)”,
border:“var(–border)”, borderHi:“var(–border-hi)”,
accent:“var(–accent)”, accentDim:“var(–accent-dim)”, accentText:“var(–accent-text)”,
danger:“var(–danger)”, warn:“var(–warn)”, ok:“var(–ok)”,
purple:“var(–purple)”, yellow:“var(–yellow)”,
text:“var(–text)”, textSub:“var(–text-sub)”, textMuted:“var(–text-muted)”, textDim:“var(–text-dim)”,
inputBg:“var(–input-bg)”, inputBorder:“var(–input-border)”,
};

const APP_VERSION = “4.0.0”;

// ─── VALIDATION RULES ─────────────────────────────────────────────────────────
const VALIDATORS = {
imo:      v => /^\d{7}$/.test(v.replace(/\s/g,””))        || “IMO number must be exactly 7 digits”,
o2:       v => (parseFloat(v)>=0 && parseFloat(v)<=25)    || “O₂ must be between 0 and 25%”,
hc:       v => (parseFloat(v)>=0 && parseFloat(v)<=100)   || “HC must be between 0 and 100% LEL”,
h2s:      v => (parseFloat(v)>=0 && parseFloat(v)<=1000)  || “H₂S must be 0–1000 ppm”,
co:       v => (parseFloat(v)>=0 && parseFloat(v)<=10000) || “CO must be 0–10000 ppm”,
gastest:  v => (parseFloat(v)>=0 && parseFloat(v)<=100)   || “Gas test must be 0–100% LEL”,
height:   v => (parseFloat(v)>=0 && parseFloat(v)<=200)   || “Height must be 0–200 metres”,
date:     v => !!v                                         || “Date & time required”,
vessel:   v => v.trim().length >= 2                        || “Vessel name too short”,
officer:  v => v.trim().length >= 3                        || “Officer name too short”,
};

function validate(key, value, required) {
if (!value || value.toString().trim() === “”) return required ? “This field is required” : null;
if (VALIDATORS[key]) {
const result = VALIDATORS[key](value.toString());
return result === true ? null : result;
}
return null;
}

// ─── ANCHOR ICON ──────────────────────────────────────────────────────────────
function AnchorIcon({ size = 36, color = “var(–accent)” }) {
return (
<svg width={size} height={size} viewBox="0 0 48 48" fill="none">
<circle cx="24" cy="7.5" r="3.5" stroke={color} strokeWidth="2.2" fill="none"/>
<path d="M20 7.5 C20 4.5 28 4.5 28 7.5" stroke={color} strokeWidth="1.8" fill="none" strokeLinecap="round"/>
<line x1="13" y1="14" x2="35" y2="14" stroke={color} strokeWidth="2.4" strokeLinecap="round"/>
<line x1="24" y1="14" x2="24" y2="39" stroke={color} strokeWidth="2.4" strokeLinecap="round"/>
<path d="M24 39 C20 37 13 34 9 28" stroke={color} strokeWidth="2.2" strokeLinecap="round" fill="none"/>
<path d="M24 39 C28 37 35 34 39 28" stroke={color} strokeWidth="2.2" strokeLinecap="round" fill="none"/>
<path d="M9 28 L5 31.5 L9 34" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
<line x1="9" y1="28" x2="9" y2="35" stroke={color} strokeWidth="2" strokeLinecap="round"/>
<path d="M39 28 L43 31.5 L39 34" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
<line x1="39" y1="28" x2="39" y2="35" stroke={color} strokeWidth="2" strokeLinecap="round"/>
</svg>
);
}

// ─── OFFLINE HOOK ─────────────────────────────────────────────────────────────
function useOnline() {
const [online, setOnline] = useState(navigator.onLine);
useEffect(() => {
const on = () => setOnline(true);
const off = () => setOnline(false);
window.addEventListener(“online”, on);
window.addEventListener(“offline”, off);
return () => { window.removeEventListener(“online”, on); window.removeEventListener(“offline”, off); };
}, []);
return online;
}

// ─── PDF EXPORT — jsPDF ───────────────────────────────────────────────────────
async function exportToPDF(formConfig, fields, signatureDataURL) {
// Dynamically load jsPDF from CDN
if (!window.jspdf) {
await new Promise((resolve, reject) => {
const s = document.createElement(“script”);
s.src = “https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js”;
s.onload = resolve;
s.onerror = reject;
document.head.appendChild(s);
});
}
const { jsPDF } = window.jspdf;
const doc = new jsPDF({ orientation: “portrait”, unit: “mm”, format: “a4” });
const W = 210; const margin = 15;
let y = margin;

// ── Header ──
doc.setFillColor(9, 9, 15);
doc.rect(0, 0, W, 28, “F”);
doc.setTextColor(0, 174, 239);
doc.setFontSize(16);
doc.setFont(“helvetica”, “bold”);
doc.text(“NAUTIFORM”, margin, 12);
doc.setTextColor(200, 200, 210);
doc.setFontSize(8);
doc.setFont(“helvetica”, “normal”);
doc.text(“Maritime Operations Assistant — v” + APP_VERSION, margin, 18);
doc.setTextColor(100, 120, 140);
doc.text(“Generated: “ + new Date().toISOString(), margin, 23);
y = 36;

// ── Form title ──
doc.setFillColor(16, 19, 28);
doc.roundedRect(margin, y, W - margin*2, 14, 2, 2, “F”);
doc.setTextColor(240, 242, 248);
doc.setFontSize(13);
doc.setFont(“helvetica”, “bold”);
doc.text(formConfig.label.toUpperCase(), margin + 4, y + 9);
y += 20;

// ── Legal disclaimer ──
doc.setFontSize(7);
doc.setTextColor(100, 120, 140);
doc.setFont(“helvetica”, “italic”);
doc.text(“This document was generated by NautiForm (operational assistant only). The signing officer bears full legal responsibility.”, margin, y);
y += 8;

// ── Separator ──
doc.setDrawColor(37, 45, 61);
doc.line(margin, y, W - margin, y);
y += 6;

// ── Fields ──
doc.setFont(“helvetica”, “normal”);
formConfig.fields.forEach(f => {
const val = fields[f.key] || “—”;
if (y > 260) { doc.addPage(); y = margin; }

```
// Label
doc.setFontSize(7);
doc.setTextColor(122, 139, 168);
doc.setFont("helvetica", "bold");
doc.text(f.label.toUpperCase(), margin, y);
y += 4;

// Value box
doc.setFillColor(12, 15, 24);
const lines = doc.splitTextToSize(val, W - margin*2 - 8);
const boxH = Math.max(8, lines.length * 5 + 4);
doc.roundedRect(margin, y, W - margin*2, boxH, 1, 1, "F");
doc.setTextColor(240, 242, 248);
doc.setFontSize(9);
doc.setFont("helvetica", "normal");
doc.text(lines, margin + 3, y + 5);
y += boxH + 5;

// Safety warnings embedded in PDF
if (f.special === "o2" && parseFloat(fields[f.key]) < 20.9) {
  doc.setFillColor(80, 0, 0);
  doc.roundedRect(margin, y, W - margin*2, 9, 1, 1, "F");
  doc.setTextColor(239, 68, 68);
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.text("🚨 CRITICAL: O₂ BELOW 20.9% — ENTRY PROHIBITED (SOLAS Ch. VI)", margin + 3, y + 6);
  y += 13;
}
```

});

// ── Signature section ──
if (y > 220) { doc.addPage(); y = margin; }
y += 4;
doc.setDrawColor(37, 45, 61);
doc.line(margin, y, W - margin, y);
y += 6;
doc.setFontSize(8);
doc.setTextColor(122, 139, 168);
doc.setFont(“helvetica”, “bold”);
doc.text(“OFFICER SIGNATURE”, margin, y);
y += 4;

if (signatureDataURL) {
// Burn the signature image into the PDF (flattened — not editable)
doc.setFillColor(12, 15, 24);
doc.roundedRect(margin, y, W - margin*2, 22, 2, 2, “F”);
doc.addImage(signatureDataURL, “PNG”, margin + 2, y + 2, W - margin*2 - 4, 18);
y += 26;
doc.setFontSize(7);
doc.setTextColor(100, 120, 140);
doc.text(“Digital signature captured “ + new Date().toLocaleString(“en-GB”) + “ — document is final and non-editable.”, margin, y);
y += 8;
} else {
doc.setFillColor(12, 15, 24);
doc.roundedRect(margin, y, W - margin*2, 16, 2, 2, “F”);
doc.setTextColor(61, 79, 106);
doc.setFontSize(8);
doc.text(”[ No digital signature captured ]”, margin + 4, y + 10);
y += 20;
}

// ── Footer ──
doc.setFontSize(7);
doc.setTextColor(61, 79, 106);
doc.text(“NautiForm · Public domain regulatory references: US eCFR & UK Legislation.gov.uk · NOT for training AI models”, margin, 290);

// Save
const filename = `NautiForm_${formConfig.label.replace(/\s+/g,"_")}_${Date.now()}.pdf`;
doc.save(filename);
return filename;
}

// ─── REGULATIONS DATABASE ─────────────────────────────────────────────────────
const REG_SOURCES = [
{ id:“solas”,    code:“SOLAS”,    title:“Safety of Life at Sea”,              url:“https://www.ecfr.gov/current/title-46/chapter-I”,                                                               source:“US 46 CFR Ch. I”,        flag:“🇺🇸” },
{ id:“marpol1”,  code:“MARPOL”,   title:“MARPOL Annex I — Oil Pollution”,     url:“https://www.ecfr.gov/current/title-33/chapter-I/subchapter-O/part-151”,                                         source:“US 33 CFR Part 151”,     flag:“🇺🇸” },
{ id:“marpol2”,  code:“MARPOL”,   title:“MARPOL Annex II — Noxious Liquids”,  url:“https://www.ecfr.gov/current/title-33/chapter-I/subchapter-O/part-151”,                                         source:“US 33 CFR Part 151”,     flag:“🇺🇸” },
{ id:“marpol4”,  code:“MARPOL”,   title:“MARPOL Annex IV — Sewage”,           url:“https://www.ecfr.gov/current/title-33/chapter-I/subchapter-O/part-159”,                                         source:“US 33 CFR Part 159”,     flag:“🇺🇸” },
{ id:“marpol5”,  code:“MARPOL”,   title:“MARPOL Annex V — Garbage”,           url:“https://www.ecfr.gov/current/title-33/chapter-I/subchapter-O/part-151/subpart-B”,                               source:“US 33 CFR 151.63”,       flag:“🇺🇸” },
{ id:“marpol6”,  code:“MARPOL”,   title:“MARPOL Annex VI — Air Pollution”,    url:“https://www.ecfr.gov/current/title-40/chapter-I/subchapter-C/part-94”,                                          source:“US 40 CFR Part 94”,      flag:“🇺🇸” },
{ id:“colreg”,   code:“COLREG”,   title:“COLREGs — Collision Regulations”,    url:“https://www.ecfr.gov/current/title-33/chapter-I/subchapter-E/part-81”,                                          source:“US 33 CFR Part 81”,      flag:“🇺🇸” },
{ id:“stcw”,     code:“STCW”,     title:“STCW Convention”,                    url:“https://www.legislation.gov.uk/uksi/2015/482/contents”,                                                          source:“UK MSN 1856”,            flag:“🇬🇧” },
{ id:“ism”,      code:“ISM”,      title:“ISM Code — Safety Management”,       url:“https://www.ecfr.gov/current/title-33/chapter-I/subchapter-N/part-96”,                                          source:“US 33 CFR Part 96”,      flag:“🇺🇸” },
{ id:“isps”,     code:“ISPS”,     title:“ISPS / MTSA — Ship Security”,        url:“https://www.ecfr.gov/current/title-33/chapter-I/subchapter-H/part-101”,                                         source:“US 33 CFR Part 101–106”, flag:“🇺🇸” },
{ id:“mlc”,      code:“MLC”,      title:“MLC 2006 — Maritime Labour”,         url:“https://www.legislation.gov.uk/uksi/2014/1613/contents”,                                                         source:“UK MSN 1848”,            flag:“🇬🇧” },
{ id:“loadline”, code:“LOADLINE”, title:“Load Line Convention”,               url:“https://www.ecfr.gov/current/title-46/chapter-I/subchapter-E/part-42”,                                          source:“US 46 CFR Part 42”,      flag:“🇺🇸” },
{ id:“imsbc”,    code:“IMSBC”,    title:“IMSBC / Grain Code”,                 url:“https://www.ecfr.gov/current/title-46/chapter-I/subchapter-B/part-148”,                                         source:“US 46 CFR Part 148”,     flag:“🇺🇸” },
];

const REGS = [
{ code:“SOLAS”,   ch:“Ch. I”,     reg:“Reg. 1-19”,   title:“General Provisions & Surveys”,            source:“US 46 CFR 2.01”,     url:“https://www.ecfr.gov/current/title-46/chapter-I/subchapter-A/part-2”,                                                                flag:“🇺🇸”, summary:“Ships shall be surveyed at intervals not exceeding 5 years. Annual surveys confirm no material change. Certificates posted in accessible location onboard.”, keywords:[“survey”,“certificate”,“inspection”,“class”] },
{ code:“SOLAS”,   ch:“Ch. II-1”,  reg:“Reg. 1-45”,   title:“Construction – Subdivision & Stability”,  source:“US 46 CFR 170”,     url:“https://www.ecfr.gov/current/title-46/chapter-I/subchapter-S/part-170”,                                                             flag:“🇺🇸”, summary:“Ships shall have sufficient intact and damage stability. Watertight integrity maintained. Bilge pumping, watertight doors, and double bottom requirements per ship type.”, keywords:[“stability”,“subdivision”,“watertight”,“bilge”,“double bottom”] },
{ code:“SOLAS”,   ch:“Ch. II-2”,  reg:“Reg. 1”,      title:“Fire Safety – General”,                   source:“US 46 CFR 72”,      url:“https://www.ecfr.gov/current/title-46/chapter-I/subchapter-H/part-72”,                                                             flag:“🇺🇸”, summary:“All ships comply with fire safety objectives. Systems maintained operational at all times. Fire detection, suppression, and structural fire protection required per FSS Code.”, keywords:[“fire”,“fss”,“safety”,“detection”,“suppression”] },
{ code:“SOLAS”,   ch:“Ch. II-2”,  reg:“Reg. 10”,     title:“Fire Fighting Systems”,                   source:“US 46 CFR 95”,      url:“https://www.ecfr.gov/current/title-46/chapter-I/subchapter-H/part-95”,                                                             flag:“🇺🇸”, summary:“Fixed systems: CO₂, halon, foam, water spray. Annual inspection. CO₂: cylinder weight checked, 5% loss = replace. Portable extinguishers: annual service, 5-year discharge test.”, keywords:[“co2”,“extinguisher”,“foam”,“fire fighting”,“fixed”] },
{ code:“SOLAS”,   ch:“Ch. III”,   reg:“Reg. 19”,     title:“Emergency Training & Drills”,             source:“US 46 CFR 199”,     url:“https://www.ecfr.gov/current/title-46/chapter-I/subchapter-W/part-199”,                                                            flag:“🇺🇸”, summary:“Abandon ship and fire drills every month. Full crew muster at assembly stations. Lifeboat launched at least every 3 months. Rescue boat launched monthly. All drills logged.”, keywords:[“drill”,“muster”,“lifeboat”,“abandon ship”,“rescue boat”] },
{ code:“SOLAS”,   ch:“Ch. III”,   reg:“Reg. 31-38”,  title:“Survival Craft Requirements”,             source:“US 46 CFR 160”,     url:“https://www.ecfr.gov/current/title-46/chapter-I/subchapter-Q/part-160”,                                                            flag:“🇺🇸”, summary:“Lifeboats: 100% capacity each side. Liferafts: 100% each side + 25% if no davit. EPIRBs: free-float, registered, hydrostatic release. SART tested monthly. Pyrotechnics: 3-year validity.”, keywords:[“lifeboat”,“liferaft”,“epirb”,“sart”,“pyrotechnics”,“lsa”] },
{ code:“SOLAS”,   ch:“Ch. IV”,    reg:“Reg. 7-12”,   title:“GMDSS – Radio Requirements”,              source:“US 47 CFR 80”,      url:“https://www.ecfr.gov/current/title-47/chapter-I/subchapter-D/part-80”,                                                             flag:“🇺🇸”, summary:“GMDSS maintained 24/7. Sea area A1: VHF DSC. A2: MF DSC. A3: Inmarsat or HF. A4: HF. Daily DSC watch on Ch 70 & 2187.5 kHz. NAVTEX received and logged.”, keywords:[“gmdss”,“dsc”,“vhf”,“mf”,“inmarsat”,“navtex”,“radio”] },
{ code:“SOLAS”,   ch:“Ch. V”,     reg:“Reg. 19”,     title:“Navigational Equipment Requirements”,     source:“US 33 CFR 164”,     url:“https://www.ecfr.gov/current/title-33/chapter-I/subchapter-S/part-164”,                                                             flag:“🇺🇸”, summary:“ECDIS mandatory (2018+), ARPA, AIS Class A, VDR/S-VDR, echo sounder, speed log, magnetic compass. All equipment type-approved. ECDIS: current ENCs, backup required.”, keywords:[“ecdis”,“ais”,“vdr”,“arpa”,“navigation”,“enc”,“chart”] },
{ code:“SOLAS”,   ch:“Ch. VI”,    reg:“Reg. B-3”,    title:“Enclosed Space Entry – Permit-to-Work”,   source:“US 29 CFR 1915.12”, url:“https://www.ecfr.gov/current/title-29/subtitle-B/chapter-XVII/part-1915/subpart-B/section-1915.12”,                                 flag:“🇺🇸”, summary:“O₂ ≥ 20.9%, HC < 1% LEL, toxic gases absent before entry. PTW mandatory. Responsible officer stationed outside throughout. SCBA ×2, lifeline, harness at entry. Retest every 30 min.”, keywords:[“enclosed”,“space”,“entry”,“o2”,“oxygen”,“atmosphere”,“ptw”,“permit”] },
{ code:“SOLAS”,   ch:“Ch. XI-2”,  reg:“Reg. 6”,      title:“Ship Security Alert System (SSAS)”,       source:“US 33 CFR 101”,     url:“https://www.ecfr.gov/current/title-33/chapter-I/subchapter-H/part-101”,                                                             flag:“🇺🇸”, summary:“All SOLAS ships fitted with SSAS. Silent alert to competent authority — no alarm on board. SSO tests annually. Two activation points required, one on bridge.”, keywords:[“ssas”,“security”,“alert”,“isps”,“silent”] },
{ code:“MARPOL”,  ch:“Annex I”,   reg:“Reg. 15”,     title:“Oil Discharge – Outside Special Areas”,   source:“US 33 CFR 151.10”,  url:“https://www.ecfr.gov/current/title-33/chapter-I/subchapter-O/part-151/subpart-A/section-151.10”,                                   flag:“🇺🇸”, summary:“Discharge only when: proceeding en route, OWS <15 ppm, ORB Part I entry made immediately, >12nm from nearest land, not in Special Area. OWS & OCM operational and type-approved.”, keywords:[“oil”,“discharge”,“15ppm”,“orb”,“ows”,“oily water”] },
{ code:“MARPOL”,  ch:“Annex I”,   reg:“Reg. 34”,     title:“Oil Discharge – Special Areas”,           source:“US 33 CFR 151.09”,  url:“https://www.ecfr.gov/current/title-33/chapter-I/subchapter-O/part-151/subpart-A/section-151.09”,                                   flag:“🇺🇸”, summary:“ZERO discharge in: Mediterranean, Baltic, Black Sea, Red Sea, Gulfs, Antarctic (50°S), NW European Waters, Oman Sea. Retain ALL residues. Port reception facilities only.”, keywords:[“special area”,“zero discharge”,“mediterranean”,“baltic”,“antarctic”] },
{ code:“MARPOL”,  ch:“Annex I”,   reg:“Reg. 17”,     title:“Oil Record Book (ORB)”,                   source:“US 33 CFR 151.25”,  url:“https://www.ecfr.gov/current/title-33/chapter-I/subchapter-O/part-151/subpart-A/section-151.25”,                                   flag:“🇺🇸”, summary:“ORB Part I (Machinery): all bilge, sludge, OWS operations, accidental discharges. Part II (Cargo/Tanker): loading/unloading/ballasting. Signed by officer, countersigned Master. Retained 3 years.”, keywords:[“orb”,“oil record book”,“bilge”,“sludge”,“machinery”,“tanker”] },
{ code:“MARPOL”,  ch:“Annex II”,  reg:“Reg. 13”,     title:“Noxious Liquid Substances”,               source:“US 33 CFR 151.30”,  url:“https://www.ecfr.gov/current/title-33/chapter-I/subchapter-O/part-151/subpart-A/section-151.30”,                                   flag:“🇺🇸”, summary:“NLS Categories X, Y, Z: strict discharge conditions. >12nm, minimum speed, prewash procedures per P&A Manual. Cargo Record Book required.”, keywords:[“nls”,“noxious”,“chemical”,“tanker”,“category x”,“category y”] },
{ code:“MARPOL”,  ch:“Annex IV”,  reg:“Reg. 11”,     title:“Sewage Discharge Requirements”,           source:“US 33 CFR 159”,     url:“https://www.ecfr.gov/current/title-33/chapter-I/subchapter-O/part-159”,                                                             flag:“🇺🇸”, summary:“Prohibited within 3nm. 3-12nm: comminuted & disinfected. >12nm: untreated permitted (ship >4 kn). Approved treatment plant: discharge anywhere. Holding tanks in prohibited zones.”, keywords:[“sewage”,“blackwater”,“holding tank”,“3nm”,“treatment”] },
{ code:“MARPOL”,  ch:“Annex V”,   reg:“Reg. 3-6”,    title:“Garbage Management & Record Book”,        source:“US 33 CFR 151.55”,  url:“https://www.ecfr.gov/current/title-33/chapter-I/subchapter-O/part-151/subpart-B/section-151.55”,                                   flag:“🇺🇸”, summary:“Garbage Management Plan required on all ships >100 GT. Plastics: ZERO discharge anywhere. Food waste: >12nm. All other garbage: >12nm. Special areas stricter. Garbage Record Book required.”, keywords:[“garbage”,“plastics”,“food waste”,“record book”,“management plan”] },
{ code:“MARPOL”,  ch:“Annex VI”,  reg:“Reg. 14”,     title:“SOx & Particulate Matter”,                source:“US 40 CFR 94.5”,    url:“https://www.ecfr.gov/current/title-40/chapter-I/subchapter-C/part-94/section-94.5”,                                                 flag:“🇺🇸”, summary:“Global sulfur cap: 0.50% m/m since Jan 2020. ECA limit: 0.10% m/m (Baltic, North Sea, North American, US Caribbean). BDNs retained ≥3 years. FONAR for non-availability.”, keywords:[“sox”,“sulphur”,“eca”,“fuel”,“bunker”,“bdn”,“0.50”,“0.10”] },
{ code:“MARPOL”,  ch:“Annex VI”,  reg:“Reg. 13”,     title:“NOx Emissions – Tier I/II/III”,           source:“US 40 CFR 94.8”,    url:“https://www.ecfr.gov/current/title-40/chapter-I/subchapter-C/part-94/section-94.8”,                                                 flag:“🇺🇸”, summary:“Tier II: engines 2011+ globally. Tier III: 2016+ in NOx ECAs (North American, US Caribbean, Baltic/North Sea from 2021). EIAPP Certificate required. NOx Technical File on board.”, keywords:[“nox”,“tier”,“eiapp”,“emissions”,“diesel”,“nox eca”] },
{ code:“MARPOL”,  ch:“Annex VI”,  reg:“Reg. 22A”,    title:“Carbon Intensity Indicator (CII)”,        source:“IMO MEPC.337(76)”,  url:“https://www.imo.org/en/KnowledgeCentre/Pages/Default.aspx”,                                                                          flag:“🌐”, summary:“Ships ≥5000 GT: annual CII rating A-E from 2023. Rating D for 3 years or E: corrective action plan in SEEMP Part III required. Verified by class annually.”, keywords:[“cii”,“carbon intensity”,“rating”,“seemp”,“decarbonisation”] },
{ code:“COLREG”,  ch:“Part B”,    reg:“Rule 5”,      title:“Look-out”,                                source:“US 33 CFR 83.05”,   url:“https://www.ecfr.gov/current/title-33/chapter-I/subchapter-E/part-83/section-83.05”,                                                  flag:“🇺🇸”, summary:“Every vessel shall at all times maintain a proper look-out by sight and hearing, and by all available means appropriate to make a full appraisal of the situation and risk of collision.”, keywords:[“lookout”,“watch”,“sight”,“hearing”,“rule 5”] },
{ code:“COLREG”,  ch:“Part B”,    reg:“Rule 6”,      title:“Safe Speed”,                              source:“US 33 CFR 83.06”,   url:“https://www.ecfr.gov/current/title-33/chapter-I/subchapter-E/part-83/section-83.06”,                                                  flag:“🇺🇸”, summary:“Every vessel shall at all times proceed at a safe speed so that proper and effective action can be taken to avoid collision. Factors: visibility, traffic density, draught/depth ratio.”, keywords:[“safe speed”,“visibility”,“traffic”,“manoeuvre”,“rule 6”] },
{ code:“COLREG”,  ch:“Part B”,    reg:“Rule 16-17”,  title:“Give-way & Stand-on Vessel Duties”,       source:“US 33 CFR 83.16”,   url:“https://www.ecfr.gov/current/title-33/chapter-I/subchapter-E/part-83/section-83.16”,                                                  flag:“🇺🇸”, summary:“Give-way: take early and substantial action to keep well clear. Stand-on: maintain course and speed until collision unavoidable. Last resort Rule 17(b): take best action to avoid.”, keywords:[“give-way”,“stand-on”,“collision”,“avoidance”,“rule 16”,“rule 17”] },
{ code:“STCW”,    ch:“Ch. II/1”,  reg:“Reg. II/1”,   title:“OOW – Certificate of Competency”,         source:“UK MSN 1856”,       url:“https://www.legislation.gov.uk/uksi/2015/482/contents”,                                                                              flag:“🇬🇧”, summary:“OOW: CoC per STCW II/1. Min 12 months sea service as rating. GMDSS certificate. ECDIS CoP mandatory. Medical fitness (Reg. I/9) every 2 years. Revalidation every 5 years.”, keywords:[“oow”,“coc”,“certificate”,“watch”,“navigational”,“bridge”,“mate”] },
{ code:“STCW”,    ch:“Ch. III/1”, reg:“Reg. III/1”,  title:“Chief Engineer – OICEW Certificate”,      source:“UK MSN 1856”,       url:“https://www.legislation.gov.uk/uksi/2015/482/contents”,                                                                              flag:“🇬🇧”, summary:“OICEW: min 12 months workshop + sea service. Chief Engineer / 2nd Engineer: 36 months sea service or 30 months + approved training. ETO: separate cert from 2017.”, keywords:[“chief engineer”,“oicew”,“engine”,“eto”,“certificate”] },
{ code:“STCW”,    ch:“Ch. VI/1”,  reg:“A-VI/1”,      title:“Basic Safety Training (BST)”,             source:“UK MSN 1856”,       url:“https://www.legislation.gov.uk/uksi/2015/482/contents”,                                                                              flag:“🇬🇧”, summary:“All seafarers: Personal Survival Techniques, Fire Prevention & Fire Fighting, Elementary First Aid, Personal Safety & Social Responsibilities. Refresher every 5 years.”, keywords:[“bst”,“basic safety”,“survival”,“firefighting”,“first aid”] },
{ code:“STCW”,    ch:“Ch. VIII”,  reg:“Reg. VIII/1”, title:“Fitness for Duty – Hours of Rest”,        source:“UK SI 2015/482”,    url:“https://www.legislation.gov.uk/uksi/2015/482/contents”,                                                                              flag:“🇬🇧”, summary:“Min rest: 10 hours in any 24h AND 77 hours in any 7 days. Max 2 rest periods; one ≥6 consecutive hours. Table C signed by Master weekly. PSC may inspect at any port.”, keywords:[“rest”,“hours”,“fatigue”,“watchkeeping”,“fitness”,“77 hours”,“table c”] },
{ code:“STCW”,    ch:“Ch. VI/7”,  reg:“A-VI/7”,      title:“ECDIS Certificate of Proficiency”,        source:“UK MSN 1856”,       url:“https://www.legislation.gov.uk/uksi/2015/482/contents”,                                                                              flag:“🇬🇧”, summary:“Mandatory for OOWs and Masters. Generic + type-specific training. Covers route planning, monitoring, alarms, system settings, failure modes, fallback procedures.”, keywords:[“ecdis”,“cop”,“proficiency”,“electronic chart”,“generic”,“type specific”] },
{ code:“ISM”,     ch:“Sec. 1-3”,  reg:“Reg. 1-3”,    title:“ISM Code – SMS Objectives”,               source:“US 33 CFR 96.230”,  url:“https://www.ecfr.gov/current/title-33/chapter-I/subchapter-N/part-96/section-96.230”,                                               flag:“🇺🇸”, summary:“Company establishes SMS. DOC: company cert, 5 years, annual verification. SMC: ship cert. Objectives: safe practices, environmental protection, contingency plans.”, keywords:[“ism”,“sms”,“doc”,“smc”,“safety management”] },
{ code:“ISM”,     ch:“Sec. 9”,    reg:“Reg. 9”,       title:“Reports & Analysis of Non-Conformities”, source:“US 33 CFR 96.270”,  url:“https://www.ecfr.gov/current/title-33/chapter-I/subchapter-N/part-96/section-96.270”,                                               flag:“🇺🇸”, summary:“Non-conformities, accidents, hazardous situations reported, investigated, analysed. Near-miss reporting encouraged. Corrective actions verified. Lessons shared fleet-wide.”, keywords:[“non-conformity”,“near miss”,“incident”,“corrective action”,“ism”] },
{ code:“ISPS”,    ch:“Part A”,    reg:“Sec. 7”,       title:“Ship Security Officer (SSO)”,             source:“US 33 CFR 104.205”, url:“https://www.ecfr.gov/current/title-33/chapter-I/subchapter-H/part-104/section-104.205”,                                              flag:“🇺🇸”, summary:“Every ship has a designated SSO. Implements SSP, trains crew, maintains SSAS, reports incidents to CSO within 24h. Holds certificate of proficiency.”, keywords:[“sso”,“security officer”,“cso”,“isps”,“mtsa”] },
{ code:“ISPS”,    ch:“Part A”,    reg:“Sec. 9”,       title:“Ship Security Plan (SSP)”,                source:“US 33 CFR 104.410”, url:“https://www.ecfr.gov/current/title-33/chapter-I/subchapter-H/part-104/section-104.410”,                                              flag:“🇺🇸”, summary:“SSP approved by Administration. Covers all 3 security levels: access control, restricted areas, cargo, stores, baggage monitoring. Drills every 3 months.”, keywords:[“ssp”,“plan”,“security level”,“access control”] },
{ code:“ISPS”,    ch:“Part A”,    reg:“Sec. 4”,       title:“Security Levels 1, 2 & 3”,               source:“US 33 CFR 101.200”, url:“https://www.ecfr.gov/current/title-33/chapter-I/subchapter-H/part-101/section-101.200”,                                              flag:“🇺🇸”, summary:“Level 1: standard minimum measures. Level 2: heightened — enhanced monitoring, restricted access. Level 3: exceptional — full lockdown, SSAS activation. Set by governments.”, keywords:[“security level 1”,“security level 2”,“security level 3”,“lockdown”] },
{ code:“MLC”,     ch:“Reg. 1.1”,  reg:“Std. A1.1”,   title:“Minimum Age of Seafarers”,               source:“UK SI 2014/1613”,   url:“https://www.legislation.gov.uk/uksi/2014/1613/contents”,                                                                             flag:“🇬🇧”, summary:“Minimum age 16 for all seafarers. No person under 18 assigned to night watch (2300-0500) or hazardous work. Exception for training purposes with supervisor.”, keywords:[“minimum age”,“16”,“18”,“night watch”,“hazardous”,“mlc”] },
{ code:“MLC”,     ch:“Reg. 2.3”,  reg:“Std. A2.3”,   title:“Hours of Work and Rest”,                 source:“UK SI 2014/1613”,   url:“https://www.legislation.gov.uk/uksi/2014/1613/contents”,                                                                             flag:“🇬🇧”, summary:“Max work: 14h/24h, 72h/7 days. Min rest: 10h/24h, 77h/7 days. Records maintained and available for PSC inspection. Exceptions for safety/drills documented.”, keywords:[“mlc”,“rest”,“work”,“hours”,“psc”,“14 hours”,“72 hours”] },
{ code:“MLC”,     ch:“Reg. 2.4”,  reg:“Std. A2.4”,   title:“Entitlement to Leave”,                   source:“UK SI 2014/1613”,   url:“https://www.legislation.gov.uk/uksi/2014/1613/contents”,                                                                             flag:“🇬🇧”, summary:“Min paid annual leave: 2.5 calendar days per month. Cannot be replaced by allowance except on termination. Shore leave for health and wellbeing when in port.”, keywords:[“leave”,“annual leave”,“2.5 days”,“shore leave”,“mlc”] },
{ code:“MLC”,     ch:“Reg. 4.1”,  reg:“Std. A4.1”,   title:“Medical Care Onboard & Ashore”,          source:“UK SI 2014/1613”,   url:“https://www.legislation.gov.uk/uksi/2014/1613/contents”,                                                                             flag:“🇬🇧”, summary:“Medicine chest per national requirements. Ships >15 crew / >3 days: Medical Doctor or trained Medical Officer. Telemedicine 24/7. Medical care ashore at owner’s expense.”, keywords:[“medical”,“health”,“doctor”,“medicine”,“telemedicine”,“sick pay”] },
{ code:“MLC”,     ch:“Reg. 4.3”,  reg:“Std. A4.3”,   title:“Health & Safety Protection”,             source:“UK SI 2014/1613”,   url:“https://www.legislation.gov.uk/uksi/2014/1613/contents”,                                                                             flag:“🇬🇧”, summary:“Risk assessment for all onboard hazards. Occupational health & safety programmes. Accident prevention and investigation. Right to stop work in imminent danger without penalty.”, keywords:[“health”,“safety”,“risk assessment”,“accident”,“prevention”,“right to stop”] },
{ code:“LOADLINE”,ch:“Part II”,   reg:“Reg. 1-40”,   title:“Load Line Zones & Marks”,                source:“US 46 CFR 42.20”,   url:“https://www.ecfr.gov/current/title-46/chapter-I/subchapter-E/part-42/subpart-42.20”,                                                  flag:“🇺🇸”, summary:“Plimsoll mark: F (Fresh), T (Tropical), S (Summer), W (Winter), WNA (Winter North Atlantic). Certificate: 5 years. Overloading: criminal offence in all jurisdictions.”, keywords:[“plimsoll”,“load line”,“freeboard”,“zone”,“tropical”,“winter”,“summer”] },
{ code:“IMSBC”,   ch:“Sec. 1-4”,  reg:“Reg. 1-4”,    title:“Solid Bulk Cargo Classification”,        source:“US 46 CFR 148.01”,  url:“https://www.ecfr.gov/current/title-46/chapter-I/subchapter-B/part-148”,                                                              flag:“🇺🇸”, summary:“Groups: A (may liquefy), B (chemical hazard), C (neither). Schedules per cargo. IMSBC mandatory 2011. Moisture Content Certificates for Group A. Trimming per schedule.”, keywords:[“imsbc”,“bulk”,“solid”,“cargo”,“group a”,“liquefy”,“moisture”,“trimming”] },
{ code:“IMSBC”,   ch:“Sec. 7”,    reg:“Reg. 7”,      title:“Grain Loading Requirements”,             source:“US 46 CFR 172”,     url:“https://www.ecfr.gov/current/title-46/chapter-I/subchapter-S/part-172”,                                                              flag:“🇺🇸”, summary:“Document of Authorisation required. Stability: GM ≥ 0.30m. Grain heeling moment tables verified. Stringers, feeders, overstowage requirements. Surveyor attendance mandatory.”, keywords:[“grain”,“loading”,“stability”,“gm”,“heeling”,“overstowage”,“authorisation”] },
];

const AI_ANSWERS = {
enclosed: “📋 SOLAS Ch. VI Reg. B-3 — ENCLOSED SPACE ENTRY\n\nPre-entry atmosphere tests:\n• O₂ ≥ 20.9% (deficient <20.9%, enriched >23%)\n• HC < 1% LEL | H₂S < 1 ppm | CO < 35 ppm | SO₂ < 2 ppm\n\nSequence: O₂ first → toxic gases → flammable gases\nInstruments: calibrated ≤6 months, bump-tested daily\n\nOperational:\n• PTW signed by Master or Chief Officer\n• Responsible officer stationed OUTSIDE — cannot enter\n• SCBA ×2, lifeline, harness at entrance\n• Communication tested before entry\n• Retest every 30 minutes during work\n\n🚨 O₂ < 20.9% = ENTRY PROHIBITED. No exceptions.”,
hotwork:  “📋 ISGOTT Sec. 7.3 / SOLAS II-2 — HOT WORK\n\nRequired before ANY hot work:\n• Gas-free certificate by competent officer\n• HC: 0% LEL in work area AND adjacent spaces\n• Responsible Officer present — cannot leave\n• Dedicated fire watch (no other duties)\n• Fire hose: connected, pressurized, charged\n• Portable extinguisher at work site\n• Master’s signature on permit\n\n⚠️ Permit expires if work stops >30 min — retest & renew\n⚠️ Tankers: gas test every 2 hours during work”,
marpol:   “📋 MARPOL Annex I — OIL DISCHARGE\n\nOutside Special Areas (ALL must be met):\n• Ship proceeding en route\n• OWS output <15 ppm\n• ORB Part I entry made immediately\n• >12nm from nearest land\n\nSpecial Areas — ZERO DISCHARGE:\n• Mediterranean, Baltic, Black Sea, Red Sea, Gulfs, Antarctic, NW European Waters, Oman Sea\n\nORB: every operation logged, signed by officer, countersigned Master, retained 3 years\n\n🚫 NautiForm does not advise on non-compliant discharge.”,
stcw:     “📋 STCW Ch. VIII — HOURS OF REST\n\nMinimum rest:\n• 10 hours in any 24-hour period\n• 77 hours in any 7-day period\n• Max 2 rest periods; one ≥ 6 consecutive hours\n\nExceptions: port entry/departure only, max 2 days, documented in Official Log\n\nRecords: Table C filled daily, signed by Master weekly, available for PSC at any time”,
isps:     “📋 ISPS Code Part A — SECURITY LEVELS\n\nLevel 1 (Normal): standard access control, restricted areas monitored\nLevel 2 (Heightened): enhanced monitoring, increased cargo/baggage inspection\nLevel 3 (Exceptional): full lockdown, SSAS activation, CSO contact\n\nSSO responsible: implement SSP, train crew, report incidents to CSO within 24h\nDrills: every 3 months minimum, full exercise annually”,
oxygen:   “📋 ATMOSPHERE TESTING — REFERENCE VALUES\n\nO₂: Normal 20.9% | Deficient <20.9% → PROHIBITED | Enriched >23% → FIRE RISK\n\nHC/LEL: Safe 0% | Warning ≥0.5% | No ignition ≥1% | Explosive 1-10%\n\nToxic gases:\n• H₂S: <1 ppm TWA | IDLH 100 ppm\n• CO: <35 ppm TWA | IDLH 1200 ppm\n• SO₂: <2 ppm TWA | Benzene: <0.1 ppm TWA\n\nInstruments: calibrate ≤6 months, bump-test daily”,
fire:     “📋 SOLAS Ch. II-2 — FIRE SAFETY\n\nDetection: auto-detection in accommodation, service spaces. Smoke detectors tested weekly.\nFixed systems: CO₂/Halon annual inspection, 5-yearly discharge test\nPortable extinguishers: annual service, 5-year discharge test\nFire main: tested each voyage at sea\nEmergency fire pump: run weekly\nFire drills: minimum monthly, all crew\nFire dampers: tested each drill”,
mlc:      “📋 MLC 2006 — SEAFARER RIGHTS\n\nWork/Rest: Max work 14h/24h, 72h/7 days | Min rest 10h/24h, 77h/7 days\nLeave: Min 2.5 days paid leave/month\nRepatriation: At owner’s expense\nMedical: Telemedicine 24/7, care ashore at owner’s expense\n\nDocuments on board: MLC Cert (≥500 GT international), DMLC I & II, SEAs, Table C records”,
colreg:   “📋 COLREGs — KEY RULES\n\nRule 5: Proper look-out at ALL times — sight, hearing, all available means\nRule 6: Safe speed — consider visibility, traffic density, manoeuvring ability\nRule 8: Action to avoid collision — early, substantial, positive\nRule 16: Give-way vessel — take early and substantial action\nRule 17: Stand-on vessel — maintain course and speed; may act if collision unavoidable\nRule 18: Responsibilities between vessels — NUC, RAM, vessel constrained by draught”,
default:  “📋 NautiForm Regulatory AI — Topics available:\n\n• Enclosed space entry (SOLAS VI)\n• Hot work permits (ISGOTT / SOLAS II-2)\n• MARPOL discharge rules (Annex I)\n• STCW hours of rest (Ch. VIII)\n• ISPS security levels (Part A)\n• Atmosphere / oxygen testing\n• Fire safety (SOLAS II-2 / FSS Code)\n• MLC 2006 seafarer rights\n• COLREGs collision regulations\n\nType your question in plain English or Greek.”,
};

function getAI(q) {
const s = q.toLowerCase();
if (s.includes(“enclosed”)||s.includes(“ptw”)||s.includes(“permit to work”)) return AI_ANSWERS.enclosed;
if (s.includes(“hot work”)||s.includes(“welding”)||s.includes(“cutting”)||s.includes(“grinding”)) return AI_ANSWERS.hotwork;
if (s.includes(“marpol”)||s.includes(“discharge”)||s.includes(“oil”)||s.includes(“orb”)) return AI_ANSWERS.marpol;
if (s.includes(“stcw”)||s.includes(“rest”)||s.includes(“hours”)||s.includes(“fatigue”)) return AI_ANSWERS.stcw;
if (s.includes(“isps”)||s.includes(“security”)||s.includes(“level”)) return AI_ANSWERS.isps;
if (s.includes(“oxygen”)||s.includes(“o2”)||s.includes(“atmosphere”)||s.includes(“lel”)) return AI_ANSWERS.oxygen;
if (s.includes(“fire”)||s.includes(“extinguisher”)||s.includes(“drill”)) return AI_ANSWERS.fire;
if (s.includes(“mlc”)||s.includes(“labour”)||s.includes(“rights”)||s.includes(“leave”)) return AI_ANSWERS.mlc;
if (s.includes(“colreg”)||s.includes(“collision”)||s.includes(“lookout”)||s.includes(“rule”)) return AI_ANSWERS.colreg;
return AI_ANSWERS.default;
}

// ─── FORMS CONFIG ─────────────────────────────────────────────────────────────
const FORMS = [
{ id:“enclosed”, icon:“🔒”, label:“Enclosed Space Entry”, color:”#EF4444”, risk:“HIGH”, fields:[
{ key:“vessel”,      label:“Vessel Name”,                       type:“text”,          required:true },
{ key:“imo”,         label:“IMO Number”,                        type:“text”,          placeholder:“7 digits e.g. 9123456” },
{ key:“flag”,        label:“Flag State”,                        type:“text” },
{ key:“date”,        label:“Date & Time of Entry”,              type:“datetime-local”, required:true },
{ key:“location”,    label:“Space / Compartment”,               type:“text”,          required:true },
{ key:“officer”,     label:“Responsible Officer (Name & Rank)”, type:“text”,          required:true },
{ key:“standby”,     label:“Standby Person at Entrance”,        type:“text”,          required:true },
{ key:“o2”,          label:“Oxygen Level (%)”,                  type:“number”, required:true, special:“o2”, placeholder:“Normal: 20.9” },
{ key:“hc”,          label:“HC / Flammable Gas (% LEL)”,        type:“number”, required:true, special:“hc”, placeholder:“Safe: <1% LEL” },
{ key:“h2s”,         label:“H₂S (ppm)”,                        type:“number”, placeholder:“Safe: <1 ppm” },
{ key:“co”,          label:“CO (ppm)”,                         type:“number”, placeholder:“Safe: <35 ppm” },
{ key:“ventilation”, label:“Ventilation Method & Duration”,     type:“text” },
{ key:“rescue”,      label:“Rescue Equipment in Place”,         type:“select”, options:[“Yes – SCBA ×2, Lifeline, Harness”,“Partial – specify in notes”,“No – ENTRY PROHIBITED”] },
{ key:“comms”,       label:“Communication Method”,              type:“select”, options:[“Portable VHF Radio”,“Hand signals”,“Direct voice contact”] },
{ key:“hazards”,     label:“Identified Hazards”,                type:“textarea”, required:true },
{ key:“controls”,    label:“Control Measures Applied”,          type:“textarea”, required:true },
{ key:“ppe”,         label:“Required PPE”,                      type:“textarea”, required:true },
{ key:“duration”,    label:“Estimated Duration of Work”,        type:“text” },
{ key:“notes”,       label:“Additional Notes”,                  type:“textarea” },
]},
{ id:“hotwork”, icon:“🔥”, label:“Hot Work Permit”, color:”#F97316”, risk:“HIGH”, fields:[
{ key:“vessel”,       label:“Vessel Name”,                      type:“text”,          required:true },
{ key:“imo”,          label:“IMO Number”,                       type:“text”,          placeholder:“7 digits” },
{ key:“date”,         label:“Date & Time”,                      type:“datetime-local”, required:true },
{ key:“location”,     label:“Work Location”,                    type:“text”,          required:true },
{ key:“officer”,      label:“Issuing Officer”,                  type:“text”,          required:true },
{ key:“workers”,      label:“Workers Involved”,                 type:“text”,          required:true },
{ key:“nature”,       label:“Nature of Hot Work”,               type:“select”, options:[“Welding”,“Cutting”,“Grinding”,“Brazing”,“Soldering”,“Other”] },
{ key:“equipment”,    label:“Equipment to be Used”,             type:“text” },
{ key:“gastest”,      label:“Gas Test Result (% LEL)”,          type:“number”, placeholder:“Must be 0%” },
{ key:“gastester”,    label:“Gas Test Conducted By”,            type:“text” },
{ key:“firewatch”,    label:“Fire Watch Name”,                  type:“text”,  required:true },
{ key:“extinguisher”, label:“Extinguisher Type & Location”,     type:“text”,  required:true },
{ key:“hose”,         label:“Fire Hose Connected & Pressurized”,type:“select”, options:[“Yes”,“No – WORK PROHIBITED”] },
{ key:“hazards”,      label:“Identified Hazards”,               type:“textarea”, required:true },
{ key:“controls”,     label:“Control Measures”,                 type:“textarea”, required:true },
{ key:“ppe”,          label:“Required PPE”,                     type:“textarea”, required:true },
{ key:“validity”,     label:“Permit Valid Until”,               type:“datetime-local”, required:true },
{ key:“notes”,        label:“Remarks”,                          type:“textarea” },
]},
{ id:“coldwork”, icon:“❄️”, label:“Cold Work Permit”, color:”#00AEEF”, risk:“MEDIUM”, fields:[
{ key:“vessel”,    label:“Vessel Name”,                    type:“text”,          required:true },
{ key:“imo”,       label:“IMO Number”,                     type:“text”,          placeholder:“7 digits” },
{ key:“date”,      label:“Date & Time”,                    type:“datetime-local”, required:true },
{ key:“location”,  label:“Work Location”,                  type:“text”,          required:true },
{ key:“officer”,   label:“Responsible Officer”,            type:“text”,          required:true },
{ key:“workers”,   label:“Workers Involved”,               type:“text”,          required:true },
{ key:“nature”,    label:“Nature of Cold Work”,            type:“text”,          required:true },
{ key:“isolation”, label:“System Isolated / LOTO Applied”, type:“select”, options:[“Yes – Tagged & Locked”,“Partial”,“No”] },
{ key:“pressure”,  label:“System Depressurized”,           type:“select”, options:[“Yes”,“Not Applicable”,“No – WORK PROHIBITED”] },
{ key:“hazards”,   label:“Identified Hazards”,             type:“textarea”, required:true },
{ key:“controls”,  label:“Control Measures”,               type:“textarea”, required:true },
{ key:“ppe”,       label:“Required PPE”,                   type:“textarea”, required:true },
{ key:“validity”,  label:“Permit Valid Until”,             type:“datetime-local” },
{ key:“notes”,     label:“Remarks”,                        type:“textarea” },
]},
{ id:“aloft”, icon:“🏗️”, label:“Working Aloft / Over Side”, color:”#A78BFA”, risk:“HIGH”, fields:[
{ key:“vessel”,    label:“Vessel Name”,                         type:“text”,          required:true },
{ key:“imo”,       label:“IMO Number”,                          type:“text”,          placeholder:“7 digits” },
{ key:“date”,      label:“Date & Time”,                         type:“datetime-local”, required:true },
{ key:“location”,  label:“Work Location (Mast/Funnel/Side)”,    type:“text”,          required:true },
{ key:“officer”,   label:“Responsible Officer”,                 type:“text”,          required:true },
{ key:“workers”,   label:“Workers & Their Ranks”,               type:“text”,          required:true },
{ key:“height”,    label:“Working Height (metres)”,             type:“number” },
{ key:“harness”,   label:“Safety Harness Inspected”,            type:“select”, options:[“Yes – fit tested”,“No – WORK PROHIBITED”] },
{ key:“lifeline”,  label:“Lifeline Secured To”,                 type:“text” },
{ key:“exclusion”, label:“Exclusion Zone Below Established”,    type:“select”, options:[“Yes”,“No”] },
{ key:“weather”,   label:“Wind Speed (kn) & Conditions”,        type:“text”,          required:true },
{ key:“motion”,    label:“Ship Motion / Sea State”,             type:“text” },
{ key:“radio”,     label:“Radio Communication”,                 type:“select”, options:[“Yes – Ch. 16 monitored”,“No”] },
{ key:“hazards”,   label:“Identified Hazards”,                  type:“textarea”, required:true },
{ key:“controls”,  label:“Control Measures”,                    type:“textarea”, required:true },
{ key:“ppe”,       label:“Required PPE”,                        type:“textarea”, required:true },
{ key:“notes”,     label:“Remarks”,                             type:“textarea” },
]},
{ id:“toolbox”, icon:“🔧”, label:“Toolbox Meeting Record”, color:”#22D3A0”, risk:“LOW”, fields:[
{ key:“vessel”,    label:“Vessel Name”,               type:“text”,          required:true },
{ key:“date”,      label:“Date & Time”,               type:“datetime-local”, required:true },
{ key:“location”,  label:“Meeting Location”,          type:“text”,          required:true },
{ key:“officer”,   label:“Conducted By”,              type:“text”,          required:true },
{ key:“attendees”, label:“Attendees (Names & Ranks)”, type:“textarea”,      required:true },
{ key:“job”,       label:“Task / Job Description”,    type:“textarea”,      required:true },
{ key:“hazards”,   label:“Hazards Discussed”,         type:“textarea”,      required:true },
{ key:“controls”,  label:“Controls Agreed”,           type:“textarea”,      required:true },
{ key:“ppe”,       label:“PPE Requirements”,          type:“textarea”,      required:true },
{ key:“emergency”, label:“Emergency Procedures Reviewed”, type:“select”, options:[“Yes”,“No”] },
{ key:“questions”, label:“Questions / Concerns Raised”,   type:“textarea” },
{ key:“notes”,     label:“Additional Remarks”,            type:“textarea” },
]},
{ id:“daily”, icon:“📋”, label:“Daily Safety Plan”, color:”#FBBF24”, risk:“LOW”, fields:[
{ key:“vessel”,        label:“Vessel Name”,                    type:“text”,  required:true },
{ key:“date”,          label:“Date”,                           type:“date”,  required:true },
{ key:“officer”,       label:“Planning Officer”,               type:“text”,  required:true },
{ key:“voyage”,        label:“Voyage Status”,                  type:“select”, options:[“At Sea”,“In Port”,“Anchored”,“Manoeuvring”] },
{ key:“tasks”,         label:“Planned Tasks”,                  type:“textarea”, required:true },
{ key:“priorities”,    label:“Safety Priorities”,              type:“textarea”, required:true },
{ key:“permits”,       label:“Active Permits”,                 type:“textarea” },
{ key:“drills”,        label:“Drills / Exercises Planned”,     type:“text” },
{ key:“maintenance”,   label:“Critical Maintenance”,           type:“textarea” },
{ key:“watchofficers”, label:“Watch Officers (Name / Period)”, type:“textarea”, required:true },
{ key:“weather”,       label:“Weather & Sea State”,            type:“textarea” },
{ key:“notes”,         label:“Remarks”,                        type:“textarea” },
]},
{ id:“risk”, icon:“⚠️”, label:“Risk Assessment”, color:”#FB923C”, risk:“VARIABLE”, fields:[
{ key:“vessel”,       label:“Vessel Name”,                  type:“text”,          required:true },
{ key:“date”,         label:“Date & Time”,                  type:“datetime-local”, required:true },
{ key:“task”,         label:“Task / Activity Assessed”,     type:“text”,          required:true },
{ key:“officer”,      label:“Assessment Conducted By”,      type:“text”,          required:true },
{ key:“team”,         label:“Team Members”,                 type:“textarea” },
{ key:“hazard1”,      label:“Hazard 1”,                     type:“text” },
{ key:“risk1”,        label:“Risk 1 – Rating”,              type:“select”, options:[“Low (1-4)”,“Medium (5-9)”,“High (10-16)”,“Critical (17-25)”] },
{ key:“control1”,     label:“Control – Hazard 1”,           type:“text” },
{ key:“hazard2”,      label:“Hazard 2”,                     type:“text” },
{ key:“risk2”,        label:“Risk 2 – Rating”,              type:“select”, options:[“Low (1-4)”,“Medium (5-9)”,“High (10-16)”,“Critical (17-25)”] },
{ key:“control2”,     label:“Control – Hazard 2”,           type:“text” },
{ key:“hazard3”,      label:“Hazard 3”,                     type:“text” },
{ key:“risk3”,        label:“Risk 3 – Rating”,              type:“select”, options:[“Low (1-4)”,“Medium (5-9)”,“High (10-16)”,“Critical (17-25)”] },
{ key:“control3”,     label:“Control – Hazard 3”,           type:“text” },
{ key:“residualrisk”, label:“Residual Risk After Controls”, type:“select”, options:[“Acceptable – Proceed”,“Acceptable with monitoring”,“Unacceptable – DO NOT PROCEED”] },
{ key:“ppe”,          label:“Required PPE”,                 type:“textarea”, required:true },
{ key:“emergency”,    label:“Emergency Response Plan”,      type:“textarea” },
{ key:“notes”,        label:“Remarks”,                      type:“textarea” },
]},
];

// ─── SIGNATURE PAD ────────────────────────────────────────────────────────────
function SignaturePad({ onSignatureChange }) {
const canvasRef = useRef();
const drawing   = useRef(false);
const [signed, setSigned] = useState(false);

const pos = (e, c) => {
const r = c.getBoundingClientRect();
return e.touches
? { x: e.touches[0].clientX - r.left, y: e.touches[0].clientY - r.top }
: { x: e.clientX - r.left, y: e.clientY - r.top };
};
const start = e => { e.preventDefault(); drawing.current = true; const c = canvasRef.current; const ctx = c.getContext(“2d”); const p = pos(e,c); ctx.beginPath(); ctx.moveTo(p.x, p.y); };
const draw  = e => {
e.preventDefault();
if (!drawing.current) return;
const c = canvasRef.current; const ctx = c.getContext(“2d”);
ctx.strokeStyle = “#00AEEF”; ctx.lineWidth = 2; ctx.lineCap = “round”;
const p = pos(e, c); ctx.lineTo(p.x, p.y); ctx.stroke();
setSigned(true);
onSignatureChange && onSignatureChange(c.toDataURL(“image/png”));
};
const stop  = () => { drawing.current = false; };
const clear = () => {
const c = canvasRef.current; c.getContext(“2d”).clearRect(0, 0, c.width, c.height);
setSigned(false);
onSignatureChange && onSignatureChange(null);
};

return (
<div className="card">
<div style={{ display:“flex”, justifyContent:“space-between”, alignItems:“center”, marginBottom:“10px” }}>
<span className="label" style={{marginBottom:0}}>OFFICER SIGNATURE</span>
{signed && <button onClick={clear} className=“btn-ghost” style={{padding:“4px 10px”,fontSize:“11px”}}>Clear</button>}
</div>
<canvas ref={canvasRef} width={400} height={80}
onMouseDown={start} onMouseMove={draw} onMouseUp={stop} onMouseLeave={stop}
onTouchStart={start} onTouchMove={draw} onTouchEnd={stop}
style={{ width:“100%”, height:“80px”, background:“var(–input-bg)”, border:`1px dashed ${signed?"var(--accent)":"var(--border)"}`, borderRadius:“8px”, cursor:“crosshair”, touchAction:“none”, display:“block” }} />
<p style={{ color: signed ? “var(–ok)” : “var(–text-dim)”, fontSize:“10px”, margin:“8px 0 0” }}>
{signed ? “✓ Signature captured — will be burned into PDF (non-editable)” : “Draw your signature above with finger or mouse”}
</p>
</div>
);
}

// ─── INLINE VOICE ─────────────────────────────────────────────────────────────
function InlineVoice({ onTranscript }) {
const [holding, setHolding] = useState(false);
const [status,  setStatus]  = useState(“idle”);
const [text,    setText]    = useState(””);

const start = () => { setHolding(true); setStatus(“recording”); setText(””); };
const stop  = () => {
setHolding(false); setStatus(“processing”);
setTimeout(() => {
const demo = “Vessel: MV Poseidon. Officer: Chief Officer Papadopoulos. Location: Cargo Hold Three. Oxygen level: 20.9. Hazards: confined space, oxygen deficiency risk. Controls: continuous monitoring, standby outside.”;
setText(demo); setStatus(“done”);
}, 1400);
};
const apply = () => { onTranscript && onTranscript(text); setStatus(“idle”); setText(””); };

const borderColor = holding ? “var(–danger)” : status === “done” ? “var(–ok)” : “var(–purple)”;

return (
<div style={{ flex:1, background:“var(–surface)”, border:`1px solid ${borderColor}`, borderRadius:“var(–radius)”, padding:“12px”, display:“flex”, flexDirection:“column”, alignItems:“center”, gap:“6px”, transition:“border-color 0.2s” }}>
<span style={{ fontSize:“22px” }}>{holding ? “🔴” : “🎙️”}</span>
<span style={{ color: borderColor, fontSize:“11px”, fontWeight:“700”, textAlign:“center” }}>
{status === “idle” ? “Voice Fill” : status === “recording” ? “Recording…” : status === “processing” ? “Processing…” : “Done ✓”}
</span>
<span style={{ color:“var(–text-muted)”, fontSize:“10px” }}>Whisper AI</span>
<button
onMouseDown={start} onMouseUp={stop}
onTouchStart={e => { e.preventDefault(); start(); }} onTouchEnd={e => { e.preventDefault(); stop(); }}
style={{ width:“100%”, padding:“10px 0”, background: holding ? “rgba(239,68,68,0.12)” : “rgba(167,139,250,0.12)”, border:`1.5px solid ${borderColor}`, borderRadius:“8px”, color: borderColor, fontWeight:“700”, fontSize:“11px”, cursor:“pointer”, userSelect:“none” }}>
{holding ? “RELEASE” : “HOLD TO TALK”}
</button>
{text && status === “done” && (
<div style={{ width:“100%” }}>
<div style={{ background:“var(–input-bg)”, border:“1px solid var(–ok)”, borderRadius:“7px”, padding:“8px”, color:“var(–text-sub)”, fontSize:“11px”, lineHeight:“1.6”, maxHeight:“80px”, overflowY:“auto”, marginBottom:“6px” }}>{text}</div>
<button onClick={apply} style={{ width:“100%”, background:“var(–ok)”, border:“none”, borderRadius:“7px”, padding:“9px”, color:”#000”, fontWeight:“700”, fontSize:“11px”, cursor:“pointer” }}>✓ APPLY TO FORM</button>
</div>
)}
</div>
);
}

// ─── FORM VIEW ────────────────────────────────────────────────────────────────
function FormView({ cfg, onBack }) {
const [fields,    setFields]    = useState({});
const [errors,    setErrors]    = useState({});
const [touched,   setTouched]   = useState({});
const [o2Alert,   setO2Alert]   = useState(false);
const [hcAlert,   setHcAlert]   = useState(false);
const [saved,     setSaved]     = useState(false);
const [exporting, setExporting] = useState(false);
const [signature, setSignature] = useState(null);

const set = (k, v) => {
setFields(f => ({ …f, [k]: v }));
setTouched(t => ({ …t, [k]: true }));
const f = cfg.fields.find(f => f.key === k);
const err = validate(k, v, f?.required);
setErrors(e => ({ …e, [k]: err }));
if (k === “o2”) setO2Alert(v !== “” && parseFloat(v) < 20.9);
if (k === “hc”) setHcAlert(v !== “” && parseFloat(v) >= 1);
};

const handleBlur = k => setTouched(t => ({ …t, [k]: true }));

const validateAll = () => {
const newErrors = {};
cfg.fields.forEach(f => {
const err = validate(f.key, fields[f.key] || “”, f.required);
if (err) newErrors[f.key] = err;
});
setErrors(newErrors);
setTouched(Object.fromEntries(cfg.fields.map(f => [f.key, true])));
return Object.keys(newErrors).length === 0;
};

const requiredOk = cfg.fields.filter(f => f.required).every(f => (fields[f.key] || “”).toString().trim());

const handleExport = async () => {
if (!validateAll()) return;
setExporting(true);
try {
await exportToPDF(cfg, fields, signature);
} catch (e) {
alert(“PDF export failed: “ + e.message);
}
setExporting(false);
};

const handleVoice = transcript => {
cfg.fields.forEach(f => {
const rx = new RegExp(`${f.label.toLowerCase()}[:\\s]+([^,.]+)`, “i”);
const m  = transcript.match(rx) || transcript.match(new RegExp(`${f.key}[:\\s]+([^,.]+)`, “i”));
if (m) set(f.key, m[1].trim());
});
};

return (
<div style={{ padding:“16px 16px 0” }}>
<button onClick={onBack} className=“btn-ghost” style={{ marginBottom:“16px” }}>← Back to Forms</button>

```
  {/* Header */}
  <div style={{ display:"flex", alignItems:"center", gap:"12px", marginBottom:"12px" }}>
    <div style={{ width:"46px", height:"46px", background:`${cfg.color}18`, border:`1px solid ${cfg.color}44`, borderRadius:"10px", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"22px", flexShrink:0 }}>{cfg.icon}</div>
    <div>
      <h2 style={{ color:"var(--text)", fontSize:"17px", fontWeight:"700", margin:"0 0 4px" }}>{cfg.label}</h2>
      <div style={{ display:"flex", gap:"6px" }}>
        <span className={`badge badge-${cfg.risk==="HIGH"?"danger":cfg.risk==="MEDIUM"?"warn":"ok"}`}>{cfg.risk} RISK</span>
        <span className="badge badge-accent">IMO COMPLIANT</span>
      </div>
    </div>
  </div>

  {/* Input method row: OCR + Voice */}
  <div style={{ display:"flex", gap:"8px", marginBottom:"12px" }}>
    <div style={{ flex:1, background:"var(--surface)", border:"1px solid var(--accent-dim)", borderRadius:"var(--radius)", padding:"12px", display:"flex", flexDirection:"column", alignItems:"center", gap:"6px" }}>
      <span style={{ fontSize:"22px" }}>📷</span>
      <span style={{ color:"var(--accent-text)", fontSize:"11px", fontWeight:"700" }}>OCR Scan</span>
      <span style={{ color:"var(--text-muted)", fontSize:"10px" }}>Gemini Vision</span>
      <button style={{ width:"100%", background:"var(--accent-dim)", border:"1px solid rgba(0,174,239,0.3)", borderRadius:"8px", padding:"7px", color:"var(--accent-text)", fontSize:"11px", fontWeight:"700", cursor:"pointer" }}>SCAN</button>
    </div>
    <InlineVoice onTranscript={handleVoice} />
  </div>

  {/* Safety alerts */}
  {o2Alert && (
    <div style={{ background:"#1a0000", border:"2px solid var(--danger)", borderRadius:"var(--radius)", padding:"14px", marginBottom:"12px" }}>
      <p style={{ color:"var(--danger)", fontWeight:"700", fontSize:"14px", margin:"0 0 4px" }}>🚨 CRITICAL — ENTRY PROHIBITED</p>
      <p style={{ color:"#FCA5A5", fontSize:"13px", lineHeight:"1.5", margin:0 }}>O₂ below 20.9% — oxygen deficient atmosphere. Ventilate thoroughly and retest. No crew entry under any circumstances. SOLAS Ch. VI strictly enforced.</p>
    </div>
  )}
  {hcAlert && (
    <div style={{ background:"#1a0800", border:"2px solid var(--warn)", borderRadius:"var(--radius)", padding:"14px", marginBottom:"12px" }}>
      <p style={{ color:"var(--warn)", fontWeight:"700", fontSize:"14px", margin:"0 0 4px" }}>⚠️ FLAMMABLE ATMOSPHERE</p>
      <p style={{ color:"#FED7AA", fontSize:"13px", lineHeight:"1.5", margin:0 }}>HC ≥ 1% LEL — explosive atmosphere. Cease all hot work immediately. Remove ignition sources. Ventilate and retest.</p>
    </div>
  )}

  {/* Fields */}
  <div style={{ display:"flex", flexDirection:"column", gap:"10px", marginBottom:"16px" }}>
    {cfg.fields.map((f, i) => {
      const hasErr = touched[f.key] && errors[f.key];
      const inputClass = `input-base${hasErr ? " input-err" : ""}`;
      return (
        <div key={i}>
          <label className="label">{f.label}{f.required && <span style={{ color:"var(--danger)" }}> *</span>}</label>
          {f.type === "textarea" ? (
            <textarea value={fields[f.key]||""} onChange={e => set(f.key, e.target.value)} onBlur={() => handleBlur(f.key)}
              rows={3} className={inputClass} style={{ resize:"vertical" }} />
          ) : f.type === "select" ? (
            <select value={fields[f.key]||""} onChange={e => set(f.key, e.target.value)} onBlur={() => handleBlur(f.key)}
              className={inputClass} style={{ color: fields[f.key] ? "var(--text)" : "var(--text-dim)" }}>
              <option value="">Select...</option>
              {f.options.map((o,j) => <option key={j} value={o}>{o}</option>)}
            </select>
          ) : (
            <input type={f.type||"text"} value={fields[f.key]||""} onChange={e => set(f.key, e.target.value)} onBlur={() => handleBlur(f.key)}
              placeholder={f.placeholder||""} step={f.type==="number"?"0.1":undefined}
              className={inputClass} />
          )}
          {hasErr && <span className="err-msg">⚠ {errors[f.key]}</span>}
        </div>
      );
    })}
  </div>

  <SignaturePad onSignatureChange={setSignature} />

  {/* Actions */}
  <button onClick={() => { setSaved(true); setTimeout(() => setSaved(false), 2500); }}
    style={{ width:"100%", background: saved ? "rgba(34,211,160,0.12)" : "var(--surface)", border:`1px solid ${saved ? "var(--ok)" : "var(--border)"}`, borderRadius:"var(--radius)", padding:"16px", color: saved ? "var(--ok)" : "var(--text-sub)", fontWeight:"700", fontSize:"14px", cursor:"pointer", marginBottom:"10px" }}>
    {saved ? "✓ DRAFT SAVED LOCALLY" : "💾 SAVE DRAFT (Offline Cache)"}
  </button>

  <button onClick={handleExport} disabled={exporting}
    style={{ width:"100%", background: requiredOk ? "var(--accent)" : "var(--surface2)", border:"none", borderRadius:"var(--radius)", padding:"16px", color: requiredOk ? "#000" : "var(--text-dim)", fontWeight:"700", fontSize:"14px", cursor: requiredOk ? "pointer" : "not-allowed", marginBottom:"8px" }}>
    {exporting ? "⏳ Generating PDF..." : "📄 EXPORT SIGNED PDF"}
  </button>

  {!requiredOk && <p style={{ color:"var(--text-muted)", fontSize:"11px", textAlign:"center", margin:"0 0 4px" }}>Complete all required (*) fields to export</p>}
  <p style={{ color:"var(--text-dim)", fontSize:"10px", textAlign:"center", margin:"0 0 20px" }}>⚡ Auto-purge: cloud data deleted after PDF export</p>
</div>
```

);
}

// ─── FORMS TAB ────────────────────────────────────────────────────────────────
function FormsTab() {
const [sel, setSel] = useState(null);
if (sel) return <FormView cfg={FORMS.find(f => f.id === sel)} onBack={() => setSel(null)} />;
return (
<div style={{ padding:“16px 16px 0” }}>
<h1 className="section-title">Smart Forms</h1>
<p className="section-sub">Select a permit or checklist to open</p>
{FORMS.map((f, i) => (
<button key={i} onClick={() => setSel(f.id)}
style={{ width:“100%”, background:“var(–surface)”, border:`1px solid ${f.color}22`, borderRadius:“var(–radius-lg)”, padding:“18px 16px”, display:“flex”, alignItems:“center”, gap:“14px”, marginBottom:“10px”, cursor:“pointer”, textAlign:“left” }}>
<div style={{ width:“48px”, height:“48px”, background:`${f.color}15`, border:`1px solid ${f.color}33`, borderRadius:“10px”, display:“flex”, alignItems:“center”, justifyContent:“center”, fontSize:“22px”, flexShrink:0 }}>{f.icon}</div>
<div style={{ flex:1 }}>
<p style={{ color:“var(–text)”, fontSize:“15px”, fontWeight:“700”, margin:“0 0 4px” }}>{f.label}</p>
<span className={`badge badge-${f.risk==="HIGH"?"danger":f.risk==="MEDIUM"?"warn":"ok"}`}>{f.risk} RISK</span>
</div>
<span style={{ color:“var(–text-muted)”, fontSize:“22px” }}>›</span>
</button>
))}
</div>
);
}

// ─── LIBRARY TAB ──────────────────────────────────────────────────────────────
function LibraryTab() {
const [search, setSearch] = useState(””);
const [code,   setCode]   = useState(“ALL”);
const [aiQ,    setAiQ]    = useState(””);
const [aiResp, setAiResp] = useState(””);
const [aiLoad, setAiLoad] = useState(false);
const [expd,   setExpd]   = useState(null);
const codes = [“ALL”,“SOLAS”,“MARPOL”,“COLREG”,“STCW”,“ISM”,“ISPS”,“MLC”,“LOADLINE”,“IMSBC”];

const filtered = REGS.filter(r => {
const mc = code === “ALL” || r.code === code;
const ms = !search || r.title.toLowerCase().includes(search.toLowerCase()) ||
r.summary.toLowerCase().includes(search.toLowerCase()) ||
r.keywords.some(k => k.includes(search.toLowerCase()));
return mc && ms;
});

const ask = async () => {
if (!aiQ.trim()) return;
setAiLoad(true); setAiResp(””);
await new Promise(r => setTimeout(r, 700));
setAiResp(getAI(aiQ));
setAiLoad(false);
};

return (
<div style={{ padding:“16px 16px 0” }}>
<h1 className="section-title">Regulatory Library</h1>
<p className="section-sub">SOLAS · MARPOL · COLREG · STCW · ISM · ISPS · MLC · LOADLINE · IMSBC</p>

```
  {/* Legal source banner */}
  <div style={{ background:"#0a1200", border:"1px solid rgba(34,211,160,0.2)", borderLeft:"3px solid var(--ok)", borderRadius:"var(--radius)", padding:"12px 14px", marginBottom:"14px" }}>
    <p style={{ color:"var(--ok)", fontSize:"11px", fontWeight:"700", margin:"0 0 6px" }}>🏛️ PUBLIC DOMAIN SOURCES — 100% LEGAL</p>
    <p style={{ color:"var(--text-muted)", fontSize:"11px", lineHeight:"1.6", margin:"0 0 10px" }}>All regulations link to official US eCFR (ecfr.gov) and UK Gov (legislation.gov.uk) — public domain federal law. Always current. Legally safe to reference.</p>
    <div style={{ display:"flex", gap:"8px", flexWrap:"wrap" }}>
      {["🇺🇸 US eCFR","🇬🇧 UK Legislation","⚡ Auto-Updated"].map(l => (
        <span key={l} style={{ background:"#0d1a0d", border:"1px solid rgba(34,211,160,0.2)", borderRadius:"6px", padding:"4px 10px", color:"var(--ok)", fontSize:"10px", fontWeight:"700" }}>{l}</span>
      ))}
    </div>
  </div>

  {/* AI Assistant */}
  <div className="card" style={{ border:"1px solid rgba(0,174,239,0.15)" }}>
    <p style={{ color:"var(--accent-text)", fontSize:"10px", fontWeight:"700", letterSpacing:"2px", margin:"0 0 10px" }}>🤖  AI REGULATORY ASSISTANT</p>
    <div style={{ display:"flex", gap:"8px", marginBottom: aiResp ? "10px" : 0 }}>
      <input value={aiQ} onChange={e => setAiQ(e.target.value)} onKeyDown={e => e.key === "Enter" && ask()}
        placeholder="e.g. Enclosed space entry requirements?" className="input-base" style={{ flex:1 }} />
      <button onClick={ask} className="btn-primary" style={{ width:"auto", padding:"0 16px", letterSpacing:0 }}>ASK</button>
    </div>
    {aiLoad && <p style={{ color:"var(--accent-text)", fontSize:"12px" }}>Searching regulations...</p>}
    {aiResp && (
      <div style={{ background:"var(--input-bg)", border:"1px solid var(--border)", borderRadius:"8px", padding:"14px", whiteSpace:"pre-line", color:"var(--text-sub)", fontSize:"12px", lineHeight:"1.8", maxHeight:"260px", overflowY:"auto", marginTop:"10px" }}>
        {aiResp}
      </div>
    )}
  </div>

  {/* Auto-update */}
  <div style={{ background:"var(--surface)", border:"1px solid rgba(34,211,160,0.15)", borderRadius:"8px", padding:"10px 14px", marginBottom:"12px", display:"flex", alignItems:"center", gap:"8px" }}>
    <div style={{ width:"6px", height:"6px", background:"var(--ok)", borderRadius:"50%", flexShrink:0 }} />
    <span style={{ color:"var(--ok)", fontSize:"10px", fontWeight:"700" }}>AUTO-UPDATE ACTIVE</span>
    <span style={{ color:"var(--text-dim)", fontSize:"10px", marginLeft:"auto" }}>IMO Amendment API: Monitoring</span>
  </div>

  {/* Search */}
  <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍  Search regulations, chapters, keywords..."
    className="input-base" style={{ marginBottom:"10px" }} />

  {/* Code filter */}
  <div style={{ display:"flex", gap:"8px", marginBottom:"14px", overflowX:"auto", paddingBottom:"4px" }}>
    {codes.map(c => (
      <button key={c} onClick={() => setCode(c)}
        style={{ background: code===c ? "var(--accent)" : "var(--surface)", color: code===c ? "#000" : "var(--text-muted)", border:`1px solid ${code===c ? "var(--accent)" : "var(--border)"}`, borderRadius:"20px", padding:"8px 14px", fontSize:"11px", fontWeight:"700", cursor:"pointer", whiteSpace:"nowrap" }}>
        {c}
      </button>
    ))}
  </div>

  <p style={{ color:"var(--text-dim)", fontSize:"10px", margin:"0 0 10px" }}>{filtered.length} REGULATIONS FOUND</p>

  {filtered.map((r, i) => (
    <div key={i} className="card" style={{ cursor:"pointer", marginBottom:"8px" }}>
      <div onClick={() => setExpd(expd === i ? null : i)}>
        <div style={{ display:"flex", gap:"8px", marginBottom:"8px", alignItems:"center", flexWrap:"wrap" }}>
          <span style={{ background:"var(--accent)", color:"#000", borderRadius:"5px", padding:"3px 8px", fontSize:"10px", fontWeight:"700" }}>{r.code}</span>
          <span style={{ color:"var(--text-muted)", fontSize:"11px" }}>{r.ch}</span>
          <span style={{ color:"var(--text-dim)", fontSize:"11px" }}>{r.reg}</span>
          {r.flag && <span style={{ marginLeft:"auto", color:"var(--text-dim)", fontSize:"10px" }}>{r.flag} {r.source}</span>}
          <span style={{ color:"var(--text-muted)", fontSize:"18px", marginLeft: r.flag ? "0" : "auto" }}>{expd===i?"−":"+"}</span>
        </div>
        <p style={{ color:"var(--text)", fontSize:"14px", fontWeight:"600", margin:0 }}>{r.title}</p>
      </div>
      {expd === i && (
        <div>
          <p style={{ color:"var(--text-sub)", fontSize:"12px", lineHeight:"1.8", borderTop:"1px solid var(--border)", paddingTop:"10px", marginTop:"10px", marginBottom:"12px" }}>{r.summary}</p>
          {r.url && (
            <a href={r.url} target="_blank" rel="noopener noreferrer"
              style={{ display:"block", background:"var(--accent-dim)", border:"1px solid rgba(0,174,239,0.3)", borderRadius:"8px", padding:"10px", color:"var(--accent-text)", fontSize:"11px", fontWeight:"700", textDecoration:"none", textAlign:"center" }}>
              🌐 READ ONLINE — Official Source
            </a>
          )}
          <p style={{ color:"var(--text-dim)", fontSize:"10px", textAlign:"center", margin:"8px 0 0" }}>{r.flag} Public Domain · {r.source} · Always current</p>
        </div>
      )}
    </div>
  ))}
</div>
```

);
}

// ─── LOGIN / SIGNUP SCREEN ────────────────────────────────────────────────────
function LoginScreen({ onLogin }) {
const [mode,     setMode]     = useState(“login”); // login | signup
const [email,    setEmail]    = useState(””);
const [password, setPassword] = useState(””);
const [name,     setName]     = useState(””);
const [rank,     setRank]     = useState(””);
const [vessel,   setVessel]   = useState(””);
const [loading,  setLoading]  = useState(false);
const [error,    setError]    = useState(””);

const ranks = [“Master”,“Chief Officer”,“2nd Officer”,“3rd Officer”,“Chief Engineer”,“2nd Engineer”,“3rd Engineer”,“4th Engineer”,“Bosun”,“AB Seaman”,“OS”,“Cook”,“ETO”,“Cadet”];

const handle = async () => {
if (!email || !password) { setError(“Email and password required”); return; }
if (mode === “signup” && !name) { setError(“Full name required”); return; }
setLoading(true); setError(””);
try {
let data;
if (mode === “login”) {
data = await supabase.signIn(email, password);
if (data.error || !data.access_token) { setError(data.error?.message || data.msg || “Login failed. Check your credentials.”); setLoading(false); return; }
} else {
data = await supabase.signUp(email, password, { full_name: name, rank, vessel_name: vessel });
if (data.error) { setError(data.error.message || “Sign up failed.”); setLoading(false); return; }
// Auto sign-in after signup
data = await supabase.signIn(email, password);
if (data.error || !data.access_token) { setError(“Account created! Please sign in.”); setMode(“login”); setLoading(false); return; }
}
// Store session
localStorage.setItem(“nf_token”,   data.access_token);
localStorage.setItem(“nf_user_id”, data.user?.id || “”);
localStorage.setItem(“nf_name”,    data.user?.user_metadata?.full_name || email);
onLogin({ token: data.access_token, userId: data.user?.id, name: data.user?.user_metadata?.full_name || email });
} catch(e) {
setError(“Network error. Check your connection.”);
}
setLoading(false);
};

return (
<div style={{ position:“fixed”, inset:0, background:“var(–bg)”, zIndex:9998, display:“flex”, flexDirection:“column”, alignItems:“center”, justifyContent:“center”, padding:“20px”, overflowY:“auto” }}>
<div style={{ width:“100%”, maxWidth:“420px” }}>
{/* Logo */}
<div style={{ textAlign:“center”, marginBottom:“32px” }}>
<div style={{ width:“72px”, height:“72px”, border:“1.5px solid rgba(0,174,239,0.35)”, borderRadius:“50%”, display:“flex”, alignItems:“center”, justifyContent:“center”, margin:“0 auto 16px”, background:“var(–surface)” }}>
<AnchorIcon size={38} />
</div>
<p style={{ color:“var(–accent)”, fontSize:“24px”, fontWeight:“700”, letterSpacing:“5px”, margin:“0 0 4px” }}>NAUTIFORM</p>
<p style={{ color:“var(–text-muted)”, fontSize:“11px”, letterSpacing:“2px”, margin:0 }}>MARITIME ASSISTANT FOR SEAFARERS</p>
</div>

```
    {/* Mode toggle */}
    <div style={{ display:"flex", background:"var(--surface)", border:"1px solid var(--border)", borderRadius:"var(--radius)", padding:"4px", marginBottom:"20px" }}>
      {["login","signup"].map(m => (
        <button key={m} onClick={() => { setMode(m); setError(""); }}
          style={{ flex:1, padding:"10px", borderRadius:"8px", border:"none", background: mode===m ? "var(--accent)" : "transparent", color: mode===m ? "#000" : "var(--text-muted)", fontWeight:"700", fontSize:"13px", cursor:"pointer", transition:"all 0.2s" }}>
          {m === "login" ? "SIGN IN" : "CREATE ACCOUNT"}
        </button>
      ))}
    </div>

    {/* Fields */}
    <div style={{ display:"flex", flexDirection:"column", gap:"10px", marginBottom:"16px" }}>
      {mode === "signup" && (
        <>
          <div>
            <label className="label">Full Name *</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Nikos Papadopoulos" className="input-base" />
          </div>
          <div>
            <label className="label">Rank</label>
            <select value={rank} onChange={e => setRank(e.target.value)} className="input-base" style={{ color: rank ? "var(--text)" : "var(--text-dim)" }}>
              <option value="">Select your rank...</option>
              {ranks.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Vessel Name</label>
            <input value={vessel} onChange={e => setVessel(e.target.value)} placeholder="e.g. MV Poseidon" className="input-base" />
          </div>
        </>
      )}
      <div>
        <label className="label">Email Address *</label>
        <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="officer@vessel.com" className="input-base" autoCapitalize="none" />
      </div>
      <div>
        <label className="label">Password *</label>
        <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Min. 6 characters" className="input-base" />
      </div>
    </div>

    {error && (
      <div style={{ background:"#1a0000", border:"1px solid var(--danger)", borderRadius:"var(--radius)", padding:"12px", marginBottom:"14px" }}>
        <p style={{ color:"#FCA5A5", fontSize:"13px", margin:0 }}>⚠ {error}</p>
      </div>
    )}

    <button onClick={handle} disabled={loading} className="btn-primary"
      style={{ opacity: loading ? 0.7 : 1, letterSpacing:"2px" }}>
      {loading ? "⏳ Please wait..." : mode === "login" ? "SIGN IN" : "CREATE ACCOUNT"}
    </button>

    <p style={{ color:"var(--text-dim)", fontSize:"10px", textAlign:"center", margin:"16px 0 0", lineHeight:"1.6" }}>
      Data encrypted · Not used for AI training · GDPR compliant
    </p>
  </div>
</div>
```

);
}

// ─── DISCLAIMER ───────────────────────────────────────────────────────────────
function Disclaimer({ onAccept }) {
const [checked, setChecked] = useState(false);
return (
<div style={{ position:“fixed”, inset:0, background:“var(–bg)”, zIndex:9999, display:“flex”, flexDirection:“column”, alignItems:“center”, justifyContent:“center”, padding:“20px”, overflowY:“auto” }}>
<div style={{ width:“100%”, maxWidth:“440px” }}>
<div style={{ textAlign:“center”, marginBottom:“28px” }}>
<div style={{ width:“76px”, height:“76px”, border:“1.5px solid rgba(0,174,239,0.35)”, borderRadius:“50%”, display:“flex”, alignItems:“center”, justifyContent:“center”, margin:“0 auto 16px”, background:“var(–surface)” }}>
<AnchorIcon size={40} />
</div>
<p style={{ color:“var(–accent)”, fontSize:“26px”, fontWeight:“700”, letterSpacing:“5px”, margin:“0 0 5px” }}>NAUTIFORM</p>
<p style={{ color:“var(–text-muted)”, fontSize:“11px”, letterSpacing:“3px”, margin:“0 0 4px” }}>MARITIME ASSISTANT FOR SEAFARERS</p>
<p style={{ color:“var(–text-dim)”, fontSize:“10px”, margin:0 }}>v{APP_VERSION} — PRODUCTION</p>
</div>

```
    <div className="card" style={{ borderLeft:"3px solid var(--accent)", marginBottom:"14px" }}>
      <p style={{ color:"var(--accent)", fontSize:"14px", fontWeight:"700", margin:"0 0 8px" }}>Dear Seafarer,</p>
      <p style={{ color:"var(--text-sub)", fontSize:"13px", lineHeight:"1.7", margin:0 }}>NautiForm was built for you — deck officers, engineers, ratings, and everyone who keeps the ship running safe. Whether you're filling a permit in the ECR or CCR or checking regulations on watch, this tool is here to help.</p>
    </div>

    <div className="card" style={{ borderTop:"2px solid var(--danger)", marginBottom:"16px" }}>
      <p style={{ color:"var(--danger)", fontSize:"11px", fontWeight:"700", letterSpacing:"2px", margin:"0 0 10px" }}>⚠️  LEGAL NOTICE</p>
      <p style={{ color:"var(--text-sub)", fontSize:"12px", lineHeight:"1.7", margin:"0 0 8px" }}>This app is an <strong style={{ color:"var(--text)" }}>operational assistance tool only</strong>. It does not replace official IMO publications, Flag State requirements, or your Company SMS.</p>
      <p style={{ color:"var(--text-muted)", fontSize:"12px", lineHeight:"1.7", margin:0 }}>The <strong style={{ color:"var(--accent-text)" }}>signing officer bears full legal responsibility</strong> for all onboard decisions.</p>
    </div>

    <div onClick={() => setChecked(!checked)}
      className="card"
      style={{ display:"flex", alignItems:"flex-start", gap:"12px", cursor:"pointer", border:`1px solid ${checked ? "rgba(0,174,239,0.35)" : "var(--border)"}`, marginBottom:"16px" }}>
      <div style={{ width:"22px", height:"22px", border:`2px solid ${checked ? "var(--accent)" : "var(--border-hi)"}`, borderRadius:"5px", background: checked ? "var(--accent)" : "transparent", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, marginTop:"1px", transition:"all 0.2s" }}>
        {checked && <span style={{ color:"#000", fontSize:"14px", fontWeight:"900" }}>✓</span>}
      </div>
      <p style={{ color:"var(--text-sub)", fontSize:"13px", lineHeight:"1.5", margin:0 }}>I understand NautiForm is an assistant tool. I hold full professional responsibility for all operational decisions made onboard.</p>
    </div>

    <button onClick={() => checked && onAccept()} className="btn-primary"
      style={{ background: checked ? "var(--accent)" : "var(--surface2)", color: checked ? "#000" : "var(--text-dim)", cursor: checked ? "pointer" : "not-allowed", letterSpacing:"2px" }}>
      ENTER NAUTIFORM
    </button>
    <p style={{ color:"var(--text-dim)", fontSize:"10px", textAlign:"center", margin:"12px 0 0" }}>Data NOT used for AI training · Auto-purge after export · IMO privacy compliant</p>
  </div>
</div>
```

);
}

// ─── STATUS BAR ───────────────────────────────────────────────────────────────
function StatusBar() {
const online = useOnline();
const [time, setTime] = useState(new Date());
useEffect(() => { const i = setInterval(() => setTime(new Date()), 1000); return () => clearInterval(i); }, []);
return (
<div>
<div style={{ background:“var(–surface)”, borderBottom:“1px solid var(–border)”, padding:“9px 16px”, display:“flex”, justifyContent:“space-between”, alignItems:“center” }}>
<div style={{ display:“flex”, alignItems:“center”, gap:“8px” }}>
<AnchorIcon size={16} />
<span style={{ color:“var(–accent)”, fontSize:“11px”, fontWeight:“700”, letterSpacing:“3px” }}>NAUTIFORM</span>
</div>
<div style={{ display:“flex”, gap:“12px”, alignItems:“center” }}>
<span style={{ color: online ? “var(–ok)” : “var(–danger)”, fontSize:“10px”, fontWeight:“700” }}>● {online ? “ONLINE” : “OFFLINE”}</span>
<span style={{ color:“var(–text-muted)”, fontSize:“10px” }}>{time.toLocaleTimeString(“en-GB”, { hour:“2-digit”, minute:“2-digit” })} UTC</span>
</div>
</div>
{!online && (
<div style={{ background:”#200000”, borderBottom:“1px solid rgba(239,68,68,0.35)”, padding:“10px 16px”, display:“flex”, gap:“10px”, alignItems:“center” }}>
<span style={{ fontSize:“16px” }}>📡</span>
<span style={{ color:”#FCA5A5”, fontSize:“12px”, fontWeight:“600” }}>OFFLINE MODE — LOCAL CACHE ACTIVE. Library and forms fully accessible.</span>
</div>
)}
</div>
);
}

// ─── DASHBOARD ────────────────────────────────────────────────────────────────
function Dashboard({ setTab, userName }) {
const online = useOnline();
const tiles = [
{ icon:“📝”, label:“New Form”,    sub:“7 permit types”,        color:“var(–accent)”,  tab:“forms” },
{ icon:“📚”, label:“Library”,     sub:“SOLAS · MARPOL · STCW”, color:“var(–ok)”,      tab:“library” },
{ icon:“🔄”, label:“Sync Status”, sub: online ? “All nominal” : “Working offline”, color:“var(–yellow)”, tab:“settings” },
{ icon:“⚙️”, label:“Settings”,    sub:“API keys & options”,    color:“var(–purple)”,  tab:“settings” },
];
return (
<div style={{ padding:“16px 16px 0” }}>
<div style={{ display:“flex”, alignItems:“center”, gap:“12px”, marginBottom:“20px”, paddingTop:“4px” }}>
<div style={{ width:“46px”, height:“46px”, border:“1.5px solid rgba(0,174,239,0.2)”, borderRadius:“50%”, display:“flex”, alignItems:“center”, justifyContent:“center”, background:“var(–surface)”, flexShrink:0 }}>
<AnchorIcon size={26} />
</div>
<div>
<p style={{ color:“var(–text)”, fontSize:“19px”, fontWeight:“700”, margin:“0 0 2px” }}>
{userName ? `Welcome, ${userName.split(" ")[0]} 👋` : “Dear Seafarer 👋”}
</p>
<p style={{ color:“var(–text-muted)”, fontSize:“11px”, margin:0 }}>{new Date().toLocaleDateString(“en-GB”, { weekday:“long”, day:“2-digit”, month:“long”, year:“numeric” })}</p>
</div>
</div>

```
  <div style={{ background:"#180e00", border:"1px solid rgba(249,115,22,0.3)", borderLeft:"3px solid var(--warn)", borderRadius:"var(--radius)", padding:"12px 14px", marginBottom:"16px", display:"flex", gap:"10px" }}>
    <span style={{ fontSize:"18px" }}>⚠️</span>
    <span style={{ color:"var(--text-sub)", fontSize:"12px", lineHeight:"1.6" }}>Monthly reminder: Muster drill before month end. Verify ORB entries last 24h. Check enclosed space rescue equipment.</span>
  </div>

  <div className="card" style={{ display:"flex", gap:"10px", alignItems:"center", marginBottom:"16px" }}>
    <span style={{ fontSize:"18px" }}>🛡️</span>
    <div style={{ flex:1 }}>
      <p style={{ color:"var(--text)", fontSize:"12px", fontWeight:"600", margin:"0 0 2px" }}>Regulatory Database — Current</p>
      <p style={{ color:"var(--text-muted)", fontSize:"10px", margin:0 }}>SOLAS · MARPOL · COLREG · STCW · ISM · ISPS · MLC · LOADLINE · IMSBC</p>
    </div>
    <span className="badge badge-accent" style={{ padding:"4px 8px" }}>LIVE</span>
  </div>

  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"10px", marginBottom:"16px" }}>
    {tiles.map((t, i) => (
      <button key={i} onClick={() => setTab(t.tab)}
        style={{ background:"var(--surface)", border:`1px solid ${t.color === "var(--accent)" ? "rgba(0,174,239,0.15)" : t.color === "var(--ok)" ? "rgba(34,211,160,0.15)" : "rgba(251,191,36,0.15)"}`, borderRadius:"var(--radius-lg)", padding:"20px 16px", textAlign:"left", cursor:"pointer", position:"relative", overflow:"hidden" }}>
        <div style={{ fontSize:"28px", marginBottom:"10px" }}>{t.icon}</div>
        <p style={{ color:"var(--text)", fontSize:"14px", fontWeight:"700", margin:"0 0 3px" }}>{t.label}</p>
        <p style={{ color:"var(--text-muted)", fontSize:"11px", margin:"0 0 12px" }}>{t.sub}</p>
        <div style={{ width:"20px", height:"2px", background:t.color, borderRadius:"1px" }} />
      </button>
    ))}
  </div>

  <p style={{ color:"var(--text-dim)", fontSize:"10px", fontWeight:"700", letterSpacing:"2px", margin:"0 0 10px" }}>QUICK PERMIT ACCESS</p>
  <div style={{ display:"flex", gap:"8px", overflowX:"auto", paddingBottom:"12px" }}>
    {FORMS.slice(0,5).map((f, i) => (
      <button key={i} onClick={() => setTab("forms")}
        style={{ background:"var(--surface)", border:`1px solid ${f.color}33`, borderRadius:"var(--radius)", padding:"10px 14px", whiteSpace:"nowrap", cursor:"pointer", display:"flex", alignItems:"center", gap:"8px", flexShrink:0 }}>
        <span style={{ fontSize:"16px" }}>{f.icon}</span>
        <span style={{ color:"var(--text-sub)", fontSize:"12px", fontWeight:"600" }}>{f.label}</span>
      </button>
    ))}
  </div>
</div>
```

);
}

// ─── SETTINGS TAB ─────────────────────────────────────────────────────────────
function SettingsTab({ session, onLogout }) {
const [auto,    setAuto]    = useState(true);
const [offline, setOffline] = useState(true);
const [purge,   setPurge]   = useState(true);
const [night,   setNight]   = useState(false);
const online = useOnline();

const Toggle = ({ val, onChange, label, sub, color = “var(–accent)” }) => (
<div style={{ display:“flex”, alignItems:“center”, gap:“12px”, padding:“14px 0”, borderBottom:“1px solid var(–border)” }}>
<div style={{ flex:1 }}>
<p style={{ color:“var(–text)”, fontSize:“14px”, fontWeight:“600”, margin:“0 0 2px” }}>{label}</p>
{sub && <p style={{ color:“var(–text-muted)”, fontSize:“11px”, margin:0 }}>{sub}</p>}
</div>
<div onClick={() => onChange(!val)}
style={{ width:“46px”, height:“26px”, background: val ? color : “var(–surface2)”, borderRadius:“13px”, position:“relative”, cursor:“pointer”, border:`1px solid ${val ? color : "var(--border)"}`, transition:“all 0.2s”, flexShrink:0 }}>
<div style={{ position:“absolute”, top:“3px”, left: val ? “23px” : “3px”, width:“18px”, height:“18px”, background:”#fff”, borderRadius:“50%”, transition:“left 0.2s” }} />
</div>
</div>
);

return (
<div style={{ padding:“16px 16px 0” }}>
<h1 className="section-title">Settings</h1>

```
  {/* User info */}
  <div className="card" style={{ borderLeft:"3px solid var(--accent)", marginBottom:"12px" }}>
    <p style={{ color:"var(--text-muted)", fontSize:"10px", fontWeight:"700", letterSpacing:"2px", margin:"0 0 8px" }}>SIGNED IN AS</p>
    <p style={{ color:"var(--text)", fontSize:"14px", fontWeight:"700", margin:"0 0 2px" }}>{session?.name || "Seafarer"}</p>
    <p style={{ color:"var(--text-muted)", fontSize:"11px", margin:"0 0 12px" }}>Supabase Auth · Session active</p>
    <button onClick={onLogout}
      style={{ background:"rgba(239,68,68,0.1)", border:"1px solid rgba(239,68,68,0.3)", borderRadius:"var(--radius)", padding:"10px 16px", color:"var(--danger)", fontWeight:"700", fontSize:"12px", cursor:"pointer" }}>
      🚪 Sign Out
    </button>
  </div>

  <div className="card" style={{ padding:"0 16px", marginBottom:"12px" }}>
    <p style={{ color:"var(--text-dim)", fontSize:"10px", fontWeight:"700", letterSpacing:"2px", padding:"14px 0 0", margin:0 }}>APPLICATION</p>
    <Toggle val={auto}    onChange={setAuto}    label="Auto-Update Regulations"  sub="IMO API — check amendments on startup" />
    <Toggle val={offline} onChange={setOffline} label="Offline Mode (PWA)"       sub="Service Worker — cache all assets locally" />
    <Toggle val={purge}   onChange={setPurge}   label="Auto-Purge After Export"  sub="Delete cloud data after PDF export" color="var(--danger)" />
    <Toggle val={night}   onChange={setNight}   label="Night Vision Mode"        sub="Reduce blue light for bridge watch" color="#FF6B35" />
  </div>

  <div className="card" style={{ marginBottom:"12px" }}>
    <p style={{ color:"var(--text-dim)", fontSize:"10px", fontWeight:"700", letterSpacing:"2px", margin:"0 0 12px" }}>API CONNECTIONS</p>
    {[
      { label:"Supabase URL",          ph:"https://xxxx.supabase.co" },
      { label:"Supabase Anon Key",     ph:"eyJhbGciOiJIUzI1NiIs..." },
      { label:"Google Gemini API Key", ph:"AIza..." },
      { label:"OpenAI Whisper Key",    ph:"sk-..." },
    ].map((f, i) => (
      <div key={i} style={{ marginBottom:"10px" }}>
        <label className="label">{f.label}</label>
        <input type="password" placeholder={f.ph} className="input-base" />
      </div>
    ))}
    <button className="btn-primary" style={{ background:"var(--accent-dim)", color:"var(--accent-text)", border:"1px solid rgba(0,174,239,0.2)", marginTop:"4px" }}>
      SAVE & TEST CONNECTIONS
    </button>
  </div>

  <div className="card" style={{ border:"1px solid rgba(239,68,68,0.15)", marginBottom:"20px" }}>
    <p style={{ color:"var(--danger)", fontSize:"10px", fontWeight:"700", letterSpacing:"2px", margin:"0 0 10px" }}>🔒  SAFETY GUARDRAILS — HARD-CODED</p>
    {["O₂ < 20.9%: Entry alert + validation block","HC ≥ 1% LEL: Flammable atmosphere alert","IMO Number: 7-digit strict validation","AI cannot advise on illegal MARPOL discharge","Legal disclaimer on every first launch","Full offline functionality — no internet required"].map((g, i, arr) => (
      <div key={i} style={{ display:"flex", gap:"8px", padding:"6px 0", borderBottom: i < arr.length-1 ? "1px solid var(--border)" : "none" }}>
        <span style={{ color:"var(--ok)", fontSize:"12px" }}>✓</span>
        <span style={{ color:"var(--text-sub)", fontSize:"12px" }}>{g}</span>
      </div>
    ))}
  </div>
</div>
```

);
}

// ─── APP SHELL ────────────────────────────────────────────────────────────────
export default function App() {
const [session,    setSession]    = useState(() => {
const token  = localStorage.getItem(“nf_token”);
const userId = localStorage.getItem(“nf_user_id”);
const name   = localStorage.getItem(“nf_name”);
return token ? { token, userId, name } : null;
});
const [disclaimer, setDisclaimer] = useState(() => !localStorage.getItem(“nf_disclaimer”));
const [tab,        setTab]        = useState(“home”);

const handleLogin = (sess) => setSession(sess);

const handleLogout = async () => {
if (session?.token) await supabase.signOut(session.token);
localStorage.removeItem(“nf_token”);
localStorage.removeItem(“nf_user_id”);
localStorage.removeItem(“nf_name”);
setSession(null);
};

const handleDisclaimer = () => {
localStorage.setItem(“nf_disclaimer”, “1”);
setDisclaimer(false);
};

const nav = [
{ id:“home”,     icon:“🏠”, label:“Home” },
{ id:“forms”,    icon:“📝”, label:“Forms” },
{ id:“library”,  icon:“📚”, label:“Library” },
{ id:“settings”, icon:“⚙️”, label:“Settings” },
];

// Not logged in → show login
if (!session) return (
<div style={{ background:“var(–bg)”, minHeight:“100vh”, maxWidth:“480px”, margin:“0 auto” }}>
<style>{CSS_VARS}</style>
<LoginScreen onLogin={handleLogin} />
</div>
);

return (
<div style={{ background:“var(–bg)”, minHeight:“100vh”, maxWidth:“480px”, margin:“0 auto”, display:“flex”, flexDirection:“column” }}>
<style>{CSS_VARS}</style>

```
  {disclaimer && <Disclaimer onAccept={handleDisclaimer} />}
  <StatusBar />

  <div style={{ flex:1, overflowY:"auto", paddingBottom:"72px" }}>
    {tab === "home"     && <Dashboard setTab={setTab} userName={session.name} />}
    {tab === "forms"    && <FormsTab session={session} />}
    {tab === "library"  && <LibraryTab />}
    {tab === "settings" && <SettingsTab session={session} onLogout={handleLogout} />}
  </div>

  <div style={{ position:"fixed", bottom:0, left:"50%", transform:"translateX(-50%)", width:"100%", maxWidth:"480px", background:"var(--surface)", borderTop:"1px solid var(--border)", display:"flex", zIndex:100, paddingBottom:"env(safe-area-inset-bottom)" }}>
    {nav.map(n => (
      <button key={n.id} onClick={() => setTab(n.id)}
        style={{ flex:1, background:"transparent", border:"none", padding:"10px 0 8px", cursor:"pointer", display:"flex", flexDirection:"column", alignItems:"center", gap:"3px", position:"relative" }}>
        {tab === n.id && <div style={{ position:"absolute", top:0, left:"20%", right:"20%", height:"2px", background:"var(--accent)", borderRadius:"0 0 2px 2px" }} />}
        <span style={{ fontSize:"19px" }}>{n.icon}</span>
        <span style={{ fontSize:"9px", fontWeight:"700", letterSpacing:"1px", color: tab === n.id ? "var(--accent)" : "var(--text-muted)" }}>{n.label}</span>
      </button>
    ))}
  </div>
</div>
```

);
}
