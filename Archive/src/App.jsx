import React, { useState, useMemo, useRef, useEffect } from "react";
import {
  ComposedChart, Line, Bar, Area, AreaChart, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine,
} from "recharts";
import {
  LayoutDashboard, Map as MapIcon, Bell, Camera, Mountain, Bot, ChevronLeft,
  ChevronRight, ChevronDown, Search, User, Globe, LogOut, Droplets, Layers,
  X, Check, Send, Filter, Clock, MapPin, Image as ImageIcon, ShieldAlert,
  Radio, Sparkles, RefreshCw, Play, Pause, AlertTriangle, CloudRain,
  Activity, Route, ArrowUpRight, Menu, CheckCircle2, XCircle, Loader2,
  Video, PlusCircle, Satellite, Gauge, TrendingUp, ArrowUpDown, ShieldCheck,
} from "lucide-react";
import { MapContainer, TileLayer, Marker, Popup, Circle, Polygon, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";

/* ============================== DESIGN TOKENS ============================== */
const FONT_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600;700&display=swap');
`;

const LOGIN_BG = "linear-gradient(160deg, #E0F2FE 0%, #DBEAFE 45%, #DCFCE7 100%)";

const SEVERITY = {
  safe:     { c: "#22C55E", bg: "rgba(34,197,94,.13)",  ring: "rgba(34,197,94,.35)",  label: "Safe" },
  watch:    { c: "#EAB308", bg: "rgba(234,179,8,.14)",  ring: "rgba(234,179,8,.35)",  label: "Watch" },
  warning:  { c: "#F97316", bg: "rgba(249,115,22,.15)", ring: "rgba(249,115,22,.4)",  label: "Warning" },
  critical: { c: "#EF4444", bg: "rgba(239,68,68,.17)", ring: "rgba(239,68,68,.45)",  label: "Critical" },
};

const scoreToSeverity = (s) => (s >= 80 ? "critical" : s >= 60 ? "warning" : s >= 35 ? "watch" : "safe");

/* ============================== MOCK DATA ============================== */
const ZONES = [
  { id: "Z-04", name: "Sohra Ridge — Zone 4", district: "Sohra / Cherrapunji, Meghalaya", score: 88, rainfall: 92, soil: 81, slope: 42, insar: 14.2, villages: ["Mawsmai", "Nongriat", "Tyrna"], roads: ["NH206, km 12–15"], routes: ["Sohra → Shillong via NH206 (alt.)", "Foot trail to Laitkynsew relief camp"], lat: 25.28, lng: 91.72 },
  { id: "Z-11", name: "Dima Hasao Rail Corridor", district: "Dima Hasao, Assam", score: 90, rainfall: 88, soil: 84, slope: 39, insar: 16.8, villages: ["Harangajao", "New Haflong", "Mahur"], roads: ["NH27 realignment stretch"], routes: ["Rail diversion via Lumding loop", "NH27 southbound convoy route"], lat: 25.18, lng: 93.02 },
  { id: "Z-07", name: "Noney Hill Cut", district: "Noney, Manipur", score: 84, rainfall: 79, soil: 74, slope: 44, insar: 11.4, villages: ["Marram", "Tupul", "Khoupum"], roads: ["NH2 Tupul stretch"], routes: ["Tupul bypass (military-graded)", "Imphal relief corridor"], lat: 24.78, lng: 93.75 },
  { id: "Z-02", name: "Mawkyrwat Slope", district: "West Khasi Hills, Meghalaya", score: 71, rainfall: 68, soil: 62, slope: 33, insar: 8.1, villages: ["Mawkyrwat Town", "Nongstoin Rd."], roads: ["SH-5 Nongstoin link"], routes: ["SH-5 alternate via Ranikor"], lat: 25.30, lng: 91.08 },
  { id: "Z-09", name: "Gangtok NH10 Slope", district: "East Sikkim", score: 63, rainfall: 58, soil: 55, slope: 37, insar: 6.4, villages: ["Ranipool", "Singtam"], roads: ["NH10 km 78"], routes: ["NH10 single-lane pilot pass"], lat: 27.33, lng: 88.62 },
  { id: "Z-05", name: "Kalimpong–Teesta Corridor", district: "Kalimpong, WB (NE gateway)", score: 68, rainfall: 61, soil: 59, slope: 35, insar: 7.9, villages: ["Teesta Bazaar", "Melli"], roads: ["NH10 Teesta bank"], routes: ["Sevoke bypass"], lat: 27.06, lng: 88.47 },
  { id: "Z-03", name: "Ziro Valley Escarpment", district: "Lower Subansiri, Arunachal Pradesh", score: 46, rainfall: 44, soil: 40, slope: 24, insar: 3.2, villages: ["Hong", "Hija"], roads: ["Ziro–Old Ziro link"], routes: ["Ziro–Old Ziro link"], lat: 27.50, lng: 93.80 },
  { id: "Z-06", name: "Chandel Ridge", district: "Chandel, Manipur", score: 41, rainfall: 39, soil: 36, slope: 21, insar: 2.6, villages: ["Chandel Town"], roads: ["NH102B"], routes: ["NH102B"], lat: 24.45, lng: 94.20 },
  { id: "Z-10", name: "Kohima Bypass Slope", district: "Kohima, Nagaland", score: 22, rainfall: 26, soil: 24, slope: 14, insar: 1.1, villages: ["Jotsoma"], roads: ["Kohima bypass"], routes: ["Kohima bypass"], lat: 25.67, lng: 94.12 },
  { id: "Z-08", name: "Aizawl Tlangnuam Slope", district: "Aizawl, Mizoram", score: 38, rainfall: 34, soil: 33, slope: 19, insar: 2.0, villages: ["Tlangnuam", "Chaltlang"], roads: ["Aizawl inner ring"], routes: ["Aizawl inner ring"], lat: 23.73, lng: 92.72 },
].map((z) => ({ ...z, severity: scoreToSeverity(z.score) }));

const TREND_DATA = [
  { day: "Mon", rainfall: 34, risk: 41 },
  { day: "Tue", rainfall: 48, risk: 47 },
  { day: "Wed", rainfall: 61, risk: 55 },
  { day: "Thu", rainfall: 77, risk: 66 },
  { day: "Fri", rainfall: 95, risk: 78 },
  { day: "Sat", rainfall: 88, risk: 82 },
  { day: "Sun", rainfall: 92, risk: 86 },
];

const ALERTS = [
  { id: "A-1042", zone: "Dima Hasao Rail Corridor", severity: "critical", channel: "SMS + IVR", status: "delivered", time: "07:42", date: "Today", lang: "Assamese" },
  { id: "A-1041", zone: "Sohra Ridge — Zone 4", severity: "critical", channel: "SMS + Dashboard", status: "delivered", time: "06:58", date: "Today", lang: "Khasi" },
  { id: "A-1040", zone: "Noney Hill Cut", severity: "warning", channel: "IVR", status: "sent", time: "06:10", date: "Today", lang: "Manipuri" },
  { id: "A-1039", zone: "Gangtok NH10 Slope", severity: "warning", channel: "SMS", status: "failed", time: "22:31", date: "Yesterday", lang: "Nepali" },
  { id: "A-1038", zone: "Kalimpong–Teesta Corridor", severity: "warning", channel: "SMS + IVR", status: "delivered", time: "19:04", date: "Yesterday", lang: "English" },
  { id: "A-1037", zone: "Mawkyrwat Slope", severity: "watch", channel: "Dashboard", status: "delivered", time: "14:22", date: "Yesterday", lang: "English" },
  { id: "A-1036", zone: "Ziro Valley Escarpment", severity: "watch", channel: "SMS", status: "delivered", time: "09:15", date: "2 days ago", lang: "Hindi" },
];

const REPORTS = [
  { id: "R-518", type: "Field Officer", category: "Slope Movement", zone: "Sohra Ridge — Zone 4", loc: "25.28°N, 91.72°E", time: "12 min ago", verified: "verified", note: "Visible tension cracks widened along the ridge crest, ~40cm since last week's survey." },
  { id: "R-517", type: "Citizen", category: "Road Blockage", zone: "Noney Hill Cut", loc: "24.78°N, 93.75°E", time: "38 min ago", verified: "pending", note: "Debris covering both lanes near the Tupul curve, no vehicles can pass." },
  { id: "R-516", type: "Citizen", category: "Crack", zone: "Mawkyrwat Slope", loc: "25.30°N, 91.08°E", time: "1 hr ago", verified: "pending", note: "New crack appeared behind the community hall, roughly 3 metres long." },
  { id: "R-515", type: "Field Officer", category: "Slope Movement", zone: "Dima Hasao Rail Corridor", loc: "25.18°N, 93.02°E", time: "2 hr ago", verified: "verified", note: "Toe of the slope showing active seepage after last night's rainfall." },
  { id: "R-514", type: "Citizen", category: "Other", zone: "Gangtok NH10 Slope", loc: "27.33°N, 88.62°E", time: "3 hr ago", verified: "rejected", note: "Reported subsidence — checked, confirmed as pre-existing pothole." },
  { id: "R-513", type: "Citizen", category: "Road Blockage", zone: "Kalimpong–Teesta Corridor", loc: "27.06°N, 88.47°E", time: "5 hr ago", verified: "verified", note: "Landslip has taken out the shoulder of the NH10 near Teesta Bazaar." },
];

const LANGUAGES = ["English", "অসমীয়া (Assamese)", "हिन्दी (Hindi)", "Khasi", "Mizo ṭawng", "Manipuri"];
const CATEGORY_ICON = { Crack: AlertTriangle, "Slope Movement": Activity, "Road Blockage": Route, Other: ImageIcon };
const NAV = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "map", label: "Risk Map", icon: MapIcon },
  { id: "alerts", label: "Alerts", icon: Bell },
  { id: "reports", label: "Citizen Reports", icon: Camera },
  { id: "twin", label: "Digital Twin", icon: Mountain },
];

/* ============================== REGION COORDINATES ============================== */
const REGION_COORDINATES = {
  "All Districts (NER)": { lat: 25.5, lng: 92.0, zoom: 6 },
  "Sohra / Cherrapunji, Meghalaya": { lat: 25.28, lng: 91.72, zoom: 10 },
  "Dima Hasao, Assam": { lat: 25.18, lng: 93.02, zoom: 10 },
  "Noney, Manipur": { lat: 24.78, lng: 93.75, zoom: 10 },
  "West Khasi Hills, Meghalaya": { lat: 25.30, lng: 91.08, zoom: 10 },
  "East Sikkim": { lat: 27.33, lng: 88.62, zoom: 10 },
  "Kalimpong, WB (NE gateway)": { lat: 27.06, lng: 88.47, zoom: 10 },
  "Lower Subansiri, Arunachal Pradesh": { lat: 27.50, lng: 93.80, zoom: 10 },
  "Chandel, Manipur": { lat: 24.45, lng: 94.20, zoom: 10 },
  "Kohima, Nagaland": { lat: 25.67, lng: 94.12, zoom: 10 },
  "Aizawl, Mizoram": { lat: 23.73, lng: 92.72, zoom: 10 },
};

/* ============================== SHARED UI ============================== */
function SeverityBadge({ level, size = "sm" }) {
  const s = SEVERITY[level];
  const pad = size === "sm" ? "2px 8px" : "4px 11px";
  const fs = size === "sm" ? 11 : 12.5;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 6, padding: pad,
      borderRadius: 4, background: s.bg, border: `1px solid ${s.ring}`,
      color: s.c, fontSize: fs, fontWeight: 600, letterSpacing: ".04em",
      fontFamily: "Inter, sans-serif", textTransform: "uppercase", whiteSpace: "nowrap",
    }}>
      <span style={{ width: 6, height: 6, borderRadius: 99, background: s.c, boxShadow: level !== "safe" ? `0 0 6px ${s.c}` : "none" }} />
      {s.label}
    </span>
  );
}

function RiskGauge({ score, size = 92 }) {
  const sev = SEVERITY[scoreToSeverity(score)];
  const r = size / 2 - 8;
  const c = 2 * Math.PI * r;
  const pct = Math.min(100, Math.max(0, score)) / 100;
  return (
    <div style={{ position: "relative", width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size / 2} cy={size / 2} r={r} stroke="#E0F2FE" strokeWidth="7" fill="none" />
        <circle cx={size / 2} cy={size / 2} r={r} stroke={sev.c} strokeWidth="7" fill="none"
          strokeDasharray={c} strokeDashoffset={c * (1 - pct)} strokeLinecap="round"
          style={{ filter: `drop-shadow(0 0 4px ${sev.c}99)`, transition: "stroke-dashoffset .6s ease" }} />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <span style={{ fontFamily: "JetBrains Mono, monospace", fontWeight: 700, fontSize: size * 0.26, color: "#0F172A", lineHeight: 1 }}>{score}</span>
        <span style={{ fontSize: 9.5, color: "#5B6B84", letterSpacing: ".06em", marginTop: 2 }}>RISK</span>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, sub, accent = "#0EA5E9" }) {
  return (
    <div className="panel" style={{ padding: "16px 18px", display: "flex", flexDirection: "column", gap: 10, minWidth: 0 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ color: "#5B6B84", fontSize: 12.5, fontWeight: 500 }}>{label}</span>
        <div style={{ width: 28, height: 28, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", background: `${accent}1A` }}>
          <Icon size={15} color={accent} />
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
        <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 28, fontWeight: 700, color: "#0F172A" }}>{value}</span>
        {sub && <span style={{ fontSize: 12, color: "#5B6B84" }}>{sub}</span>}
      </div>
    </div>
  );
}

function ToggleSwitch({ checked, onChange, label, dotColor = "#0EA5E9" }) {
  return (
    <button onClick={() => onChange(!checked)} style={{
      display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10,
      background: "transparent", border: "none", cursor: "pointer", width: "100%", padding: "7px 0",
    }}>
      <span style={{ fontSize: 12.5, color: "#334155", display: "flex", alignItems: "center", gap: 7 }}>{label}</span>
      <span style={{
        width: 30, height: 17, borderRadius: 99, background: checked ? `${dotColor}33` : "#BAE6FD",
        border: `1px solid ${checked ? dotColor : "#93C5FD"}`, position: "relative", transition: "all .15s", flexShrink: 0,
      }}>
        <span style={{
          position: "absolute", top: 1, left: checked ? 14 : 1, width: 13, height: 13, borderRadius: 99,
          background: checked ? dotColor : "#94A3B8", transition: "left .15s",
          boxShadow: checked ? `0 0 5px ${dotColor}` : "none",
        }} />
      </span>
    </button>
  );
}

function LangDropdown({ value, onChange, compact }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ position: "relative" }}>
      <button onClick={() => setOpen(!open)} className="chip-btn" style={{ display: "flex", alignItems: "center", gap: 7 }}>
        <Globe size={13} color="#0284C7" />
        {!compact && <span>{value}</span>}
        <ChevronDown size={12} color="#0284C7" />
      </button>
      {open && (
        <div className="floaty" style={{ position: "absolute", top: "calc(100% + 6px)", right: 0, width: 190, zIndex: 40 }}>
          {LANGUAGES.map((l) => (
            <div key={l} onClick={() => { onChange(l); setOpen(false); }}
              style={{ padding: "8px 12px", fontSize: 13, color: l === value ? "#0EA5E9" : "#334155", cursor: "pointer", borderRadius: 5 }}
              onMouseEnter={(e) => e.currentTarget.style.background = "#E0F2FE"}
              onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>{l}</div>
          ))}
        </div>
      )}
    </div>
  );
}

function Toast({ toasts, remove }) {
  return (
    <div style={{ position: "fixed", top: 18, right: 18, zIndex: 200, display: "flex", flexDirection: "column", gap: 10, width: 320 }}>
      {toasts.map((t) => (
        <div key={t.id} className="panel" style={{
          padding: "13px 14px", display: "flex", gap: 10, alignItems: "flex-start",
          borderLeft: `3px solid ${t.tone === "error" ? "#EF4444" : "#0EA5E9"}`, animation: "slideIn .25s ease",
        }}>
          {t.tone === "error" ? <XCircle size={16} color="#EF4444" style={{ marginTop: 1 }} /> : <CheckCircle2 size={16} color="#0EA5E9" style={{ marginTop: 1 }} />}
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, color: "#0F172A", fontWeight: 600 }}>{t.title}</div>
            {t.body && <div style={{ fontSize: 12, color: "#5B6B84", marginTop: 2 }}>{t.body}</div>}
          </div>
          <X size={13} color="#5B6B84" style={{ cursor: "pointer", marginTop: 2 }} onClick={() => remove(t.id)} />
        </div>
      ))}
    </div>
  );
}

function EmptyState({ icon: Icon = Search, title, body }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "60px 20px", color: "#94A3B8" }}>
      <Icon size={30} style={{ marginBottom: 12, opacity: .6 }} />
      <div style={{ fontSize: 14, fontWeight: 600, color: "#5B6B84" }}>{title}</div>
      {body && <div style={{ fontSize: 12.5, marginTop: 4, textAlign: "center", maxWidth: 280 }}>{body}</div>}
    </div>
  );
}

function LoadingState({ label = "Loading live telemetry…" }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, padding: "60px 20px", color: "#5B6B84" }}>
      <Loader2 size={16} className="spin" />
      <span style={{ fontSize: 13 }}>{label}</span>
    </div>
  );
}

function ErrorState({ onRetry }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "50px 20px", gap: 10 }}>
      <AlertTriangle size={26} color="#F97316" />
      <div style={{ fontSize: 13.5, color: "#0F172A", fontWeight: 600 }}>Sensor feed unreachable</div>
      <div style={{ fontSize: 12.5, color: "#5B6B84" }}>Last known values are shown below. Retrying automatically.</div>
      <button onClick={onRetry} className="btn-ghost" style={{ marginTop: 4 }}><RefreshCw size={13} /> Retry now</button>
    </div>
  );
}

/* Generic sortable table */
function DataTable({ columns, rows, initialSort }) {
  const [sort, setSort] = useState(initialSort || { key: columns[0].key, dir: 1 });
  const sorted = useMemo(() => {
    return [...rows].sort((a, b) => {
      const av = a[sort.key], bv = b[sort.key];
      if (typeof av === "number") return (av - bv) * sort.dir;
      return String(av).localeCompare(String(bv)) * sort.dir;
    });
  }, [rows, sort]);
  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
        <thead>
          <tr>
            {columns.map((c) => (
              <th key={c.key} onClick={() => c.sortable !== false && setSort((s) => ({ key: c.key, dir: s.key === c.key ? -s.dir : 1 }))}
                style={{
                  textAlign: "left", padding: "9px 14px", color: "#5B6B84", fontWeight: 600, fontSize: 11.5,
                  letterSpacing: ".04em", textTransform: "uppercase", borderBottom: "1px solid #BAE6FD",
                  cursor: c.sortable !== false ? "pointer" : "default", whiteSpace: "nowrap", userSelect: "none",
                }}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                  {c.label}
                  {c.sortable !== false && <ArrowUpDown size={10} style={{ opacity: sort.key === c.key ? 1 : .35 }} />}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map((row, i) => (
            <tr key={i} style={{ borderBottom: "1px solid #E0F2FE" }}
              onMouseEnter={(e) => e.currentTarget.style.background = "#F0F9FF"}
              onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
              {columns.map((c) => (
                <td key={c.key} style={{ padding: "11px 14px", color: "#334155", verticalAlign: "middle" }}>
                  {c.render ? c.render(row) : row[c.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ============================== LOGIN ============================== */
function LoginScreen({ onLogin }) {
  const [role, setRole] = useState("District Admin");
  const [lang, setLang] = useState("English");
  const roles = [
    { id: "District Admin", desc: "Full command view across all districts", icon: ShieldCheck },
    { id: "Field Officer", desc: "Zone-level monitoring & ground reporting", icon: Activity },
    { id: "Citizen", desc: "View local risk & submit a report", icon: Camera },
  ];
  return (
    <div style={{ minHeight: "100vh", display: "flex", background: "#F5FAFF", fontFamily: "Inter, sans-serif" }}>
      <style>{FONT_CSS}{BASE_CSS}</style>
      {/* Left brand panel */}
      <div style={{ flex: "1 1 44%", position: "relative", overflow: "hidden", borderRight: "1px solid #DBEAFE", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "44px 48px" }}>
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage: `url(${LOGIN_BG})`, backgroundSize: "cover", backgroundPosition: "center",
          filter: "saturate(0.85) brightness(0.55)",
        }} />
        <div style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(180deg, rgba(11,18,32,.55) 0%, rgba(11,18,32,.55) 40%, #F5FAFF 100%), linear-gradient(90deg, rgba(11,18,32,.35) 0%, rgba(11,18,32,.75) 100%)",
        }} />
        <div style={{ position: "relative", zIndex: 2 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 34, height: 34, borderRadius: 8, background: "linear-gradient(135deg,#38BDF8,#0EA5E9)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Mountain size={18} color="#FFFFFF" />
            </div>
            <span style={{ fontSize: 19, fontWeight: 800, color: "#0F172A", letterSpacing: "-.01em" }}>SlopeSense</span>
          </div>
          <div style={{ fontSize: 12.5, color: "#5B6B84", marginTop: 6, marginLeft: 44 }}>Landslide Risk Monitoring &​amp; Early Warning · North Eastern Region</div>
        </div>
        <div style={{ position: "relative", zIndex: 2, maxWidth: 380 }}>
          <div style={{ fontSize: 30, fontWeight: 700, color: "#0F172A", lineHeight: 1.25, letterSpacing: "-.01em" }}>
            14 zones under active monitoring across seven states.
          </div>
          <div style={{ fontSize: 13.5, color: "#5B6B84", marginTop: 14, lineHeight: 1.6 }}>
            Real-time rainfall, soil moisture and InSAR deformation data, fused into a live risk score for every slope, road and village in the network.
          </div>
          <div style={{ display: "flex", gap: 22, marginTop: 26 }}>
            {[["8", "states covered"], ["620+", "sensors online"], ["24/7", "watch desk"]].map(([v, l]) => (
              <div key={l}>
                <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 20, fontWeight: 700, color: "#0EA5E9" }}>{v}</div>
                <div style={{ fontSize: 11, color: "#5B6B84" }}>{l}</div>
              </div>
            ))}
          </div>
        </div>
        <div style={{ position: "relative", zIndex: 2, fontSize: 11, color: "#94A3B8" }}>
          Ministry of Disaster Management · State Emergency Operations Network
        </div>
      </div>

      {/* Right form */}
      <div style={{ flex: "1 1 56%", display: "flex", alignItems: "center", justifyContent: "center", padding: 32 }}>
        <div style={{ width: 400 }}>
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 22 }}>
            <LangDropdown value={lang} onChange={setLang} />
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "#0F172A", margin: 0 }}>Sign in to your command console</h1>
          <p style={{ fontSize: 13, color: "#5B6B84", marginTop: 6, marginBottom: 26 }}>Select your role, then continue with your agency credentials.</p>

          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 22 }}>
            {roles.map((r) => (
              <div key={r.id} onClick={() => setRole(r.id)} style={{
                display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", borderRadius: 8, cursor: "pointer",
                border: `1px solid ${role === r.id ? "#0EA5E9" : "#BAE6FD"}`,
                background: role === r.id ? "rgba(14,165,233,.08)" : "#F0F9FF", transition: "all .12s",
              }}>
                <div style={{ width: 34, height: 34, borderRadius: 7, background: role === r.id ? "rgba(14,165,233,.15)" : "#E0F2FE", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <r.icon size={16} color={role === r.id ? "#0EA5E9" : "#5B6B84"} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 600, color: "#0F172A" }}>{r.id}</div>
                  <div style={{ fontSize: 11.5, color: "#5B6B84" }}>{r.desc}</div>
                </div>
                <div style={{ width: 15, height: 15, borderRadius: 99, border: `2px solid ${role === r.id ? "#0EA5E9" : "#93C5FD"}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {role === r.id && <div style={{ width: 7, height: 7, borderRadius: 99, background: "#0EA5E9" }} />}
                </div>
              </div>
            ))}
          </div>

          {role !== "Citizen" ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <label className="field-label">Agency ID or email</label>
              <input className="field-input" placeholder="e.g. dm.sohra@negov.in" />
              <label className="field-label">Password</label>
              <input className="field-input" type="password" placeholder="•••••••••••" />
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <label className="field-label">Mobile number</label>
              <input className="field-input" placeholder="+91 8XXXX XXXXX" />
              <div style={{ fontSize: 11.5, color: "#5B6B84" }}>We'll send a one-time code by SMS to verify.</div>
            </div>
          )}

          <button onClick={() => onLogin(role)} className="btn-primary" style={{ width: "100%", marginTop: 22, justifyContent: "center" }}>
            Continue as {role} <ArrowUpRight size={15} />
          </button>
          <div style={{ fontSize: 11.5, color: "#94A3B8", marginTop: 16, textAlign: "center" }}>
            By continuing you agree this session may be monitored for emergency-response quality.
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============================== TOP BAR + SIDEBAR ============================== */
function Sidebar({ view, setView, collapsed, setCollapsed, role, onLogout, openCopilot }) {
  return (
    <div style={{
      width: collapsed ? 68 : 224, flexShrink: 0, background: "#FFFFFF", borderRight: "1px solid #DBEAFE",
      display: "flex", flexDirection: "column", transition: "width .16s ease", position: "relative",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: collapsed ? "20px 0" : "20px 18px", justifyContent: collapsed ? "center" : "flex-start" }}>
        <div style={{ width: 30, height: 30, borderRadius: 7, background: "linear-gradient(135deg,#38BDF8,#0EA5E9)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Mountain size={16} color="#FFFFFF" />
        </div>
        {!collapsed && <span style={{ fontSize: 15.5, fontWeight: 800, color: "#0F172A" }}>SlopeSense</span>}
      </div>

      <nav style={{ padding: "10px 10px", display: "flex", flexDirection: "column", gap: 3, flex: 1 }}>
        {NAV.map((n) => {
          const active = view === n.id;
          return (
            <button key={n.id} onClick={() => setView(n.id)} title={n.label} style={{
              display: "flex", alignItems: "center", gap: 11, padding: collapsed ? "10px 0" : "10px 12px",
              justifyContent: collapsed ? "center" : "flex-start", borderRadius: 7, border: "none", cursor: "pointer",
              background: active ? "rgba(14,165,233,.1)" : "transparent",
              borderLeft: active ? "2px solid #0EA5E9" : "2px solid transparent",
              color: active ? "#0EA5E9" : "#5B6B84", fontSize: 13.5, fontWeight: 500, transition: "all .12s", width: "100%",
            }}>
              <n.icon size={17} />
              {!collapsed && <span>{n.label}</span>}
            </button>
          );
        })}
        <div style={{ height: 1, background: "#DBEAFE", margin: "8px 4px" }} />
        <button onClick={openCopilot} title="Copilot" style={{
          display: "flex", alignItems: "center", gap: 11, padding: collapsed ? "10px 0" : "10px 12px",
          justifyContent: collapsed ? "center" : "flex-start", borderRadius: 7, border: "1px dashed #93C5FD", cursor: "pointer",
          background: "rgba(14,165,233,.05)", color: "#0284C7", fontSize: 13.5, fontWeight: 500,
        }}>
          <Sparkles size={17} />
          {!collapsed && <span>Copilot</span>}
        </button>
      </nav>

      <div style={{ padding: "12px 10px", borderTop: "1px solid #DBEAFE" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 9, padding: "8px", borderRadius: 7 }}>
          <div style={{ width: 28, height: 28, borderRadius: 99, background: "#E0F2FE", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <User size={14} color="#5B6B84" />
          </div>
          {!collapsed && (
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12.5, color: "#0F172A", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{role}</div>
              <div style={{ fontSize: 10.5, color: "#5B6B84" }}>NER Watch Desk</div>
            </div>
          )}
          {!collapsed && <LogOut size={14} color="#5B6B84" style={{ cursor: "pointer" }} onClick={onLogout} />}
        </div>
        <button onClick={() => setCollapsed(!collapsed)} style={{
          width: "100%", marginTop: 6, background: "transparent", border: "none", color: "#94A3B8",
          display: "flex", justifyContent: "center", padding: 6, cursor: "pointer",
        }}>
          {collapsed ? <ChevronRight size={15} /> : <ChevronLeft size={15} />}
        </button>
      </div>
    </div>
  );
}

function TopBar({ title, subtitle, district, setDistrict, alertCount, onBell, role }) {
  const [open, setOpen] = useState(false);
  const summarySev = "warning";
  return (
    <div style={{
      height: 62, borderBottom: "1px solid #DBEAFE", display: "flex", alignItems: "center",
      justifyContent: "space-between", padding: "0 22px", flexShrink: 0, background: "#F5FAFF",
    }}>
      <div>
        <div style={{ fontSize: 16, fontWeight: 700, color: "#0F172A" }}>{title}</div>
        {subtitle && <div style={{ fontSize: 11.5, color: "#5B6B84" }}>{subtitle}</div>}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <div style={{ position: "relative" }}>
          <button onClick={() => setOpen(!open)} className="chip-btn" style={{ display: "flex", alignItems: "center", gap: 7 }}>
            <MapPin size={13} color="#0284C7" /> {district} <ChevronDown size={12} color="#0284C7" />
          </button>
          {open && (
            <div className="floaty" style={{ position: "absolute", top: "calc(100% + 6px)", left: 0, width: 250, zIndex: 40, maxHeight: 280, overflowY: "auto" }}>
              {["All Districts (NER)", ...ZONES.map((z) => z.district)].map((d) => (
                <div key={d} onClick={() => { setDistrict(d); setOpen(false); }}
                  style={{ padding: "8px 12px", fontSize: 12.5, color: d === district ? "#0EA5E9" : "#334155", cursor: "pointer", borderRadius: 5 }}
                  onMouseEnter={(e) => e.currentTarget.style.background = "#E0F2FE"}
                  onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>{d}</div>
              ))}
            </div>
          )}
        </div>

        <div className="chip-btn" style={{ display: "flex", alignItems: "center", gap: 8, cursor: "default" }}>
          <span style={{ width: 7, height: 7, borderRadius: 99, background: SEVERITY[summarySev].c, boxShadow: `0 0 6px ${SEVERITY[summarySev].c}` }} />
          Regional risk: <span style={{ color: SEVERITY[summarySev].c, fontWeight: 700 }}>Warning</span>
        </div>

        <button onClick={onBell} style={{ position: "relative", background: "transparent", border: "none", cursor: "pointer", padding: 6 }}>
          <Bell size={18} color="#334155" />
          {alertCount > 0 && (
            <span style={{
              position: "absolute", top: 2, right: 2, minWidth: 15, height: 15, borderRadius: 99, background: "#EF4444",
              fontSize: 9.5, color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700,
              boxShadow: "0 0 6px #EF444499",
            }}>{alertCount}</span>
          )}
        </button>
        <div style={{ width: 30, height: 30, borderRadius: 99, background: "#E0F2FE", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <User size={15} color="#5B6B84" />
        </div>
      </div>
    </div>
  );
}

/* ============================== DASHBOARD ============================== */
function DashboardScreen({ pushToast, goMap, setSelectedZoneId }) {
  const critical = ZONES.filter((z) => z.severity === "critical" || z.severity === "warning");
  const villagesAtRisk = new Set(critical.flatMap((z) => z.villages)).size;
  const roadsAffected = new Set(critical.flatMap((z) => z.roads)).size + 3;

  const columns = [
    { key: "name", label: "Zone", render: (r) => (
      <div>
        <div style={{ color: "#0F172A", fontWeight: 600 }}>{r.name}</div>
        <div style={{ fontSize: 11, color: "#5B6B84" }}>{r.district}</div>
      </div>
    )},
    { key: "score", label: "Risk Score", render: (r) => <span style={{ fontFamily: "JetBrains Mono, monospace", fontWeight: 700, color: SEVERITY[r.severity].c }}>{r.score}</span> },
    { key: "severity", label: "Severity", render: (r) => <SeverityBadge level={r.severity} /> },
    { key: "villagesCount", label: "Villages", render: (r) => `${r.villages.length} at risk` },
    { key: "action", label: "", sortable: false, render: (r) => (
      <button className="btn-ghost" style={{ fontSize: 11.5, padding: "5px 10px" }}
        onClick={() => { setSelectedZoneId(r.id); goMap(); }}>
        Open on map <ArrowUpRight size={12} />
      </button>
    )},
  ];
  const rows = ZONES.map((z) => ({ ...z, villagesCount: z.villages.length })).sort((a, b) => b.score - a.score);

  return (
    <div style={{ padding: 22, display: "flex", flexDirection: "column", gap: 18 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14 }}>
        <StatCard icon={ShieldAlert} label="Active Risk Zones" value="14" sub="+2 vs yesterday" accent="#F97316" />
        <StatCard icon={Route} label="Roads Affected" value={roadsAffected} sub="3 fully blocked" accent="#EAB308" />
        <StatCard icon={MapPin} label="Villages at Risk" value={villagesAtRisk} sub="across 6 districts" accent="#EF4444" />
        <StatCard icon={Send} label="Alerts Sent Today" value="9" sub="2 SMS deliveries pending" accent="#0EA5E9" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 14 }}>
        <div className="panel" style={{ padding: 18 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
            <div style={{ fontSize: 13.5, fontWeight: 700, color: "#0F172A" }}>Rainfall vs. regional risk score — 7 days</div>
            <div style={{ display: "flex", gap: 14, fontSize: 11.5, color: "#5B6B84" }}>
              <span><span style={{ display: "inline-block", width: 8, height: 8, borderRadius: 2, background: "#0EA5E9", marginRight: 5 }} />Rainfall (mm)</span>
              <span><span style={{ display: "inline-block", width: 8, height: 8, borderRadius: 2, background: "#F97316", marginRight: 5 }} />Risk score</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <ComposedChart data={TREND_DATA} margin={{ top: 10, right: 6, left: -18, bottom: 0 }}>
              <defs>
                <linearGradient id="riskFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#F97316" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#F97316" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#E0F2FE" vertical={false} />
              <XAxis dataKey="day" tick={{ fill: "#5B6B84", fontSize: 11.5 }} axisLine={{ stroke: "#BAE6FD" }} tickLine={false} />
              <YAxis tick={{ fill: "#5B6B84", fontSize: 11.5 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: "#FFFFFF", border: "1px solid #7DD3FC", borderRadius: 8, fontSize: 12 }} labelStyle={{ color: "#0F172A" }} />
              <Bar dataKey="rainfall" fill="#38BDF8" radius={[3, 3, 0, 0]} barSize={20} />
              <Area type="monotone" dataKey="risk" stroke="#F97316" fill="url(#riskFill)" strokeWidth={2.4} dot={{ r: 3, fill: "#F97316" }} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        <div className="panel" style={{ padding: 18, display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 13.5, fontWeight: 700, color: "#0F172A", marginBottom: 12 }}>Recent alerts</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, overflowY: "auto", maxHeight: 220 }}>
            {ALERTS.slice(0, 5).map((a) => (
              <div key={a.id} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                <span style={{ width: 7, height: 7, borderRadius: 99, background: SEVERITY[a.severity].c, marginTop: 5, flexShrink: 0, boxShadow: a.severity === "critical" ? `0 0 5px ${SEVERITY[a.severity].c}` : "none" }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12.5, color: "#0F172A", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.zone}</div>
                  <div style={{ fontSize: 11, color: "#5B6B84" }}>{a.channel} · {a.time}</div>
                </div>
              </div>
            ))}
          </div>
          <button className="btn-ghost" style={{ marginTop: 12, justifyContent: "center" }} onClick={() => pushToast("Opening full alert timeline…")}>View all alerts</button>
        </div>
      </div>

      <div className="panel" style={{ padding: 18 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <div style={{ fontSize: 13.5, fontWeight: 700, color: "#0F172A" }}>Emergency response priority</div>
          <div style={{ fontSize: 11.5, color: "#5B6B84" }}>Sorted by risk score · click a column to re-sort</div>
        </div>
        <DataTable columns={columns} rows={rows} initialSort={{ key: "score", dir: -1 }} />
      </div>
    </div>
  );
}

/* ============================== RISK MAP ============================== */
function MapController({ district }) {
  const map = useMap();

  useEffect(() => {
    const coords = REGION_COORDINATES[district];
    if (coords) {
      map.flyTo([coords.lat, coords.lng], coords.zoom, {
        duration: 1.5,
        easeLinearity: 0.25
      });
    } else {
      console.warn(`No coordinates found for district: ${district}, using default`);
      map.flyTo([25.5, 92.0], 6);
    }
  }, [district, map]);

  return null;
}

function RiskMapScreen({ selectedZoneId, setSelectedZoneId, pushToast, district }) {
  const [layers, setLayers] = useState({ rainfall: true, soil: false, terrain: true, roads: true, villages: true, insar: false });
  const [dayOffset, setDayOffset] = useState(0); // -3..4
  const zone = ZONES.find((z) => z.id === selectedZoneId);

  const adj = (base) => Math.max(2, Math.min(99, Math.round(base + dayOffset * 3.4)));

  const initialCoords = REGION_COORDINATES[district] || REGION_COORDINATES["All Districts (NER)"];

  return (
    <div style={{ position: "relative", flex: 1, display: "flex", minHeight: 0 }}>
      <div style={{ flex: 1, position: "relative", overflow: "hidden" }}>
        <MapContainer
          center={[initialCoords.lat, initialCoords.lng]}
          zoom={initialCoords.zoom}
          style={{ height: "100%", width: "100%" }}
          zoomControl={false}
        >
          <TileLayer
            attribution='&​copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapController district={district} />
          
          {ZONES.map((z) => {
            const s = adj(z.score);
            const sev = scoreToSeverity(s);
            const col = SEVERITY[sev];
            const active = selectedZoneId === z.id;
            return (
              <Circle 
                key={z.id}
                center={[z.lat, z.lng]}
                radius={active ? 8000 : 5000}
                pathOptions={{
                  color: col.c,
                  fillColor: col.c,
                  fillOpacity: active ? 0.5 : 0.3,
                  weight: active ? 3 : 2,
                }}
                eventHandlers={{
                  click: () => setSelectedZoneId(z.id),
                }}
              >
                {active && (
                  <Popup>
                    <div style={{ fontFamily: "Inter, sans-serif" }}>
                      <strong>{z.name}</strong><br />
                      {z.district}<br />
                      Risk Score: {s}
                    </div>
                  </Popup>
                )}
              </Circle>
            );
          })}
        </MapContainer>

        {/* Layer toggle panel */}
        <div className="floaty" style={{ position: "absolute", top: 16, left: 16, width: 216, padding: "12px 14px", zIndex: 1000 }}>
          <div style={{ fontSize: 11.5, fontWeight: 700, color: "#5B6B84", letterSpacing: ".04em", textTransform: "uppercase", marginBottom: 4 }}>Map layers</div>
          <ToggleSwitch checked={layers.rainfall} onChange={(v) => setLayers({ ...layers, rainfall: v })} label={<><CloudRain size={13} /> Rainfall</>} dotColor="#0EA5E9" />
          <ToggleSwitch checked={layers.soil} onChange={(v) => setLayers({ ...layers, soil: v })} label={<><Droplets size={13} /> Soil moisture</>} dotColor="#0EA5E9" />
          <ToggleSwitch checked={layers.terrain} onChange={(v) => setLayers({ ...layers, terrain: v })} label={<><Mountain size={13} /> Terrain / slope</>} dotColor="#94A3B8" />
          <ToggleSwitch checked={layers.roads} onChange={(v) => setLayers({ ...layers, roads: v })} label={<><Route size={13} /> Roads</>} dotColor="#F59E0B" />
          <ToggleSwitch checked={layers.villages} onChange={(v) => setLayers({ ...layers, villages: v })} label={<><MapPin size={13} /> Villages</>} dotColor="#0369A1" />
          <ToggleSwitch checked={layers.insar} onChange={(v) => setLayers({ ...layers, insar: v })} label={<><Satellite size={13} /> InSAR deformation</>} dotColor="#A855F7" />
        </div>

        {/* Legend */}
        <div className="floaty" style={{ position: "absolute", bottom: 84, left: 16, padding: "10px 14px", display: "flex", gap: 14 }}>
          {Object.entries(SEVERITY).map(([k, v]) => (
            <span key={k} style={{ fontSize: 11, color: "#334155", display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ width: 8, height: 8, borderRadius: 2, background: v.c }} /> {v.label}
            </span>
          ))}
        </div>

        {/* Time slider */}
        <div className="floaty" style={{ position: "absolute", bottom: 16, left: 16, right: selectedZoneId ? 372 : 16, padding: "12px 18px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#5B6B84", marginBottom: 6 }}>
            <span>-3d (history)</span>
            <span style={{ color: "#0EA5E9", fontFamily: "JetBrains Mono, monospace", fontWeight: 600 }}>
              {dayOffset === 0 ? "Now" : dayOffset > 0 ? `+${dayOffset}d forecast` : `${dayOffset}d history`}
            </span>
            <span>+4d (forecast)</span>
          </div>
          <input type="range" min={-3} max={4} step={1} value={dayOffset} onChange={(e) => setDayOffset(Number(e.target.value))} className="slider" />
        </div>
      </div>

      {/* Side detail panel */}
      {zone && (
        <div style={{ width: 340, flexShrink: 0, borderLeft: "1px solid #DBEAFE", background: "#FFFFFF", overflowY: "auto", padding: 18 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: "#0F172A" }}>{zone.name}</div>
              <div style={{ fontSize: 11.5, color: "#5B6B84" }}>{zone.district}</div>
            </div>
            <X size={16} color="#5B6B84" style={{ cursor: "pointer" }} onClick={() => setSelectedZoneId(null)} />
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 16, margin: "16px 0" }}>
            <RiskGauge score={adj(zone.score)} size={82} />
            <div>
              <SeverityBadge level={scoreToSeverity(adj(zone.score))} size="md" />
              <div style={{ fontSize: 11, color: "#5B6B84", marginTop: 8 }}>Updated 4 min ago via {zone.insar > 5 ? "InSAR + ground sensor" : "ground sensor"} fusion</div>
            </div>
          </div>

          <div style={{ fontSize: 11.5, fontWeight: 700, color: "#5B6B84", textTransform: "uppercase", letterSpacing: ".04em", marginBottom: 8 }}>Contributing factors</div>
          {[["Rainfall (72h)", zone.rainfall, "%", "#0EA5E9"], ["Soil moisture", zone.soil, "%", "#0EA5E9"], ["Slope gradient", zone.slope, "°", "#94A3B8"], ["InSAR displacement", zone.insar, " mm/yr", "#A855F7"]].map(([label, val, unit, c]) => (
            <div key={label} style={{ marginBottom: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#334155", marginBottom: 3 }}>
                <span>{label}</span><span style={{ fontFamily: "JetBrains Mono, monospace", color: "#0F172A" }}>{val}{unit}</span>
              </div>
              <div style={{ height: 5, borderRadius: 3, background: "#E0F2FE" }}>
                <div style={{ width: `${Math.min(100, val)}%`, height: "100%", borderRadius: 3, background: c }} />
              </div>
            </div>
          ))}

          <div style={{ fontSize: 11.5, fontWeight: 700, color: "#5B6B84", textTransform: "uppercase", letterSpacing: ".04em", margin: "16px 0 8px" }}>Villages nearby</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {zone.villages.map((v) => <span key={v} className="chip-btn" style={{ cursor: "default" }}>{v}</span>)}
          </div>

          <div style={{ fontSize: 11.5, fontWeight: 700, color: "#5B6B84", textTransform: "uppercase", letterSpacing: ".04em", margin: "16px 0 8px" }}>Evacuation routes</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {zone.routes.map((r) => (
              <div key={r} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12.5, color: "#334155" }}>
                <Route size={13} color="#0EA5E9" /> {r}
              </div>
            ))}
          </div>

          <button className="btn-primary" style={{ width: "100%", justifyContent: "center", marginTop: 20 }}
            onClick={() => pushToast(`Draft alert opened for ${zone.name}`, "Switch to Alerts to review and send.")}>
            <Send size={14} /> Draft alert for this zone
          </button>
        </div>
      )}
    </div>
  );
}

/* ============================== ALERTS ============================== */
function CreateAlertDrawer({ onClose, onSend }) {
  const [step, setStep] = useState(1);
  const [zoneId, setZoneId] = useState(ZONES[0].id);
  const [channels, setChannels] = useState({ SMS: true, IVR: false, Dashboard: true });
  const [lang, setLang] = useState("English");
  const zone = ZONES.find((z) => z.id === zoneId);
  const msg = `⚠ ${SEVERITY[zone.severity].label.toUpperCase()} landslide risk near ${zone.name}. Residents of ${zone.villages[0]} and nearby areas should move to higher ground and avoid ${zone.roads[0]}. Follow instructions from field officers.`;

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(5,9,18,.6)", zIndex: 100, display: "flex", justifyContent: "flex-end" }} onClick={onClose}>
      <div className="panel" style={{ width: 460, height: "100%", borderRadius: 0, padding: 24, overflowY: "auto" }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: "#0F172A" }}>Create manual alert</div>
          <X size={17} color="#5B6B84" style={{ cursor: "pointer" }} onClick={onClose} />
        </div>
        <div style={{ display: "flex", gap: 6, margin: "16px 0 22px" }}>
          {[1, 2, 3].map((s) => <div key={s} style={{ flex: 1, height: 3, borderRadius: 2, background: s <= step ? "#0EA5E9" : "#BAE6FD" }} />)}
        </div>

        {step === 1 && (
          <>
            <div style={{ fontSize: 12, color: "#5B6B84", marginBottom: 10 }}>Step 1 · Select a zone</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 420, overflowY: "auto" }}>
              {ZONES.map((z) => (
                <div key={z.id} onClick={() => setZoneId(z.id)} style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 12px", borderRadius: 7, cursor: "pointer",
                  border: `1px solid ${zoneId === z.id ? "#0EA5E9" : "#BAE6FD"}`, background: zoneId === z.id ? "rgba(14,165,233,.08)" : "#F0F9FF",
                }}>
                  <div>
                    <div style={{ fontSize: 13, color: "#0F172A", fontWeight: 600 }}>{z.name}</div>
                    <div style={{ fontSize: 11, color: "#5B6B84" }}>{z.district}</div>
                  </div>
                  <SeverityBadge level={z.severity} />
                </div>
              ))}
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <div style={{ fontSize: 12, color: "#5B6B84", marginBottom: 10 }}>Step 2 · Choose delivery channels</div>
            <div className="panel" style={{ padding: 14 }}>
              {Object.keys(channels).map((c) => (
                <ToggleSwitch key={c} checked={channels[c]} onChange={(v) => setChannels({ ...channels, [c]: v })}
                  label={<>{c === "SMS" ? <Radio size={13} /> : c === "IVR" ? <Bell size={13} /> : <LayoutDashboard size={13} />} {c}</>} />
              ))}
            </div>
            <div style={{ marginTop: 16 }}>
              <label className="field-label">Message language</label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 6 }}>
                {LANGUAGES.map((l) => (
                  <span key={l} onClick={() => setLang(l)} className="chip-btn" style={{ borderColor: lang === l ? "#0EA5E9" : "#BAE6FD", color: lang === l ? "#0EA5E9" : "#334155" }}>{l}</span>
                ))}
              </div>
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <div style={{ fontSize: 12, color: "#5B6B84", marginBottom: 10 }}>Step 3 · Preview &​amp; send</div>
            <div className="panel" style={{ padding: 14, marginBottom: 14 }}>
              <div style={{ fontSize: 11, color: "#5B6B84", marginBottom: 6 }}>{lang} · {zone.name}</div>
              <textarea defaultValue={msg} className="field-input" style={{ width: "100%", minHeight: 110, resize: "vertical" }} />
            </div>
            <div style={{ fontSize: 12, color: "#5B6B84", marginBottom: 6 }}>Sending via</div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {Object.entries(channels).filter(([, v]) => v).map(([c]) => <span key={c} className="chip-btn" style={{ cursor: "default" }}>{c}</span>)}
            </div>
            <div style={{ fontSize: 11.5, color: "#5B6B84", marginTop: 10 }}>Estimated reach: {zone.villages.length * 180}+ residents across {zone.villages.length} villages.</div>
          </>
        )}

        <div style={{ display: "flex", gap: 10, marginTop: 26 }}>
          {step > 1 && <button className="btn-ghost" onClick={() => setStep(step - 1)}>Back</button>}
          {step < 3 ? (
            <button className="btn-primary" style={{ flex: 1, justifyContent: "center" }} onClick={() => setStep(step + 1)}>Next</button>
          ) : (
            <button className="btn-primary" style={{ flex: 1, justifyContent: "center" }} onClick={() => onSend(zone)}>
              <Send size={14} /> Send alert now
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function AlertsScreen({ pushToast }) {
  const [severityFilter, setSeverityFilter] = useState("All");
  const [drawer, setDrawer] = useState(false);
  const [alerts, setAlerts] = useState(ALERTS);

  const filtered = severityFilter === "All" ? alerts : alerts.filter((a) => a.severity === severityFilter);
  const statusIcon = { delivered: <CheckCircle2 size={14} color="#22C55E" />, sent: <Clock size={14} color="#EAB308" />, failed: <XCircle size={14} color="#EF4444" /> };

  const columns = [
    { key: "id", label: "Alert" },
    { key: "zone", label: "Zone" },
    { key: "severity", label: "Severity", render: (r) => <SeverityBadge level={r.severity} /> },
    { key: "channel", label: "Channel" },
    { key: "lang", label: "Language" },
    { key: "status", label: "Status", render: (r) => <span style={{ display: "flex", alignItems: "center", gap: 6, textTransform: "capitalize" }}>{statusIcon[r.status]} {r.status}</span> },
    { key: "time", label: "Time", render: (r) => <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 12 }}>{r.date} · {r.time}</span> },
  ];

  return (
    <div style={{ padding: 22 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <Filter size={14} color="#5B6B84" />
          {["All", "critical", "warning", "watch"].map((s) => (
            <span key={s} onClick={() => setSeverityFilter(s)} className="chip-btn"
              style={{ borderColor: severityFilter === s ? "#0EA5E9" : "#BAE6FD", color: severityFilter === s ? "#0EA5E9" : "#334155", textTransform: "capitalize" }}>{s}</span>
          ))}
        </div>
        <button className="btn-primary" onClick={() => setDrawer(true)}><PlusCircle size={14} /> Create manual alert</button>
      </div>

      <div className="panel" style={{ padding: 6 }}>
        {filtered.length ? <DataTable columns={columns} rows={filtered} initialSort={{ key: "id", dir: -1 }} /> : <EmptyState title="No alerts match this filter" body="Try a different severity or check back after the next sensor sweep." />}
      </div>

      {drawer && (
        <CreateAlertDrawer onClose={() => setDrawer(false)} onSend={(zone) => {
          const newAlert = { id: `A-${1043 + alerts.length}`, zone: zone.name, severity: zone.severity, channel: "SMS + Dashboard", status: "sent", time: "Now", date: "Today", lang: "English" };
          setAlerts([newAlert, ...alerts]);
          setDrawer(false);
          pushToast("Alert sent", `${zone.name} — dispatched to residents and field teams.`);
        }} />
      )}
    </div>
  );
}

/* ============================== CITIZEN / FIELD REPORTING ============================== */
function ReportCard({ r, onOpen }) {
  const Icon = CATEGORY_ICON[r.category];
  const vColor = r.verified === "verified" ? "#22C55E" : r.verified === "rejected" ? "#EF4444" : "#EAB308";
  return (
    <div className="panel" style={{ overflow: "hidden", cursor: "pointer" }} onClick={() => onOpen(r)}>
      <div style={{ height: 110, background: "linear-gradient(135deg, #DBEAFE, #E0F2FE)", display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
        <Icon size={26} color="#38BDF8" />
        <span style={{ position: "absolute", top: 8, left: 8, fontSize: 10, padding: "3px 7px", borderRadius: 4, background: "rgba(11,18,32,.8)", color: "#334155" }}>{r.type}</span>
        <span style={{ position: "absolute", top: 8, right: 8, fontSize: 10, padding: "3px 7px", borderRadius: 4, background: `${vColor}22`, color: vColor, textTransform: "capitalize", fontWeight: 600 }}>{r.verified}</span>
      </div>
      <div style={{ padding: "10px 12px" }}>
        <div style={{ fontSize: 12.5, fontWeight: 600, color: "#0F172A" }}>{r.category}</div>
        <div style={{ fontSize: 11.5, color: "#5B6B84", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.zone}</div>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, fontSize: 10.5, color: "#5B6B84" }}>
          <span style={{ display: "flex", alignItems: "center", gap: 4 }}><MapPin size={10} /> {r.loc}</span>
          <span>{r.time}</span>
        </div>
      </div>
    </div>
  );
}

function ReportDetail({ r, onClose, onVerify }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(5,9,18,.65)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={onClose}>
      <div className="panel" style={{ width: 520, maxHeight: "86vh", overflowY: "auto" }} onClick={(e) => e.stopPropagation()}>
        <div style={{ height: 160, background: "linear-gradient(135deg,#DBEAFE,#E0F2FE)", position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
          {React.createElement(CATEGORY_ICON[r.category], { size: 34, color: "#38BDF8" })}
          <X size={17} color="#334155" style={{ position: "absolute", top: 10, right: 10, cursor: "pointer" }} onClick={onClose} />
        </div>
        <div style={{ padding: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: "#0F172A" }}>{r.category}</div>
              <div style={{ fontSize: 12, color: "#5B6B84" }}>{r.zone} · {r.time}</div>
            </div>
            <span className="chip-btn" style={{ cursor: "default" }}>{r.type}</span>
          </div>
          <p style={{ fontSize: 13, color: "#334155", lineHeight: 1.6, marginTop: 14 }}>{r.note}</p>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 10, fontSize: 12, color: "#5B6B84" }}>
            <MapPin size={13} color="#0EA5E9" /> {r.loc}
          </div>
          <div style={{ fontSize: 11.5, fontWeight: 700, color: "#5B6B84", textTransform: "uppercase", letterSpacing: ".04em", margin: "18px 0 8px" }}>Verification status</div>
          <div style={{ display: "flex", gap: 8 }}>
            {["pending", "verified", "rejected"].map((v) => (
              <button key={v} onClick={() => onVerify(r.id, v)} style={{
                flex: 1, padding: "8px 0", borderRadius: 6, fontSize: 12, textTransform: "capitalize", cursor: "pointer",
                border: `1px solid ${r.verified === v ? SEVERITY[v === "verified" ? "safe" : v === "rejected" ? "critical" : "watch"].c : "#BAE6FD"}`,
                background: r.verified === v ? SEVERITY[v === "verified" ? "safe" : v === "rejected" ? "critical" : "watch"].bg : "transparent",
                color: r.verified === v ? SEVERITY[v === "verified" ? "safe" : v === "rejected" ? "critical" : "watch"].c : "#5B6B84",
              }}>{v}</button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function MobileCitizenApp({ pushToast }) {
  const [screen, setScreen] = useState("feed");
  const [category, setCategory] = useState(null);
  return (
    <div style={{ width: 300, height: 610, borderRadius: 28, border: "6px solid #E0F2FE", background: "#F5FAFF", overflow: "hidden", display: "flex", flexDirection: "column", boxShadow: "0 20px 60px rgba(0,0,0,.5)" }}>
      <div style={{ height: 22, display: "flex", alignItems: "center", justifyContent: "center", background: "#FFFFFF" }}>
        <div style={{ width: 70, height: 5, borderRadius: 4, background: "#E0F2FE" }} />
      </div>
      {screen === "feed" && (
        <div style={{ flex: 1, overflowY: "auto", padding: 14 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: "#0F172A", marginBottom: 2 }}>Your area</div>
          <div style={{ fontSize: 11.5, color: "#5B6B84", marginBottom: 14 }}>Sohra / Cherrapunji · updated 3 min ago</div>
          <div className="panel" style={{ padding: 14, display: "flex", alignItems: "center", gap: 12, marginBottom: 14, borderLeft: "3px solid #EF4444" }}>
            <RiskGauge score={88} size={54} />
            <div>
              <SeverityBadge level="critical" />
              <div style={{ fontSize: 11.5, color: "#5B6B84", marginTop: 5 }}>Move to higher ground if instructed by field officers.</div>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {REPORTS.slice(0, 3).map((r) => (
              <div key={r.id} className="panel" style={{ padding: 10, display: "flex", gap: 10, alignItems: "center" }}>
                <div style={{ width: 40, height: 40, borderRadius: 7, background: "#DBEAFE", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  {React.createElement(CATEGORY_ICON[r.category], { size: 16, color: "#0284C7" })}
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 12, color: "#0F172A", fontWeight: 600 }}>{r.category}</div>
                  <div style={{ fontSize: 10.5, color: "#5B6B84", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.time} · {r.type}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      {screen === "category" && (
        <div style={{ flex: 1, padding: 14 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: "#0F172A", marginBottom: 14 }}>What are you seeing?</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {Object.entries(CATEGORY_ICON).map(([label, Icon]) => (
              <div key={label} onClick={() => { setCategory(label); setScreen("capture"); }} className="panel"
                style={{ padding: "18px 10px", display: "flex", flexDirection: "column", alignItems: "center", gap: 8, cursor: "pointer" }}>
                <Icon size={22} color="#0284C7" />
                <span style={{ fontSize: 11.5, color: "#334155", textAlign: "center" }}>{label}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      {screen === "capture" && (
        <div style={{ flex: 1, padding: 14, display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: "#0F172A", marginBottom: 10 }}>{category}</div>
          <div style={{ flex: 1, borderRadius: 10, border: "1.5px dashed #93C5FD", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8, color: "#5B6B84" }}>
            <Camera size={26} />
            <span style={{ fontSize: 12 }}>Tap to capture photo</span>
          </div>
          <div style={{ fontSize: 11, color: "#5B6B84", display: "flex", alignItems: "center", gap: 5, margin: "10px 0" }}>
            <MapPin size={12} color="#0EA5E9" /> Auto-tagged: 25.28°N, 91.72°E (±6m)
          </div>
          <button className="btn-primary" style={{ justifyContent: "center" }} onClick={() => { pushToast("Report submitted", "Field team will verify shortly."); setScreen("feed"); }}>
            <Send size={14} /> Submit report
          </button>
        </div>
      )}
      <div style={{ height: 54, borderTop: "1px solid #DBEAFE", display: "flex", alignItems: "center", justifyContent: "space-around" }}>
        <div onClick={() => setScreen("feed")} style={{ color: screen === "feed" ? "#0EA5E9" : "#5B6B84", cursor: "pointer" }}><ShieldAlert size={18} /></div>
        <div onClick={() => setScreen("category")} style={{
          width: 44, height: 44, borderRadius: 99, background: "linear-gradient(135deg,#38BDF8,#0EA5E9)", display: "flex",
          alignItems: "center", justifyContent: "center", cursor: "pointer", marginTop: -18, boxShadow: "0 0 14px rgba(14,165,233,.5)",
        }}><PlusCircle size={20} color="#FFFFFF" /></div>
        <div style={{ color: "#5B6B84" }}><User size={18} /></div>
      </div>
    </div>
  );
}

function ReportsScreen({ pushToast }) {
  const [view, setView] = useState("desktop");
  const [reports, setReports] = useState(REPORTS);
  const [active, setActive] = useState(null);
  return (
    <div style={{ padding: 22 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div style={{ fontSize: 13, color: "#5B6B84" }}>{reports.length} geo-tagged reports · last sync 2 min ago</div>
        <div style={{ display: "flex", gap: 6 }}>
          <span onClick={() => setView("desktop")} className="chip-btn" style={{ borderColor: view === "desktop" ? "#0EA5E9" : "#BAE6FD", color: view === "desktop" ? "#0EA5E9" : "#334155" }}>Admin feed</span>
          <span onClick={() => setView("mobile")} className="chip-btn" style={{ borderColor: view === "mobile" ? "#0EA5E9" : "#BAE6FD", color: view === "mobile" ? "#0EA5E9" : "#334155" }}>Mobile / PWA preview</span>
        </div>
      </div>

      {view === "desktop" ? (
        reports.length ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14 }}>
            {reports.map((r) => <ReportCard key={r.id} r={r} onOpen={setActive} />)}
          </div>
        ) : <EmptyState icon={Camera} title="No field reports yet" body="Reports submitted by citizens or field officers will appear here in real time." />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14, padding: "10px 0" }}>
          <div style={{ fontSize: 12.5, color: "#5B6B84", maxWidth: 340, textAlign: "center" }}>
            Lightweight PWA build for low-connectivity field use — works offline, syncs reports once signal returns.
          </div>
          <MobileCitizenApp pushToast={pushToast} />
        </div>
      )}

      {active && <ReportDetail r={active} onClose={() => setActive(null)} onVerify={(id, v) => {
        setReports(reports.map((r) => r.id === id ? { ...r, verified: v } : r));
        setActive({ ...active, verified: v });
        pushToast("Verification updated", `Report ${id} marked as ${v}.`);
      }} />}
    </div>
  );
}

/* ============================== DIGITAL TWIN ============================== */
function DigitalTwinScreen() {
  const [zoneId, setZoneId] = useState("Z-04");
  const [month, setMonth] = useState(8);
  const [playing, setPlaying] = useState(false);
  const zone = ZONES.find((z) => z.id === zoneId);
  const timelineRef = useRef();

  useEffect(() => {
    if (!playing) return;
    const iv = setInterval(() => setMonth((m) => (m >= 11 ? 0 : m + 1)), 700);
    return () => clearInterval(iv);
  }, [playing]);

  const monthData = Array.from({ length: 12 }, (_, i) => ({ m: i, disp: 2 + i * (zone.insar / 11) + Math.sin(i) * 0.6 }));
  const intensity = Math.min(1, month / 11);

  return (
    <div style={{ padding: 22, display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {ZONES.filter((z) => z.severity !== "safe").map((z) => (
            <span key={z.id} onClick={() => setZoneId(z.id)} className="chip-btn"
              style={{ borderColor: zoneId === z.id ? "#0EA5E9" : "#BAE6FD", color: zoneId === z.id ? "#0EA5E9" : "#334155" }}>{z.name}</span>
          ))}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 16 }}>
        <div className="panel" style={{ padding: 18 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
            <div style={{ fontSize: 13.5, fontWeight: 700, color: "#0F172A" }}>{zone.name} — terrain deformation model</div>
            <span style={{ fontSize: 11, color: "#5B6B84" }}>Simulated cross-section · not to scale</span>
          </div>
          <svg viewBox="0 0 400 220" width="100%" height="280">
            <defs>
              <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#E0F2FE" /><stop offset="100%" stopColor="#F5FAFF" />
              </linearGradient>
              <linearGradient id="defHeat" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#22C55E" stopOpacity={0.05} />
                <stop offset="55%" stopColor="#F97316" stopOpacity={0.35 * intensity + 0.05} />
                <stop offset="100%" stopColor="#EF4444" stopOpacity={0.55 * intensity + 0.05} />
              </linearGradient>
            </defs>
            <rect width="400" height="220" fill="url(#sky)" />
            <path d="M0,190 L40,120 L90,150 L150,70 L210,130 L260,60 L320,140 L400,110 L400,220 L0,220 Z" fill="#BAE6FD" stroke="#0284C7" strokeWidth="1.5" />
            <path d="M150,70 L210,130 L260,60" fill="url(#defHeat)" stroke="none" opacity={0.9} />
            {Array.from({ length: 5 }).map((_, i) => (
              <circle key={i} cx={155 + i * 22} cy={95 + i * 6} r={2 + intensity * 2} fill="#F97316" opacity={0.7}>
              </circle>
            ))}
            <text x="150" y="55" fontSize="10" fill="#0284C7" fontFamily="JetBrains Mono, monospace">Sensor cluster A</text>
            <line x1="150" y1="58" x2="165" y2="72" stroke="#0284C7" strokeWidth="1" />
          </svg>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 6 }}>
            <button onClick={() => setPlaying(!playing)} className="btn-ghost" style={{ padding: "7px 10px" }}>
              {playing ? <Pause size={14} /> : <Play size={14} />}
            </button>
            <input type="range" min={0} max={11} value={month} onChange={(e) => setMonth(Number(e.target.value))} className="slider" style={{ flex: 1 }} />
            <span style={{ fontSize: 11.5, fontFamily: "JetBrains Mono, monospace", color: "#5B6B84", width: 70, textAlign: "right" }}>Month {month + 1}/12</span>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <StatCard icon={Gauge} label="Displacement rate" value={`${zone.insar} mm/yr`} sub="via Sentinel-1 InSAR" accent="#A855F7" />
          <StatCard icon={Activity} label="Ground sensors" value="18" sub="16 reporting normally" accent="#0EA5E9" />
          <div className="panel" style={{ padding: 16 }}>
            <div style={{ fontSize: 12.5, fontWeight: 700, color: "#0F172A", marginBottom: 8 }}>12-month deformation trend</div>
            <ResponsiveContainer width="100%" height={130}>
              <AreaChart data={monthData}>
                <defs>
                  <linearGradient id="defTrend" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#A855F7" stopOpacity={0.5} /><stop offset="100%" stopColor="#A855F7" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="m" hide />
                <YAxis hide />
                <Area type="monotone" dataKey="disp" stroke="#A855F7" fill="url(#defTrend)" strokeWidth={2} />
                <ReferenceLine x={month} stroke="#0EA5E9" strokeDasharray="3 3" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============================== COPILOT ============================== */
const SUGGESTED = ["Summarize today's high-risk zones", "Draft alert message for Sohra Ridge — Zone 4", "Which villages need evacuation planning this week?"];

function CopilotPanel({ open, onClose, pushToast }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const endRef = useRef();

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, thinking]);

  const respond = (prompt) => {
    setMessages((m) => [...m, { role: "user", text: prompt }]);
    setThinking(true);
    setTimeout(() => {
      let text, chips = [];
      if (/summarize|high-risk/i.test(prompt)) {
        text = "Three zones are at critical severity right now: Dima Hasao Rail Corridor (90), Sohra Ridge — Zone 4 (88) and Noney Hill Cut (84). All three have rising InSAR displacement and rainfall above 75% saturation. Recommend prioritising evacuation checks for Harangajao, Mawsmai and Tupul in the next shift.";
        chips = ["Open Dima Hasao on map", "Draft alert for these zones"];
      } else if (/draft alert/i.test(prompt)) {
        text = "Draft ready for Sohra Ridge — Zone 4:\n\n\"⚠ CRITICAL landslide risk near Sohra Ridge. Residents of Mawsmai and Nongriat should move to higher ground and avoid NH206 km 12–15. Follow field officer instructions.\"\n\nSuggested channels: SMS + Dashboard, in Khasi and English.";
        chips = ["Send this as alert", "Edit in Alerts screen"];
      } else {
        text = "Based on current soil moisture and evacuation-route capacity, Mawsmai, Nongriat, Harangajao and Tupul should be prioritised for evacuation planning this week — each sits below a zone scoring 80+ with degrading road access.";
        chips = ["View villages on map"];
      }
      setMessages((m) => [...m, { role: "bot", text, chips }]);
      setThinking(false);
    }, 950);
  };

  if (!open) return null;
  return (
    <div style={{ position: "fixed", top: 0, right: 0, bottom: 0, width: 380, background: "#FFFFFF", borderLeft: "1px solid #DBEAFE", zIndex: 150, display: "flex", flexDirection: "column", boxShadow: "-8px 0 30px rgba(0,0,0,.4)" }}>
      <div style={{ padding: "16px 18px", borderBottom: "1px solid #DBEAFE", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Sparkles size={16} color="#0EA5E9" />
          <span style={{ fontSize: 14, fontWeight: 700, color: "#0F172A" }}>Copilot</span>
        </div>
        <X size={16} color="#5B6B84" style={{ cursor: "pointer" }} onClick={onClose} />
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: 16, display: "flex", flexDirection: "column", gap: 14 }}>
        {messages.length === 0 && (
          <>
            <div style={{ fontSize: 12.5, color: "#5B6B84", lineHeight: 1.6 }}>Ask about live risk data, draft alerts, or get a briefing across zones. Answers cite the same sensor data shown on your dashboard.</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {SUGGESTED.map((s) => (
                <button key={s} onClick={() => respond(s)} style={{
                  textAlign: "left", padding: "10px 12px", borderRadius: 8, border: "1px solid #BAE6FD", background: "#F0F9FF",
                  color: "#334155", fontSize: 12.5, cursor: "pointer",
                }}>{s}</button>
              ))}
            </div>
          </>
        )}
        {messages.map((m, i) => (
          <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: m.role === "user" ? "flex-end" : "flex-start" }}>
            <div style={{
              maxWidth: "88%", padding: "10px 13px", borderRadius: 10, fontSize: 12.8, lineHeight: 1.55, whiteSpace: "pre-line",
              background: m.role === "user" ? "rgba(14,165,233,.12)" : "#F0F9FF",
              border: m.role === "user" ? "1px solid rgba(14,165,233,.3)" : "1px solid #BAE6FD",
              color: "#334155",
            }}>{m.text}</div>
            {m.chips && (
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 6 }}>
                {m.chips.map((c) => (
                  <button key={c} onClick={() => pushToast(c)} className="chip-btn" style={{ display: "flex", alignItems: "center", gap: 5 }}>
                    {/Send/.test(c) ? <Send size={11} /> : <ArrowUpRight size={11} />} {c}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
        {thinking && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#5B6B84", fontSize: 12 }}>
            <Loader2 size={13} className="spin" /> Analysing live sensor feed…
          </div>
        )}
        <div ref={endRef} />
      </div>

      <div style={{ padding: 14, borderTop: "1px solid #DBEAFE", display: "flex", gap: 8 }}>
        <input value={input} onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && input.trim()) { respond(input.trim()); setInput(""); } }}
          placeholder="Ask Copilot about current risk…" className="field-input" style={{ flex: 1 }} />
        <button className="btn-primary" style={{ padding: "9px 12px" }} onClick={() => { if (input.trim()) { respond(input.trim()); setInput(""); } }}><Send size={14} /></button>
      </div>
    </div>
  );
}

/* ============================== BASE CSS ============================== */
const BASE_CSS = `
* { box-sizing: border-box; }
body, .panel, button, input, textarea { font-family: 'Inter', sans-serif; }
.panel { background: #FFFFFF; border: 1px solid #DBEAFE; border-radius: 8px; }
.floaty { background: #F0F9FF; border: 1px solid #7DD3FC; border-radius: 8px; box-shadow: 0 10px 30px rgba(0,0,0,.45); padding: 6px; }
.chip-btn { display:inline-flex; align-items:center; gap:6px; padding: 6px 11px; border-radius: 6px; border: 1px solid #BAE6FD; background:#E0F2FE; color:#334155; font-size:12px; cursor:pointer; }
.btn-primary { display:inline-flex; align-items:center; gap:7px; padding:9px 15px; border-radius:7px; border:none; background:linear-gradient(135deg,#0EA5E9,#0284C7); color:#FFFFFF; font-weight:700; font-size:13px; cursor:pointer; }
.btn-primary:hover { filter: brightness(1.08); }
.btn-ghost { display:inline-flex; align-items:center; gap:6px; padding:8px 13px; border-radius:7px; border:1px solid #7DD3FC; background:transparent; color:#0284C7; font-size:12.5px; cursor:pointer; }
.field-label { font-size: 11.5px; color:#5B6B84; font-weight:600; }
.field-input { background:#F5FAFF; border:1px solid #BAE6FD; border-radius:7px; padding:9px 11px; color:#0F172A; font-size:13px; outline:none; }
.field-input:focus { border-color:#0EA5E9; box-shadow: 0 0 0 3px rgba(14,165,233,.12); }
.slider { -webkit-appearance:none; width:100%; height:4px; border-radius:3px; background:#BAE6FD; outline:none; }
.slider::-webkit-slider-thumb { -webkit-appearance:none; width:14px; height:14px; border-radius:99px; background:#0EA5E9; box-shadow:0 0 6px rgba(14,165,233,.7); cursor:pointer; }
::-webkit-scrollbar { width:8px; height:8px; }
::-webkit-scrollbar-thumb { background:#BAE6FD; border-radius:8px; }
@keyframes slideIn { from { opacity:0; transform:translateX(20px);} to {opacity:1; transform:translateX(0);} }
@keyframes spin { from { transform: rotate(0deg);} to { transform: rotate(360deg);} }
.spin { animation: spin 1s linear infinite; }
`;

/* ============================== APP ROOT ============================== */
export default function App() {
  const [authed, setAuthed] = useState(false);
  const [role, setRole] = useState("District Admin");
  const [view, setView] = useState("dashboard");
  const [collapsed, setCollapsed] = useState(false);
  const [district, setDistrict] = useState("All Districts (NER)");
  const [selectedZoneId, setSelectedZoneId] = useState(null);
  const [copilotOpen, setCopilotOpen] = useState(false);
  const [toasts, setToasts] = useState([]);

  const pushToast = (title, body, tone = "ok") => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, title, body, tone }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4200);
  };
  const removeToast = (id) => setToasts((t) => t.filter((x) => x.id !== id));

  if (!authed) {
    return <LoginScreen onLogin={(r) => { setRole(r); setAuthed(true); pushToast("Signed in", `Welcome back, ${r}.`); }} />;
  }

  const titles = {
    dashboard: ["Regional overview", "Live risk summary across all monitored zones"],
    map: ["Risk map", "GIS view — click a zone for a full breakdown"],
    alerts: ["Alerts", "SMS, IVR and dashboard notifications"],
    reports: ["Citizen & field reporting", "Geo-tagged reports awaiting review"],
    twin: ["Digital twin", "Slope-level terrain deformation modelling"],
  };

  return (
    <div style={{ height: "100vh", display: "flex", background: "#F5FAFF", color: "#0F172A", overflow: "hidden" }}>
      <style>{FONT_CSS}{BASE_CSS}</style>
      <Sidebar view={view} setView={setView} collapsed={collapsed} setCollapsed={setCollapsed} role={role}
        onLogout={() => setAuthed(false)} openCopilot={() => setCopilotOpen(true)} />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        <TopBar title={titles[view][0]} subtitle={titles[view][1]} district={district} setDistrict={setDistrict}
          alertCount={4} onBell={() => setView("alerts")} role={role} />
        <div style={{ flex: 1, overflowY: view === "map" ? "hidden" : "auto", display: "flex", flexDirection: "column", minHeight: 0 }}>
          {view === "dashboard" && <DashboardScreen pushToast={pushToast} goMap={() => setView("map")} setSelectedZoneId={setSelectedZoneId} />}
          {view === "map" && <RiskMapScreen selectedZoneId={selectedZoneId} setSelectedZoneId={setSelectedZoneId} pushToast={pushToast} district={district} />}
          {view === "alerts" && <AlertsScreen pushToast={pushToast} />}
          {view === "reports" && <ReportsScreen pushToast={pushToast} />}
          {view === "twin" && <DigitalTwinScreen />}
        </div>
      </div>
      <CopilotPanel open={copilotOpen} onClose={() => setCopilotOpen(false)} pushToast={pushToast} />
      <Toast toasts={toasts} remove={removeToast} />
    </div>
  );
}