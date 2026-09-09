import { useState, useEffect, useRef, useMemo } from "react";
import { Home, BookOpen, Layers, BarChart3, Camera, Mic, Volume2, ArrowLeft, Check, X, ClipboardPaste, Pencil, Square, LogOut, UserCircle, LogIn, Wifi, WifiOff, MessageSquareText, ClipboardCheck, Dumbbell } from "lucide-react";

const VERSION = "1.3.1";

import { loadData, saveData, askClaude, getPin, setPin, clearPin, isConfigured, setErrorHandler } from "./api.js";

const LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"];
const MY_LEVEL = "A2"; // skupina A2.2 v EF
const C = {
  ink: "#3C3C3C",
  soft: "#777777",
  mute: "#AFAFAF",
  line: "#E5E5E5",
  bg: "#F7F7F7",
  sea: "#1CB0F6",
  seaSoft: "#DDF4FF",
  green: "#58A700",
  greenSoft: "#D7FFB8",
  amber: "#CD7900",
  amberSoft: "#FFF1C4",
  red: "#EA2B2B",
  redSoft: "#FFDFE0",
  grn: "#58CC02",
  grnDark: "#46A302",
  blu: "#1CB0F6",
  bluDark: "#1899D6",
  yel: "#FFC800",
  yelDark: "#E5A800",
};
const DAY = 86400000;
const today = () => new Date().toISOString().slice(0, 10);
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

function grade(w, g) {
  const now = Date.now();
  let { ease = 2.5, interval = 0, reps = 0, lapses = 0 } = w;
  if (g === 0) {
    reps = 0; lapses += 1; ease = Math.max(1.3, ease - 0.2); interval = 0;
    return { ...w, ease, interval, reps, lapses, due: now + 60000, seen: (w.seen || 0) + 1, last: now };
  }
  if (g === 1) {
    ease = Math.max(1.3, ease - 0.15);
    interval = reps === 0 ? 1 : Math.max(1, Math.round(interval * 1.2));
  } else {
    ease = ease + 0.1;
    interval = reps === 0 ? 1 : reps === 1 ? 3 : Math.round(interval * ease);
  }
  reps += 1;
  return { ...w, ease, interval, reps, lapses, due: now + interval * DAY, seen: (w.seen || 0) + 1, last: now };
}
const isKnown = (w) => (w.interval || 0) >= 7;
const isLearning = (w) => (w.reps || 0) > 0 && !isKnown(w);
const isDue = (w) => !w.due || w.due <= Date.now();
const nextLabel = (w, g) => {
  if (g === 0) return "za 1 min";
  const p = grade(w, g);
  return p.interval === 1 ? "zítra" : `za ${p.interval} dní`;
};

function parseJSON(t) {
  const clean = t.replace(/```json|```/g, "").trim();
  const s = clean.indexOf("{");
  const e = clean.lastIndexOf("}");
  return JSON.parse(clean.slice(s, e + 1));
}
const fileToB64 = (file) =>
  new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result.split(",")[1]);
    r.onerror = rej;
    r.readAsDataURL(file);
  });
// Zmenší fotku na max 1600 px a zkomprimuje do JPEG, aby prošla limitem funkce a šla rychle nahoru.
async function shrinkImage(file, max = 1600) {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = url; });
    const k = Math.min(1, max / Math.max(img.width, img.height));
    const c = document.createElement("canvas");
    c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
    c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
    const dataUrl = c.toDataURL("image/jpeg", 0.85);
    return { b64: dataUrl.split(",")[1], type: "image/jpeg", preview: dataUrl };
  } finally { URL.revokeObjectURL(url); }
}

let voice = null;
function speak(text) {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = "en-GB";
  if (!voice) {
    const vs = window.speechSynthesis.getVoices();
    voice = vs.find((v) => v.lang === "en-GB") || vs.find((v) => v.lang.startsWith("en")) || null;
  }
  if (voice) u.voice = voice;
  u.rate = 0.95;
  window.speechSynthesis.speak(u);
}

const css = `
.ef{font-family:Nunito,"Segoe UI",system-ui,sans-serif;color:${C.ink};max-width:440px;margin:0 auto;min-height:100vh;display:flex;flex-direction:column;background:#EAF1F8;font-size:18px;line-height:1.5;font-weight:500}
.ef *{box-sizing:border-box}
.ef button{font:inherit;cursor:pointer;border:none;background:none;color:inherit;padding:0}
.ef button:focus-visible,.ef input:focus-visible,.ef textarea:focus-visible{outline:3px solid ${C.blu};outline-offset:2px}
.scr{flex:1;padding:36px 20px 96px;overflow-y:auto}
.nav{position:sticky;bottom:0;background:#fff;border-top:2px solid ${C.line};display:flex;justify-content:space-around;padding:8px 0 12px}
.ef .nav button{display:flex;flex-direction:column;align-items:center;gap:3px;font-size:10px;color:${C.mute};width:72px;font-weight:800;text-transform:uppercase;letter-spacing:.04em;border-radius:12px;padding:6px 0}
.nav button.on{color:${C.blu};background:${C.seaSoft};border:2px solid #84D8FF}
.h1{font-size:28px;font-weight:800;letter-spacing:-0.01em;margin:0 0 14px;color:#1179C7}
.mute{color:${C.mute};font-size:13px;font-weight:700}
.soft{color:${C.soft};font-size:14px;font-weight:600}
.ef .panel{background:#fff;border:2px solid #D6E2EE;border-radius:16px;padding:16px}
.ef .tile{border:2px solid #D6E2EE;border-bottom-width:4px;border-radius:16px;padding:14px;text-align:left;width:100%;background:#fff}
.ef .tile:active{border-bottom-width:2px;transform:translateY(2px)}
.ef .pri{background:${C.grn};color:#fff;border-radius:16px;padding:13px 22px;font-weight:800;text-transform:uppercase;letter-spacing:.06em;display:inline-flex;align-items:center;gap:8px;box-shadow:0 4px 0 ${C.grnDark}}
.ef .pri:active{box-shadow:none;transform:translateY(4px)}
.ef .pri:disabled{background:${C.line};color:${C.mute};box-shadow:0 4px 0 #cfcfcf;cursor:default}
.ef .sec{border:2px solid ${C.line};border-radius:14px;padding:9px 16px;font-weight:800;text-transform:uppercase;letter-spacing:.05em;font-size:13px;display:inline-flex;align-items:center;gap:8px;box-shadow:0 3px 0 ${C.line};color:${C.blu};background:#fff}
.ef .sec:active{box-shadow:none;transform:translateY(3px)}
.row{display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:2px solid ${C.line}}
.pill{font-size:11px;padding:3px 10px;border-radius:999px;display:inline-block;font-weight:800;text-transform:uppercase;letter-spacing:.04em}
.ef .g{border-radius:16px;padding:12px 4px;text-align:center;width:100%;border:2px solid transparent;border-bottom-width:5px}
.ef .g:active{border-bottom-width:2px;transform:translateY(3px)}
.g b{display:block;font-weight:800;text-transform:uppercase;font-size:13px;letter-spacing:.04em}
.g span{font-size:11px;font-weight:700}
.ef .bubble{border-radius:18px;padding:13px 16px;max-width:88%;font-size:20px;line-height:1.45;font-weight:500;border:2px solid #D6E2EE;background:#fff}
.ef .hero{background:linear-gradient(160deg,#58CC02,#3E9E00);color:#fff;border-radius:22px;padding:18px;box-shadow:0 6px 0 #2F7A00}
.ef .hero .mute,.ef .hero .soft{color:rgba(255,255,255,.85)}
.ef .tileC{border:none;border-radius:18px;padding:16px;text-align:left;width:100%;color:#fff;display:block}
.ef .tileC .mute{color:rgba(255,255,255,.8)}
.ef .tileC:active{box-shadow:none !important;transform:translateY(5px)}
.ef .micwrap{position:relative;display:inline-flex;align-items:center;justify-content:center;width:120px;height:120px}
.ef .ring{position:absolute;inset:0;border-radius:50%;border:3px solid ${C.red};opacity:0}
@media (prefers-reduced-motion:no-preference){
  .ef .rec .ring{animation:pulse 1.6s ease-out infinite}
  .ef .rec .ring:nth-child(2){animation-delay:.5s}
  .ef .rec .ring:nth-child(3){animation-delay:1s}
  .ef .bar{animation:wave .9s ease-in-out infinite}
  .ef .bar:nth-child(2){animation-delay:.15s}.ef .bar:nth-child(3){animation-delay:.3s}.ef .bar:nth-child(4){animation-delay:.45s}.ef .bar:nth-child(5){animation-delay:.6s}
}
@keyframes pulse{0%{transform:scale(.6);opacity:.8}100%{transform:scale(1.25);opacity:0}}
@keyframes wave{0%,100%{height:8px}50%{height:28px}}
.ef .bars{display:inline-flex;gap:4px;align-items:center;height:30px}
.ef .bar{width:5px;height:8px;border-radius:3px;background:${C.red}}
.ef textarea,.ef input[type=text]{width:100%;border:2px solid ${C.line};border-radius:14px;padding:12px 14px;font:inherit;background:#fff;font-weight:500}
`;

function Pill({ tone = "sea", children }) {
  const m = { sea: [C.seaSoft, C.sea], green: [C.greenSoft, C.green], amber: [C.amberSoft, C.amber], grey: [C.bg, C.soft], red: [C.redSoft, C.red] };
  return <span className="pill" style={{ background: m[tone][0], color: m[tone][1] }}>{children}</span>;
}
function Ring({ value, max, label }) {
  const r = 36, c = 2 * Math.PI * r;
  const p = max ? Math.min(1, value / max) : 0;
  return (
    <svg width="84" height="84" viewBox="0 0 84 84" aria-label={label}>
      <circle cx="42" cy="42" r={r} fill="none" stroke={C.line} strokeWidth="10" />
      <circle cx="42" cy="42" r={r} fill="none" stroke={C.grn} strokeWidth="10" strokeDasharray={c} strokeDashoffset={c * (1 - p)} strokeLinecap="round" transform="rotate(-90 42 42)" />
      <text x="42" y="48" textAnchor="middle" fontSize="22" fontWeight="800" fill={C.ink}>{value}</text>
    </svg>
  );
}
function Err({ msg }) {
  return msg ? <p style={{ color: C.red, fontSize: 13, margin: "8px 0 0" }}>{msg}</p> : null;
}

function Today({ data, go, name }) {
  const due = data.words.filter(isDue).length;
  const known = data.words.filter(isKnown).length;
  const days = [...Array(7)].map((_, i) => {
    const d = new Date(Date.now() - (6 - i) * DAY).toISOString().slice(0, 10);
    return { d, n: data.log.filter((l) => l.d === d).length, lbl: ["Ne", "Po", "Út", "St", "Čt", "Pá", "So"][new Date(d).getDay()] };
  });
  const mx = Math.max(1, ...days.map((x) => x.n));
  const streak = (() => {
    let s = 0;
    const has = (i) => data.log.some((l) => l.d === new Date(Date.now() - i * DAY).toISOString().slice(0, 10));
    for (let i = has(0) ? 0 : 1; i < 365 && has(i); i++) s++;
    return s;
  })();
  const date = new Date().toLocaleDateString("cs-CZ", { weekday: "long", day: "numeric", month: "long" });
  return (
    <div className="scr">
      <div className="hero">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div className="mute" style={{ textTransform: "capitalize" }}>{date}</div>
            <div style={{ fontSize: 24, fontWeight: 800, lineHeight: 1.2 }}>{new Date().getHours() < 11 ? "Dobré ráno" : new Date().getHours() < 18 ? "Dobrý den" : "Dobrý večer"}{name ? `, ${name}` : ""}</div>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <button onClick={() => go("account")} aria-label="Účet" style={{ color: "#fff" }}><UserCircle size={30} /></button>
            <img src="/icons/icon-192.png" alt="" width="44" height="44" style={{ borderRadius: 12, border: "2px solid rgba(255,255,255,.6)" }} />
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginTop: 16 }}>
          <svg width="84" height="84" viewBox="0 0 84 84" aria-label="K opakování">
            <circle cx="42" cy="42" r="36" fill="none" stroke="rgba(255,255,255,.3)" strokeWidth="10" />
            <circle cx="42" cy="42" r="36" fill="none" stroke="#fff" strokeWidth="10" strokeDasharray={2 * Math.PI * 36} strokeDashoffset={2 * Math.PI * 36 * (1 - Math.min(1, due / Math.max(due, 20)))} strokeLinecap="round" transform="rotate(-90 42 42)" />
            <text x="42" y="49" textAnchor="middle" fontSize="24" fontWeight="800" fill="#fff">{due}</text>
          </svg>
          <div>
            <div style={{ fontWeight: 800, fontSize: 17 }}>Dnešní opakování</div>
            <div className="soft">{due === 0 ? "Nic nečeká, vše zopakováno." : `${due} slovíček, asi ${Math.max(1, Math.round(due / 5))} min`}{data.sentences.filter(isDue).length > 0 && <> · {data.sentences.filter(isDue).length} vět</>}</div>
            <button className="pri" style={{ marginTop: 10, padding: "9px 18px", fontSize: 14, background: "#fff", color: C.grnDark, boxShadow: "0 4px 0 #CFE5BF" }} onClick={() => go("review")} disabled={due === 0}>Začít</button>
          </div>
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 12 }}>
        <button className="tileC" style={{ background: "linear-gradient(160deg,#1CB0F6,#1179C7)", boxShadow: "0 5px 0 #0C5E9C" }} onClick={() => go("add")}>
          <Camera size={26} />
          <div style={{ fontWeight: 800, marginTop: 8, fontSize: 17 }}>Nová lekce</div>
          <div className="mute">vyfotit materiál</div>
        </button>
        <button className="tileC" style={{ background: "linear-gradient(160deg,#FF9600,#E36D00)", boxShadow: "0 5px 0 #B85600" }} onClick={() => go("talk")}>
          <Mic size={26} />
          <div style={{ fontWeight: 800, marginTop: 8, fontSize: 17 }}>Mluvit</div>
          <div className="mute">konverzace s lektorem</div>
        </button>
      </div>
      <div className="panel" style={{ marginTop: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <span className="mute">Opakování za týden</span>
        <span className="pill" style={{ background: C.amberSoft, color: C.amber }}>{streak} {streak === 1 ? "den" : streak < 5 ? "dny" : "dní"} v řadě</span>
      </div>
      <div style={{ display: "flex", gap: 6, alignItems: "flex-end", height: 48, marginTop: 8 }}>
        {days.map((x) => (
          <div key={x.d} style={{ flex: 1, height: `${Math.max(8, (x.n / mx) * 100)}%`, background: x.n ? C.grn : C.line, borderRadius: 6 }} title={`${x.n}`} />
        ))}
      </div>
      <div style={{ display: "flex", gap: 6, marginTop: 4 }}>
        {days.map((x) => <div key={x.d} className="mute" style={{ flex: 1, textAlign: "center", fontSize: 10 }}>{x.lbl}</div>)}
      </div>
      </div>
      {data.words.length === 0 && (
        <div className="panel" style={{ marginTop: 12, background: C.amberSoft, borderColor: "#F5D77A" }}>
          <div style={{ fontWeight: 800 }}>Začni první lekcí</div>
          <div className="soft" style={{ marginTop: 4 }}>Vyfoť pracovní list nebo stránku z učebnice. Slovíčka a gramatiku z ní vytěžím a připravím k opakování.</div>
        </div>
      )}
    </div>
  );
}

function Lessons({ data, go, open }) {
  return (
    <div className="scr">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1 className="h1" style={{ margin: 0 }}>Lekce</h1>
        <button className="sec" onClick={() => go("add")}><Camera size={16} /> Přidat</button>
      </div>
      <div style={{ marginTop: 14 }}>
        {data.lessons.slice().reverse().map((l) => {
          const ws = data.words.filter((w) => w.lessonId === l.id);
          const k = ws.filter(isKnown).length;
          return (
            <button key={l.id} className="tile" style={{ marginBottom: 10, borderLeft: `6px solid ${["#1CB0F6","#58CC02","#FF9600","#CE82FF","#FF4B4B","#FFC800"][LEVELS.indexOf(l.level) < 0 ? 1 : LEVELS.indexOf(l.level)]}` }} onClick={() => open(l.id)}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontWeight: 500 }}>{l.title}</span>
                <span className="mute">{new Date(l.created).toLocaleDateString("cs-CZ", { day: "numeric", month: "numeric" })}</span>
              </div>
              <div className="soft" style={{ marginTop: 2 }}>{ws.length} slovíček{l.grammar?.length ? ` · ${l.grammar.map((g) => g.name).join(", ")}` : ""}</div>
              <div style={{ marginTop: 8, display: "flex", gap: 6 }}>
                {l.level && <Pill>{l.level}</Pill>}
                <Pill tone="green">{k} umím</Pill>
                {ws.length - k > 0 && <Pill tone="amber">{ws.length - k} učím se</Pill>}
              </div>
            </button>
          );
        })}
        {data.lessons.length === 0 && <div className="soft">Zatím žádná lekce. Přidej první fotku materiálu ze školy.</div>}
      </div>
    </div>
  );
}

const EXTRACT_SYS = `You extract English learning material for a Czech adult student attending an English language school. The student is in an A2.2 (pre-intermediate) class, so include also simpler items he may not know yet. Given a photo/PDF/text of a worksheet, textbook page or notes, return ONLY compact JSON, no prose, no markdown:
{"title":"short English topic title","level":"CEFR of the material A1-C2","words":[{"en":"word or phrase","ipa":"IPA","cz":"Czech translation","ex":"short example sentence","lv":"CEFR A1-C2"}],"grammar":[{"name":"short name","cz":"1-2 sentence explanation in Czech","ex":"example sentence"}]}
Rules: include every vocabulary item worth learning (max 25, pick the most useful if more). Keep examples under 10 words. Grammar max 3 items, empty array if none. Keep JSON compact.`;

function AddLesson({ data, setData, back, openLesson }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [text, setText] = useState("");
  const [preview, setPreview] = useState(null);
  const [mode, setMode] = useState("photo");

  async function run(content) {
    setBusy(true); setErr("");
    try {
      const out = await askClaude([{ role: "user", content }], EXTRACT_SYS);
      const j = parseJSON(out);
      const id = uid();
      const lesson = { id, title: j.title || "Lekce", level: j.level || "", grammar: j.grammar || [], created: Date.now() };
      const words = (j.words || []).filter((w) => w.en && w.cz).map((w) => ({ id: uid(), lessonId: id, en: w.en, ipa: w.ipa || "", cz: w.cz, ex: w.ex || "", lv: LEVELS.includes(w.lv) ? w.lv : lesson.level || MY_LEVEL, ease: 2.5, interval: 0, reps: 0, lapses: 0, due: 0, seen: 0 }));
      const nd = { ...data, lessons: [...data.lessons, lesson], words: [...data.words, ...words] };
      setData(nd); await saveData(nd);
      openLesson(id);
    } catch (e) {
      setErr("Vytěžení se nepovedlo: " + e.message + ". Zkus ostřejší fotku nebo vlož text.");
    }
    setBusy(false);
  }
  async function onFile(e) {
    const f = e.target.files?.[0];
    if (!f) return;
    let block;
    if (f.type === "application/pdf") {
      setPreview(null);
      block = { type: "document", source: { type: "base64", media_type: "application/pdf", data: await fileToB64(f) } };
    } else {
      try {
        const s = await shrinkImage(f);
        setPreview(s.preview);
        block = { type: "image", source: { type: "base64", media_type: s.type, data: s.b64 } };
      } catch {
        setPreview(URL.createObjectURL(f));
        block = { type: "image", source: { type: "base64", media_type: f.type || "image/jpeg", data: await fileToB64(f) } };
      }
    }
    run([block, { type: "text", text: "Extract the learning material from this." }]);
  }
  return (
    <div className="scr">
      <button className="soft" onClick={back} style={{ display: "flex", alignItems: "center", gap: 4 }}><ArrowLeft size={16} /> Zpět</button>
      <h1 className="h1" style={{ marginTop: 10 }}>Nová lekce</h1>
      <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
        <button className="sec" style={mode === "photo" ? { background: C.ink, color: "#fff", borderColor: C.ink } : {}} onClick={() => setMode("photo")}><Camera size={16} /> Fotka / PDF</button>
        <button className="sec" style={mode === "text" ? { background: C.ink, color: "#fff", borderColor: C.ink } : {}} onClick={() => setMode("text")}><ClipboardPaste size={16} /> Text</button>
      </div>
      {mode === "photo" ? (
        <div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <label className="tileC" style={{ background: "linear-gradient(160deg,#1CB0F6,#1179C7)", boxShadow: "0 5px 0 #0C5E9C", textAlign: "center", cursor: "pointer", opacity: busy ? 0.6 : 1 }}>
              <input type="file" accept="image/*" capture="environment" onChange={onFile} style={{ display: "none" }} disabled={busy} />
              <Camera size={26} /><div style={{ fontWeight: 800, marginTop: 6 }}>Vyfotit</div><div className="mute">fotoaparátem</div>
            </label>
            <label className="tileC" style={{ background: "linear-gradient(160deg,#CE82FF,#9B4DE0)", boxShadow: "0 5px 0 #7A35B8", textAlign: "center", cursor: "pointer", opacity: busy ? 0.6 : 1 }}>
              <input type="file" accept="image/*,application/pdf" onChange={onFile} style={{ display: "none" }} disabled={busy} />
              <Layers size={26} /><div style={{ fontWeight: 800, marginTop: 6 }}>Galerie / soubor</div><div className="mute">fotka nebo PDF</div>
            </label>
          </div>
          {preview && <div className="panel" style={{ marginTop: 12, textAlign: "center" }}><img src={preview} alt="" style={{ maxWidth: "100%", maxHeight: 260, borderRadius: 10 }} /></div>}
          {busy && <div className="panel" style={{ marginTop: 12, fontWeight: 800, color: C.grnDark }}>Čtu materiál…</div>}
        </div>
      ) : (
        <div>
          <textarea rows={8} value={text} onChange={(e) => setText(e.target.value)} placeholder="Vlož slovíčka, poznámky nebo text z lekce" />
          <button className="pri" style={{ marginTop: 10 }} disabled={busy || !text.trim()} onClick={() => run(text)}>{busy ? "Zpracovávám…" : "Vytěžit"}</button>
        </div>
      )}
      <Err msg={err} />
      {busy && <div className="soft" style={{ marginTop: 12 }}>Hledám slovíčka, překlady, výslovnost a gramatiku. Trvá to asi 15 sekund.</div>}
    </div>
  );
}

function LessonDetail({ data, setData, id, back, talk }) {
  const l = data.lessons.find((x) => x.id === id);
  const ws = data.words.filter((w) => w.lessonId === id);
  const [all, setAll] = useState(false);
  const [ex, setEx] = useState(null);
  if (!l) return null;
  if (ex) return <Exercise lesson={l} words={ws} back={() => setEx(null)} />;
  async function remove() {
    if (!confirm("Smazat lekci včetně slovíček?")) return;
    const nd = { ...data, lessons: data.lessons.filter((x) => x.id !== id), words: data.words.filter((w) => w.lessonId !== id) };
    setData(nd); await saveData(nd); back();
  }
  return (
    <div className="scr">
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <button className="soft" onClick={back} style={{ display: "flex", alignItems: "center", gap: 4 }}><ArrowLeft size={16} /> Lekce</button>
        <button className="mute" onClick={remove}>Smazat</button>
      </div>
      <h1 className="h1" style={{ marginTop: 10, marginBottom: 6 }}>{l.title}</h1>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {l.level && <Pill>{l.level}</Pill>}
        <Pill tone="grey">{ws.length} slovíček</Pill>
        {l.grammar.map((g) => <Pill key={g.name} tone="grey">{g.name}</Pill>)}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 20, marginBottom: 4 }}>
        <span style={{ fontWeight: 500 }}>Slovíčka</span>
        <span className="mute">{ws.filter(isKnown).length} z {ws.length} umím</span>
      </div>
      {(all ? ws : ws.slice(0, 6)).map((w) => (
        <div key={w.id} className="row" style={{ padding: "7px 0" }}>
          <button onClick={() => speak(w.en)} style={{ display: "flex", gap: 8, alignItems: "center", textAlign: "left" }}>
            <Volume2 size={14} color={C.sea} /><span>{w.en}</span>
          </button>
          <span className="soft" style={{ textAlign: "right", display: "flex", gap: 6, alignItems: "center" }}>{w.cz}<span className="pill" style={{ background: C.seaSoft, color: C.blu }}>{w.lv}</span>{isKnown(w) && <Check size={12} color={C.green} />}</span>
        </div>
      ))}
      {ws.length > 6 && <button className="soft" style={{ color: C.sea, padding: "8px 0" }} onClick={() => setAll(!all)}>{all ? "skrýt" : `zobrazit všech ${ws.length}`}</button>}
      {l.grammar.length > 0 && (
        <div style={{ marginTop: 16 }}>
          <div style={{ fontWeight: 500, marginBottom: 6 }}>Gramatika</div>
          {l.grammar.map((g) => (
            <div key={g.name} className="panel" style={{ marginBottom: 8, padding: "12px 14px" }}>
              <div style={{ fontWeight: 500, fontSize: 14 }}>{g.name}</div>
              <div className="soft">{g.cz}</div>
              {g.ex && <div style={{ fontSize: 14, marginTop: 4 }}>{g.ex}</div>}
            </div>
          ))}
        </div>
      )}
      <div style={{ fontWeight: 500, margin: "16px 0 6px" }}>Cvičení</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        <button className="tile" style={{ textAlign: "center" }} onClick={() => setEx(true)}><Pencil size={18} /><div style={{ fontSize: 13, marginTop: 4 }}>Doplňovačka</div></button>
        <button className="tile" style={{ textAlign: "center" }} onClick={() => talk(l)}><Mic size={18} /><div style={{ fontSize: 13, marginTop: 4 }}>Konverzace k lekci</div></button>
      </div>
    </div>
  );
}

function Exercise({ lesson, words, back }) {
  const [items, setItems] = useState(null);
  const [i, setI] = useState(0);
  const [pick, setPick] = useState(null);
  const [score, setScore] = useState(0);
  const [err, setErr] = useState("");
  useEffect(() => {
    const sys = `Create a fill-in-the-blank exercise for a Czech English learner. Return ONLY JSON: {"items":[{"s":"sentence with ___ for the missing word","a":"correct word exactly as it fits","o":["3 wrong but plausible options"]}]}. 8 items, each using a different word from the list, natural sentences under 14 words.`;
      askClaude([{ role: "user", content: "Words: " + words.slice(0, 20).map((w) => w.en).join(", ") + ". Topic: " + lesson.title }], sys)
      .then((t) => setItems(parseJSON(t).items))
      .catch((e) => setErr("Nepodařilo se připravit cvičení: " + e.message));
  }, []);
  const opts = useMemo(() => {
    if (!items || !items[i]) return [];
    return [items[i].a, ...items[i].o].sort(() => Math.random() - 0.5);
  }, [items, i]);
  if (err) return <div className="scr"><button className="soft" onClick={back}>Zpět</button><Err msg={err} /></div>;
  if (!items) return <div className="scr"><button className="soft" onClick={back}>Zpět</button><div className="soft" style={{ marginTop: 20 }}>Připravuji cvičení…</div></div>;
  if (i >= items.length) return (
    <div className="scr" style={{ textAlign: "center", paddingTop: 80 }}>
      <div style={{ fontSize: 40, fontWeight: 600 }}>{score} / {items.length}</div>
      <div className="soft">{score === items.length ? "Bez chyby." : score >= items.length / 2 ? "Dobré, zopakuj si chybějící slovíčka." : "Vrať se ke slovíčkům lekce a zkus to znovu."}</div>
      <button className="pri" style={{ marginTop: 20 }} onClick={back}>Zpět na lekci</button>
    </div>
  );
  const it = items[i];
  return (
    <div className="scr">
      <button className="soft" onClick={back} style={{ display: "flex", alignItems: "center", gap: 4 }}><ArrowLeft size={16} /> {lesson.title}</button>
      <div className="mute" style={{ marginTop: 14 }}>{i + 1} / {items.length}</div>
      <div style={{ fontSize: 20, margin: "10px 0 20px", lineHeight: 1.4 }}>{it.s.replace("___", pick ? (pick === it.a ? it.a : pick) : "______")}</div>
      {opts.map((o) => {
        const st = pick ? (o === it.a ? { background: C.greenSoft, borderColor: C.green } : o === pick ? { background: C.redSoft, borderColor: C.red } : {}) : {};
        return <button key={o} className="tile" style={{ marginBottom: 8, ...st }} onClick={() => { if (!pick) { setPick(o); if (o === it.a) setScore(score + 1); } }}>{o}</button>;
      })}
      {pick && <button className="pri" style={{ marginTop: 10 }} onClick={() => { setPick(null); setI(i + 1); }}>Další</button>}
    </div>
  );
}

function Review({ data, setData, back }) {
  const [queue, setQueue] = useState(() => data.words.filter(isDue).sort((a, b) => (a.due || 0) - (b.due || 0)).map((w) => w.id));
  const [flip, setFlip] = useState(false);
  const [done, setDone] = useState(0);
  const total = useRef(queue.length);
  const w = data.words.find((x) => x.id === queue[0]);
  useEffect(() => { if (w) speak(w.en); }, [w?.id]);
  if (!w) return (
    <div className="scr" style={{ textAlign: "center", paddingTop: 80 }}>
      <Check size={40} color={C.green} />
      <div style={{ fontSize: 22, fontWeight: 600, marginTop: 10 }}>Hotovo</div>
      <div className="soft">{done ? `${done} slovíček zopakováno. Další čekají zítra.` : "Nic nečeká na opakování. Přidej lekci nebo se vrať zítra."}</div>
      <button className="pri" style={{ marginTop: 20 }} onClick={back}>Zpět</button>
    </div>
  );
  const lesson = data.lessons.find((l) => l.id === w.lessonId);
  async function answer(g) {
    const nw = grade(w, g);
    const nd = { ...data, words: data.words.map((x) => (x.id === w.id ? nw : x)), log: [...data.log, { id: uid(), d: today(), wordId: w.id, g }] };
    setData(nd); saveData(nd);
    setFlip(false); setDone(done + 1);
    setQueue(g === 0 ? [...queue.slice(1), w.id] : queue.slice(1));
  }
  return (
    <div className="scr" style={{ display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <button className="soft" onClick={back}><X size={18} /></button>
        <span className="mute">{done + 1} / {total.current}</span>
      </div>
      <div style={{ height: 16, background: C.line, borderRadius: 8, margin: "12px 0 20px" }}><div style={{ width: `${Math.max(4, (done / total.current) * 100)}%`, height: 16, background: C.grn, borderRadius: 8, transition: "width .2s" }} /></div>
      <button onClick={() => setFlip(true)} className="panel" style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", textAlign: "center", cursor: flip ? "default" : "pointer", borderBottomWidth: 4 }}>
        <Pill>{w.lv} · {lesson?.title}</Pill>
        <div style={{ fontSize: 32, fontWeight: 600, marginTop: 24, letterSpacing: "-0.01em" }}>{w.en}</div>
        <div className="soft" style={{ marginTop: 6, display: "flex", gap: 6, alignItems: "center" }}>{w.ipa}<span onClick={(e) => { e.stopPropagation(); speak(w.en); }}><Volume2 size={16} color={C.sea} /></span></div>
        <div style={{ width: 40, height: 1, background: C.line, margin: "24px auto" }} />
        {flip ? (
          <>
            <div style={{ fontSize: 22 }}>{w.cz}</div>
            {w.ex && <div className="soft" style={{ marginTop: 10, fontStyle: "italic" }}>{w.ex}</div>}
            <div className="mute" style={{ marginTop: 16 }}>{w.seen ? `Viděno ${w.seen}×` : "Poprvé"}</div>
          </>
        ) : <div className="mute">Klepni pro odpověď</div>}
      </button>
      {flip ? (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginTop: 12 }}>
          <button className="g" style={{ background: C.red, color: "#fff", borderColor: "#C41F1F" }} onClick={() => answer(0)}><b>Nevím</b><span>{nextLabel(w, 0)}</span></button>
          <button className="g" style={{ background: C.yel, color: "#5a4300", borderColor: C.yelDark }} onClick={() => answer(1)}><b>Těžké</b><span>{nextLabel(w, 1)}</span></button>
          <button className="g" style={{ background: C.grn, color: "#fff", borderColor: C.grnDark }} onClick={() => answer(2)}><b>Umím</b><span>{nextLabel(w, 2)}</span></button>
        </div>
      ) : <button className="pri" style={{ marginTop: 12, alignSelf: "center" }} onClick={() => setFlip(true)}>Ukázat překlad</button>}
    </div>
  );
}

const TALK_SYS = (lesson, words, level) => `You are a friendly English tutor talking with Jan, a Czech adult learner in an A2.2 (pre-intermediate) class; his estimated vocabulary level is ${level}. Use simple, clear English suited to A2: short sentences, common words, present/past simple and basic future, no idioms. Keep replies to 1-2 sentences and always end with one easy question to keep him talking. If he struggles, rephrase more simply. ${lesson ? `Topic of today's lesson: ${lesson.title}. Try to use and elicit these words: ${words.join(", ")}.` : "Pick everyday or work topics."}
Return ONLY JSON: {"reply":"what you say next","ok":true/false,"correct":"his last sentence rewritten fully correct (null if ok)","wrongPart":"the wrong words (null if ok)","why":"one short explanation in Czech, e.g. 'present perfect = have + 3. tvar: worked'","cz":"Czech translation of the correct sentence","type":"čas|člen|předložka|slovosled|slovíčko|množné číslo|jiné","lv":"CEFR level of the correct sentence A1-C2"}.
Mark ok=false only for real grammar or vocabulary mistakes, not for missing punctuation, capitalisation or speech-recognition slips. Never put the correction into the reply itself.`;

function Talk({ data, setData, back, lesson }) {
  const [msgs, setMsgs] = useState([]);
  const [busy, setBusy] = useState(false);
  const [rec, setRec] = useState(false);
  const [text, setText] = useState("");
  const [err, setErr] = useState("");
  const [summary, setSummary] = useState(null);
  const [pending, setPending] = useState(null);
  const recRef = useRef(null);
  const endRef = useRef(null);
  const words = data.words.filter((w) => !lesson || w.lessonId === lesson.id).slice(-30).map((w) => w.en);
  const level = estimateLevel(data.words).level;
  const hasSR = typeof window !== "undefined" && (window.SpeechRecognition || window.webkitSpeechRecognition);

  useEffect(() => { if (msgs.length === 0) send(null); }, []);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs, busy]);

  async function send(userText) {
    setBusy(true); setErr("");
    const history = [...msgs, ...(userText ? [{ role: "user", text: userText }] : [])];
    if (userText) setMsgs(history);
    try {
      const api = history.map((m) => ({ role: m.role, content: m.role === "user" ? m.text : JSON.stringify({ reply: m.text, ok: true }) }));
      if (api.length === 0) api.push({ role: "user", content: "(Jan just joined. Greet him and start the conversation.)" });
      const j = parseJSON(await askClaude(api, TALK_SYS(lesson, words, level)));
      const bad = userText && j.ok === false && j.correct && similarity(userText, j.correct) < 0.97;
      const fix = bad ? (j.wrongPart ? `${j.wrongPart} → ${j.correct}` : j.correct) : null;
      const next = history.map((m, k) => (k === history.length - 1 && m.role === "user" ? { ...m, fix, ok: !bad } : m));
      if (bad) {
        setMsgs(next);
        setPending({ wrong: userText, correct: j.correct, why: j.why, cz: j.cz, type: j.type, lv: j.lv, reply: j.reply });
        if (!data.sentences.some((x) => norm(x.en) === norm(j.correct))) {
          const sent = { id: uid(), d: today(), cz: j.cz || "", en: j.correct, wrong: userText, why: j.why || "", type: j.type || "", lv: j.lv || "A2", ease: 2.5, interval: 0, reps: 0, lapses: 0, due: Date.now() + DAY, seen: 0, last: 0 };
          const nd = { ...data, sentences: [...data.sentences, sent] }; setData(nd); saveData(nd);
        }
      } else {
        setMsgs([...next, { role: "assistant", text: j.reply }]);
        speak(j.reply);
      }
    } catch (e) { setErr("Lektor neodpověděl: " + e.message); }
    setBusy(false);
  }
  function startRec() {
    if (!hasSR) return;
    window.speechSynthesis?.cancel();
    const R = window.SpeechRecognition || window.webkitSpeechRecognition;
    const r = new R(); r.lang = "en-GB"; r.interimResults = false; r.maxAlternatives = 1;
    r.onresult = (e) => { const t = e.results[0][0].transcript; setRec(false); send(t); };
    r.onerror = (e) => { setRec(false); setErr(e.error === "not-allowed" ? "Mikrofon není povolen. Napiš odpověď textem." : "Nerozuměl jsem, zkus to znovu."); };
    r.onend = () => setRec(false);
    recRef.current = r; setRec(true); r.start();
  }
  function stopRec() { recRef.current?.stop(); setRec(false); }
  async function finish() {
    const mine = msgs.filter((m) => m.role === "user");
    const errs = mine.filter((m) => m.fix).map((m) => m.fix);
    const s = { id: uid(), d: today(), turns: mine.length, ok: mine.filter((m) => m.ok !== false).length, errs, topic: lesson?.title || "volné téma" };
    const nd = { ...data, sessions: [...data.sessions, s] };
    setData(nd); await saveData(nd);
    setSummary(s);
  }
  if (summary) return (
    <div className="scr">
      <h1 className="h1">Shrnutí</h1>
      <div className="panel">
        <div style={{ fontSize: 28, fontWeight: 600 }}>{summary.turns ? Math.round((summary.ok / summary.turns) * 100) : 0} %</div>
        <div className="soft">vět bez chyby ({summary.ok} z {summary.turns})</div>
      </div>
      <div style={{ fontWeight: 500, margin: "16px 0 6px" }}>Co opravit</div>
      {summary.errs.length === 0 ? <div className="soft">Žádné chyby k opravě.</div> : summary.errs.map((e, k) => <div key={k} className="row" style={{ fontSize: 14 }}>{e}</div>)}
      <button className="pri" style={{ marginTop: 20 }} onClick={back}>Zavřít</button>
    </div>
  );
  return (
    <div className="scr" style={{ display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <button className="soft" onClick={back}><X size={18} /></button>
        <span className="mute">{lesson ? lesson.title : "Volná konverzace"}</span>
        <button className="mute" onClick={finish} disabled={msgs.length < 2}>Ukončit</button>
      </div>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8, marginTop: 14, overflowY: "auto" }}>
        {msgs.map((m, k) => (
          <div key={k} className="bubble" style={m.role === "user" ? { background: C.seaSoft, color: "#1899D6", alignSelf: "flex-end", borderColor: "#84D8FF" } : { background: "#fff" }}>
            {m.role === "assistant" && <button onClick={() => speak(m.text)} style={{ marginRight: 6, verticalAlign: "middle" }}><Volume2 size={14} color={C.sea} /></button>}
            {m.text}
            {m.fix && <div style={{ fontSize: 15, color: C.amber, marginTop: 6, fontWeight: 600 }}>{m.fix}</div>}
          </div>
        ))}
        {pending && <CorrectionCard key={pending.correct} pending={pending} hasSR={hasSR} onDone={() => { const r = pending.reply; setPending(null); setMsgs((m) => [...m, { role: "assistant", text: r }]); speak(r); }} />}
        {busy && <div className="soft" style={{ color: C.blu }}>Lektor přemýšlí…</div>}
        <div ref={endRef} />
      </div>
      <Err msg={err} />
      <div style={{ textAlign: "center", margin: "14px 0 8px" }}>
        {hasSR ? (
          <>
            <div className={"micwrap" + (rec ? " rec" : "")}>
              <span className="ring" /><span className="ring" /><span className="ring" />
              <button onClick={rec ? stopRec : startRec} disabled={busy || !!pending} aria-label={rec ? "Zastavit" : "Mluvit"} style={{ width: 80, height: 80, borderRadius: "50%", background: rec ? C.red : C.grn, color: "#fff", boxShadow: `0 5px 0 ${rec ? "#C41F1F" : C.grnDark}`, display: "inline-flex", alignItems: "center", justifyContent: "center", position: "relative", zIndex: 1 }}>
                {rec ? <Square size={26} /> : <Mic size={32} />}
              </button>
            </div>
            <div style={{ marginTop: 2, minHeight: 32, display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
              {rec ? <><span className="bars"><span className="bar" /><span className="bar" /><span className="bar" /><span className="bar" /><span className="bar" /></span><span style={{ color: C.red, fontWeight: 800 }}>Poslouchám… klepni pro odeslání</span></> : <span className="soft">Klepni a mluv</span>}
            </div>
          </>
        ) : <div className="mute">Rozpoznávání řeči tu není k dispozici, napiš odpověď.</div>}
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <input type="text" value={text} onChange={(e) => setText(e.target.value)} placeholder="nebo napiš anglicky" onKeyDown={(e) => { if (e.key === "Enter" && text.trim()) { send(text.trim()); setText(""); } }} />
        <button className="sec" disabled={busy || !!pending || !text.trim()} onClick={() => { send(text.trim()); setText(""); }}>Poslat</button>
      </div>
    </div>
  );
}


// ---------- Porovnání vět (tolerantní k drobným odchylkám rozpoznávání řeči)
const norm = (t) => (t || "").toLowerCase().replace(/[’']/g, "'").replace(/[^a-z0-9' ]+/g, " ").replace(/\s+/g, " ").trim();
function lev(a, b) {
  const m = a.length, n = b.length; if (!m) return n; if (!n) return m;
  let prev = Array.from({ length: n + 1 }, (_, i) => i);
  for (let i = 1; i <= m; i++) {
    const cur = [i];
    for (let j = 1; j <= n; j++) cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    prev = cur;
  }
  return prev[n];
}
function similarity(a, b) { a = norm(a); b = norm(b); if (!a || !b) return 0; return 1 - lev(a, b) / Math.max(a.length, b.length); }
function missingWords(said, target) {
  const s = new Set(norm(said).split(" "));
  return norm(target).split(" ").filter((w) => !s.has(w));
}

// ---------- Karta opravy v konverzaci: řekni to správně
function CorrectionCard({ pending, onDone, hasSR }) {
  const [text, setText] = useState("");
  const [tries, setTries] = useState(0);
  const [msg, setMsg] = useState("");
  const [rec, setRec] = useState(false);
  const recRef = useRef(null);
  useEffect(() => { speak(pending.correct); }, []);
  function check(said) {
    const sim = similarity(said, pending.correct);
    if (sim >= 0.85) { setMsg("ok"); setTimeout(() => onDone(true), 700); return; }
    const t = tries + 1; setTries(t);
    const miss = missingWords(said, pending.correct);
    if (t >= 2) { setMsg("Nevadí, jdeme dál. Věta se ti ještě vrátí v opakování."); setTimeout(() => onDone(false), 1500); return; }
    setMsg(miss.length ? "Ještě jednou. Chybí: " + miss.join(", ") : "Skoro. Zkus to ještě jednou přesně podle vzoru.");
  }
  function startRec() {
    if (!hasSR) return;
    window.speechSynthesis?.cancel();
    const R = window.SpeechRecognition || window.webkitSpeechRecognition;
    const r = new R(); r.lang = "en-GB"; r.interimResults = false;
    r.onresult = (e) => { setRec(false); check(e.results[0][0].transcript); };
    r.onerror = () => { setRec(false); setMsg("Nerozuměl jsem, zkus to znovu nebo napiš."); };
    r.onend = () => setRec(false);
    recRef.current = r; setRec(true); r.start();
  }
  const ok = msg === "ok";
  return (
    <div className="panel" style={{ borderColor: ok ? C.grn : "#F5D77A", background: ok ? C.greenSoft : "#FFF9E6", marginTop: 8 }}>
      <div className="mute" style={{ color: C.amber }}>Oprava · {pending.type || "gramatika"}{pending.lv ? ` · ${pending.lv}` : ""}</div>
      <div className="soft" style={{ textDecoration: "line-through", marginTop: 4 }}>{pending.wrong}</div>
      <div style={{ fontSize: 20, fontWeight: 800, color: C.grnDark, marginTop: 4, display: "flex", gap: 8, alignItems: "center" }}>
        <button onClick={() => speak(pending.correct)} aria-label="Přehrát"><Volume2 size={18} color={C.blu} /></button>{pending.correct}
      </div>
      {pending.why && <div className="soft" style={{ marginTop: 4 }}>{pending.why}</div>}
      {ok ? <div style={{ fontWeight: 800, color: C.grnDark, marginTop: 10 }}>Správně.</div> : (
        <>
          <div style={{ fontWeight: 800, marginTop: 12 }}>Řekni to správně</div>
          {msg && <div style={{ color: C.red, marginTop: 4, fontSize: 15 }}>{msg}</div>}
          <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 8 }}>
            {hasSR && <button onClick={rec ? () => recRef.current?.stop() : startRec} aria-label="Mluvit" style={{ width: 52, height: 52, borderRadius: "50%", background: rec ? C.red : C.grn, color: "#fff", display: "inline-flex", alignItems: "center", justifyContent: "center", boxShadow: `0 4px 0 ${rec ? "#C41F1F" : C.grnDark}`, flexShrink: 0 }}>{rec ? <Square size={20} /> : <Mic size={24} />}</button>}
            <input type="text" value={text} onChange={(e) => setText(e.target.value)} placeholder="nebo napiš větu" onKeyDown={(e) => { if (e.key === "Enter" && text.trim()) { check(text); setText(""); } }} />
            <button className="sec" disabled={!text.trim()} onClick={() => { check(text); setText(""); }}>OK</button>
          </div>
          <button className="mute" style={{ marginTop: 10 }} onClick={() => onDone(false)}>Přeskočit</button>
        </>
      )}
    </div>
  );
}

// ---------- Opakování vět (CZ → EN, řekni nebo napiš)
function SentenceReview({ data, setData, back }) {
  const [queue, setQueue] = useState(() => data.sentences.filter(isDue).sort((a, b) => (a.due || 0) - (b.due || 0)).map((x) => x.id));
  const [text, setText] = useState("");
  const [result, setResult] = useState(null); // {sim, said}
  const [rec, setRec] = useState(false);
  const [done, setDone] = useState(0);
  const total = useRef(queue.length);
  const recRef = useRef(null);
  const it = data.sentences.find((x) => x.id === queue[0]);
  const hasSR = typeof window !== "undefined" && (window.SpeechRecognition || window.webkitSpeechRecognition);
  if (!it) return (
    <div className="scr" style={{ textAlign: "center", paddingTop: 80 }}>
      <Check size={40} color={C.green} />
      <div style={{ fontSize: 22, fontWeight: 800, marginTop: 10 }}>Hotovo</div>
      <div className="soft">{done ? `${done} vět zopakováno.` : data.sentences.length ? "Žádná věta dnes nečeká." : "Zatím žádné věty. Vznikají z oprav v konverzaci."}</div>
      <button className="pri" style={{ marginTop: 20 }} onClick={back}>Zpět</button>
    </div>
  );
  function check(said) { setResult({ sim: similarity(said, it.en), said }); speak(it.en); }
  function startRec() {
    window.speechSynthesis?.cancel();
    const R = window.SpeechRecognition || window.webkitSpeechRecognition;
    const r = new R(); r.lang = "en-GB"; r.interimResults = false;
    r.onresult = (e) => { setRec(false); check(e.results[0][0].transcript); };
    r.onerror = () => setRec(false); r.onend = () => setRec(false);
    recRef.current = r; setRec(true); r.start();
  }
  async function answer(g) {
    const nw = grade(it, g);
    const nd = { ...data, sentences: data.sentences.map((x) => (x.id === it.id ? nw : x)), log: [...data.log, { id: uid(), d: today(), wordId: it.id, g }] };
    setData(nd); saveData(nd);
    setResult(null); setText(""); setDone(done + 1);
    setQueue(g === 0 ? [...queue.slice(1), it.id] : queue.slice(1));
  }
  const good = result && result.sim >= 0.85;
  return (
    <div className="scr" style={{ display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <button className="soft" onClick={back}><X size={18} /></button>
        <span className="mute">Věty · {done + 1} / {total.current}</span>
      </div>
      <div style={{ height: 16, background: C.line, borderRadius: 8, margin: "12px 0 20px" }}><div style={{ width: `${Math.max(4, (done / total.current) * 100)}%`, height: 16, background: C.grn, borderRadius: 8 }} /></div>
      <div className="panel" style={{ flex: 1, textAlign: "center", display: "flex", flexDirection: "column", justifyContent: "center", borderBottomWidth: 4 }}>
        <span className="pill" style={{ background: C.seaSoft, color: C.blu, alignSelf: "center" }}>{it.lv || "A2"} · {it.type || "věta"}</span>
        <div className="soft" style={{ marginTop: 20 }}>Řekni anglicky</div>
        <div style={{ fontSize: 24, fontWeight: 800, marginTop: 6 }}>{it.cz}</div>
        {result && (
          <div style={{ marginTop: 20 }}>
            <div className="soft">Řekl jsi: {result.said}</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: good ? C.grnDark : C.red, marginTop: 6 }}>{it.en}</div>
            {!good && missingWords(result.said, it.en).length > 0 && <div style={{ color: C.red, fontSize: 15, marginTop: 4 }}>Chybí: {missingWords(result.said, it.en).join(", ")}</div>}
            {it.why && <div className="soft" style={{ marginTop: 6 }}>{it.why}</div>}
          </div>
        )}
      </div>
      {result ? (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginTop: 12 }}>
          <button className="g" style={{ background: C.red, color: "#fff", borderColor: "#C41F1F" }} onClick={() => answer(0)}><b>Nevím</b><span>{nextLabel(it, 0)}</span></button>
          <button className="g" style={{ background: C.yel, color: "#5a4300", borderColor: C.yelDark }} onClick={() => answer(1)}><b>Těžké</b><span>{nextLabel(it, 1)}</span></button>
          <button className="g" style={{ background: C.grn, color: "#fff", borderColor: C.grnDark, outline: good ? "3px solid #2F7A00" : "none" }} onClick={() => answer(2)}><b>Umím</b><span>{nextLabel(it, 2)}</span></button>
        </div>
      ) : (
        <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 12 }}>
          {hasSR && <button onClick={rec ? () => recRef.current?.stop() : startRec} aria-label="Mluvit" style={{ width: 56, height: 56, borderRadius: "50%", background: rec ? C.red : C.grn, color: "#fff", display: "inline-flex", alignItems: "center", justifyContent: "center", boxShadow: `0 4px 0 ${rec ? "#C41F1F" : C.grnDark}`, flexShrink: 0 }}>{rec ? <Square size={22} /> : <Mic size={26} />}</button>}
          <input type="text" value={text} onChange={(e) => setText(e.target.value)} placeholder="nebo napiš" onKeyDown={(e) => { if (e.key === "Enter" && text.trim()) check(text); }} />
          <button className="sec" disabled={!text.trim()} onClick={() => check(text)}>OK</button>
        </div>
      )}
    </div>
  );
}

// ---------- Testy
const TEST_SYS = `Create an English test for a Czech A2.2 learner. Return ONLY JSON: {"items":[{"q":"question or sentence with ___","a":"correct answer","o":["3 wrong but plausible options"],"lv":"CEFR A1-C2","k":"vocab|grammar"}]}. Mix: about 6 vocabulary items (fill the word into a natural sentence, or Czech→English meaning) and 4 grammar items using the grammar topics given. 10 items, short sentences (max 14 words), each item different.`;

function TestRun({ data, setData, back, scope, lessonId, retakeOf }) {
  const [items, setItems] = useState(null);
  const [i, setI] = useState(0);
  const [pick, setPick] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [err, setErr] = useState("");
  const [saved, setSaved] = useState(false);
  const lesson = data.lessons.find((l) => l.id === lessonId);
  useEffect(() => {
    if (retakeOf) { const t = data.tests.find((x) => x.id === retakeOf); if (t) { setItems(t.items); return; } }
    const ws = (lessonId ? data.words.filter((w) => w.lessonId === lessonId) : data.words).slice().sort(() => Math.random() - 0.5).slice(0, 25);
    const gs = (lessonId ? data.lessons.filter((l) => l.id === lessonId) : data.lessons).flatMap((l) => l.grammar || []).map((g) => g.name).slice(0, 6);
    if (ws.length < 4) { setErr("Na test je potřeba aspoň 4 slovíčka."); return; }
    askClaude([{ role: "user", content: "Words (en = cz): " + ws.map((w) => `${w.en} = ${w.cz}`).join("; ") + ". Grammar topics: " + (gs.join(", ") || "present simple, past simple, will") }], TEST_SYS)
      .then((t) => setItems(parseJSON(t).items)).catch((e) => setErr("Test se nepodařilo připravit: " + e.message));
  }, []);
  const opts = useMemo(() => (items && items[i] ? [items[i].a, ...items[i].o].sort(() => Math.random() - 0.5) : []), [items, i]);
  useEffect(() => {
    if (items && i >= items.length && !saved) {
      const correct = answers.filter((a) => a.ok).length;
      const rec = { id: uid(), d: today(), scope: lessonId ? "lesson" : "all", lessonId: lessonId || null, total: items.length, correct, items, retakeOf: retakeOf || null };
      const nd = { ...data, tests: [...data.tests, rec] }; setData(nd); saveData(nd); setSaved(true);
    }
  }, [i, items]);
  if (err) return <div className="scr"><button className="soft" onClick={back}>Zpět</button><Err msg={err} /></div>;
  if (!items) return <div className="scr"><button className="soft" onClick={back}>Zpět</button><div className="soft" style={{ marginTop: 20 }}>Připravuji test…</div></div>;
  if (i >= items.length) {
    const correct = answers.filter((a) => a.ok).length; const pct = Math.round((correct / items.length) * 100);
    return (
      <div className="scr">
        <div className="hero" style={{ textAlign: "center", background: pct >= 70 ? undefined : "linear-gradient(160deg,#FF9600,#E36D00)", boxShadow: pct >= 70 ? undefined : "0 6px 0 #B85600" }}>
          <div style={{ fontSize: 48, fontWeight: 800 }}>{pct} %</div>
          <div>{correct} z {items.length} správně · {lesson ? lesson.title : "všechny lekce"}</div>
        </div>
        <div style={{ fontWeight: 800, margin: "16px 0 6px" }}>Kde byly chyby</div>
        {answers.filter((a) => !a.ok).length === 0 ? <div className="soft">Žádné chyby.</div> : answers.filter((a) => !a.ok).map((a, k) => (
          <div key={k} className="panel" style={{ marginBottom: 8, padding: "10px 14px" }}>
            <div className="soft">{a.q}</div>
            <div style={{ color: C.red, textDecoration: "line-through" }}>{a.pick}</div>
            <div style={{ color: C.grnDark, fontWeight: 800 }}>{a.a} <span className="pill" style={{ background: C.seaSoft, color: C.blu, marginLeft: 6 }}>{a.lv}</span></div>
          </div>
        ))}
        <button className="pri" style={{ marginTop: 16 }} onClick={back}>Zavřít</button>
      </div>
    );
  }
  const it = items[i];
  return (
    <div className="scr">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <button className="soft" onClick={back}><X size={18} /></button>
        <span className="mute">Test · {i + 1} / {items.length}</span>
      </div>
      <div style={{ height: 16, background: C.line, borderRadius: 8, margin: "12px 0 16px" }}><div style={{ width: `${Math.max(4, (i / items.length) * 100)}%`, height: 16, background: C.blu, borderRadius: 8 }} /></div>
      <div style={{ display: "flex", gap: 6 }}><span className="pill" style={{ background: C.seaSoft, color: C.blu }}>{it.lv}</span><span className="pill" style={{ background: C.bg, color: C.soft }}>{it.k === "grammar" ? "gramatika" : "slovíčko"}</span></div>
      <div style={{ fontSize: 22, margin: "12px 0 20px", lineHeight: 1.4 }}>{it.q}</div>
      {opts.map((o) => {
        const st = pick ? (o === it.a ? { background: C.greenSoft, borderColor: C.grn } : o === pick ? { background: C.redSoft, borderColor: C.red } : {}) : {};
        return <button key={o} className="tile" style={{ marginBottom: 8, fontSize: 18, ...st }} onClick={() => { if (!pick) { setPick(o); setAnswers([...answers, { q: it.q, a: it.a, pick: o, ok: o === it.a, lv: it.lv }]); } }}>{o}</button>;
      })}
      {pick && <button className="pri" style={{ marginTop: 10 }} onClick={() => { setPick(null); setI(i + 1); }}>{i + 1 >= items.length ? "Vyhodnotit" : "Další"}</button>}
    </div>
  );
}

function Tests({ data, go, startTest }) {
  const [lessonId, setLessonId] = useState("");
  const tests = data.tests.slice().reverse();
  const nameOf = (t) => (t.scope === "lesson" ? data.lessons.find((l) => l.id === t.lessonId)?.title || "lekce" : "všechny lekce");
  const last10 = data.tests.slice(-10);
  return (
    <div className="scr">
      <h1 className="h1">Testy</h1>
      <div className="panel">
        <div style={{ fontWeight: 800 }}>Nový test</div>
        <div className="soft" style={{ marginTop: 2 }}>10 otázek: slovíčka a gramatika, s výběrem odpovědi.</div>
        <select value={lessonId} onChange={(e) => setLessonId(e.target.value)} style={{ width: "100%", marginTop: 10, padding: "10px 12px", borderRadius: 12, border: `2px solid ${C.line}`, font: "inherit", background: "#fff" }}>
          <option value="">Ze všech lekcí</option>
          {data.lessons.slice().reverse().map((l) => <option key={l.id} value={l.id}>{l.title}</option>)}
        </select>
        <button className="pri" style={{ marginTop: 10, background: C.blu, boxShadow: `0 4px 0 ${C.bluDark}` }} disabled={data.words.length < 4} onClick={() => startTest({ lessonId: lessonId || null })}>Spustit test</button>
      </div>
      {last10.length > 1 && (
        <div className="panel" style={{ marginTop: 12 }}>
          <div className="mute">Vývoj úspěšnosti</div>
          <div style={{ display: "flex", gap: 6, alignItems: "flex-end", height: 60, marginTop: 8 }}>
            {last10.map((t) => { const p = t.total ? t.correct / t.total : 0; return <div key={t.id} title={`${Math.round(p * 100)} %`} style={{ flex: 1, height: `${Math.max(6, p * 100)}%`, background: p >= 0.7 ? C.grn : p >= 0.5 ? C.yel : C.red, borderRadius: 6 }} />; })}
          </div>
        </div>
      )}
      <div style={{ fontWeight: 800, margin: "16px 0 6px" }}>Historie</div>
      {tests.length === 0 && <div className="soft">Zatím žádný test.</div>}
      {tests.map((t) => { const p = Math.round((t.correct / t.total) * 100); return (
        <div key={t.id} className="tile" style={{ marginBottom: 8, borderLeft: `6px solid ${p >= 70 ? C.grn : p >= 50 ? C.yel : C.red}` }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div><div style={{ fontWeight: 800 }}>{p} % <span className="soft" style={{ fontWeight: 500 }}>· {t.correct} z {t.total}</span></div><div className="mute">{new Date(t.d).toLocaleDateString("cs-CZ")} · {nameOf(t)}{t.retakeOf ? " · opakování" : ""}</div></div>
            <button className="sec" onClick={() => startTest({ lessonId: t.lessonId, retakeOf: t.id })}>Znovu</button>
          </div>
        </div>
      ); })}
    </div>
  );
}

function Practice({ data, go }) {
  const dw = data.words.filter(isDue).length, ds = data.sentences.filter(isDue).length;
  return (
    <div className="scr">
      <h1 className="h1">Opakovat</h1>
      <button className="tileC" style={{ background: "linear-gradient(160deg,#58CC02,#3E9E00)", boxShadow: "0 5px 0 #2F7A00", marginBottom: 12 }} onClick={() => go("review")}>
        <Layers size={26} /><div style={{ fontWeight: 800, marginTop: 8, fontSize: 18 }}>Slovíčka</div><div className="mute">{dw ? `${dw} čeká na opakování` : "dnes vše hotovo"} · celkem {data.words.length}</div>
      </button>
      <button className="tileC" style={{ background: "linear-gradient(160deg,#FF9600,#E36D00)", boxShadow: "0 5px 0 #B85600", marginBottom: 12 }} onClick={() => go("sentences")}>
        <MessageSquareText size={26} /><div style={{ fontWeight: 800, marginTop: 8, fontSize: 18 }}>Věty z oprav</div><div className="mute">{ds ? `${ds} čeká na opakování` : data.sentences.length ? "dnes vše hotovo" : "vznikají z oprav v konverzaci"} · celkem {data.sentences.length}</div>
      </button>
      <button className="tileC" style={{ background: "linear-gradient(160deg,#1CB0F6,#1179C7)", boxShadow: "0 5px 0 #0C5E9C" }} onClick={() => go("talk")}>
        <Mic size={26} /><div style={{ fontWeight: 800, marginTop: 8, fontSize: 18 }}>Konverzace</div><div className="mute">lektor opravuje a nechá tě větu říct správně</div>
      </button>
    </div>
  );
}

function estimateLevel(words) {
  const by = LEVELS.map((lv) => { const ws = words.filter((w) => w.lv === lv); const k = ws.filter(isKnown).length; return { lv, n: ws.length, k, p: ws.length ? k / ws.length : 0 }; });
  let level = MY_LEVEL, next = LEVELS[LEVELS.indexOf(MY_LEVEL) + 1];
  for (const b of by) if (b.n >= 8 && b.p >= 0.7) { level = b.lv; next = LEVELS[Math.min(5, LEVELS.indexOf(b.lv) + 1)]; }
  return { by, level, next, strong: by.find((b) => b.lv === level)?.p >= 0.85 };
}

function Stats({ data }) {
  const ws = data.words;
  const known = ws.filter(isKnown).length, learning = ws.filter(isLearning).length, fresh = ws.length - known - learning;
  const { by, level, next, strong } = estimateLevel(ws);
  const ss = data.sessions;
  const turns = ss.reduce((a, s) => a + s.turns, 0), ok = ss.reduce((a, s) => a + s.ok, 0);
  const pct = (n) => (ws.length ? (n / ws.length) * 100 : 0);
  return (
    <div className="scr">
      <h1 className="h1">Statistiky</h1>
      <div className="panel" style={{ background: "linear-gradient(160deg,#1CB0F6,#1179C7)", color: "#fff", border: "none", boxShadow: "0 5px 0 #0C5E9C" }}>
        <div style={{ display: "flex", justifyContent: "space-between" }}><span className="mute" style={{ color: "rgba(255,255,255,.8)" }}>Odhadovaná úroveň</span>{ws.length >= 8 && <span style={{ fontSize: 12, color: "#fff", fontWeight: 800 }}>{level} → {next}</span>}</div>
        {ws.length < 8 ? <div className="soft" style={{ marginTop: 4, color: "rgba(255,255,255,.9)" }}>Skupina A2.2. Přidej lekce a zopakuj slovíčka, pak úroveň zpřesním.</div> : (
          <div style={{ fontSize: 26, fontWeight: 600, marginTop: 2 }}>{level}<span className="soft" style={{ fontWeight: 400, fontSize: 14 }}> · {strong ? "silné" : "rozpracované"}</span></div>
        )}
        <div style={{ display: "flex", gap: 3, marginTop: 10 }}>{LEVELS.map((lv, i) => <div key={lv} style={{ flex: 1, height: 8, borderRadius: 4, background: i <= LEVELS.indexOf(level) && ws.length >= 8 ? "#fff" : "rgba(255,255,255,.3)" }} />)}</div>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>{LEVELS.map((lv) => <span key={lv} style={{ fontSize: 10, fontWeight: 800, color: "rgba(255,255,255,.85)" }}>{lv}</span>)}</div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", textAlign: "center", marginTop: 14 }}>
        <div><div style={{ fontSize: 24, fontWeight: 600 }}>{ws.length}</div><div className="mute">celkem</div></div>
        <div><div style={{ fontSize: 24, fontWeight: 600, color: C.green }}>{known}</div><div className="mute">umím</div></div>
        <div><div style={{ fontSize: 24, fontWeight: 600, color: C.amber }}>{learning}</div><div className="mute">učím se</div></div>
      </div>
      <div style={{ height: 14, borderRadius: 7, display: "flex", overflow: "hidden", marginTop: 10, background: C.line }}>
        <div style={{ width: `${pct(known)}%`, background: C.grn }} /><div style={{ width: `${pct(learning)}%`, background: C.yel }} />
      </div>
      <div className="mute" style={{ marginTop: 4 }}>{fresh} nových, ještě neopakovaných</div>
      <div style={{ fontWeight: 500, margin: "20px 0 4px" }}>Slovíčka podle úrovně</div>
      {by.filter((b) => b.n > 0).map((b) => (
        <div key={b.lv} className="row"><span>{b.lv}</span><span className="soft">{b.n} · umím {Math.round(b.p * 100)} %</span></div>
      ))}
      <div style={{ fontWeight: 500, margin: "20px 0 4px" }}>Konverzace</div>
      {ss.length === 0 ? <div className="soft">Zatím žádná. Zkus si popovídat s lektorem.</div> : (
        <>
          <div className="row"><span>Vět bez chyby</span><span className="soft">{turns ? Math.round((ok / turns) * 100) : 0} % z {turns}</span></div>
          <div className="row"><span>Počet rozhovorů</span><span className="soft">{ss.length}</span></div>
          {ss.slice(-1)[0].errs.length > 0 && <div className="soft" style={{ marginTop: 8 }}>Poslední opravy: {ss.slice(-1)[0].errs.slice(0, 3).join(" · ")}</div>}
        </>
      )}
      <div style={{ fontWeight: 800, margin: "20px 0 4px" }}>Věty z oprav</div>
      {data.sentences.length === 0 ? <div className="soft">Zatím žádné.</div> : (
        <>
          <div className="row"><span>Celkem · umím</span><span className="soft">{data.sentences.length} · {data.sentences.filter(isKnown).length}</span></div>
          {Object.entries(data.sentences.reduce((a, x) => { const k = x.type || "jiné"; a[k] = (a[k] || 0) + 1; return a; }, {})).sort((a, b) => b[1] - a[1]).map(([k, n]) => (
            <div key={k} className="row"><span>{k}</span><span className="soft">{n}×</span></div>
          ))}
        </>
      )}
      <div style={{ fontWeight: 800, margin: "20px 0 4px" }}>Testy</div>
      {data.tests.length === 0 ? <div className="soft">Zatím žádný.</div> : (
        <>
          <div className="row"><span>Počet testů</span><span className="soft">{data.tests.length}</span></div>
          <div className="row"><span>Průměrná úspěšnost</span><span className="soft">{Math.round(data.tests.reduce((a, t) => a + t.correct / t.total, 0) / data.tests.length * 100)} %</span></div>
          <div className="row"><span>Poslední test</span><span className="soft">{Math.round(data.tests.slice(-1)[0].correct / data.tests.slice(-1)[0].total * 100)} %</span></div>
        </>
      )}
      <div className="mute" style={{ marginTop: 24 }}>Umím = interval opakování 7 dní a víc. Úroveň = nejvyšší CEFR, kde umíš aspoň 70 % slovíček.</div>
    </div>
  );
}

function Account({ back, logout }) {
  return (
    <div className="scr">
      <button className="soft" onClick={back} style={{ display: "flex", alignItems: "center", gap: 4 }}><ArrowLeft size={16} /> Zpět</button>
      <h1 className="h1" style={{ marginTop: 10 }}>Účet</h1>
      <div className="panel" style={{ display: "flex", gap: 12, alignItems: "center" }}>
        <UserCircle size={40} color={C.blu} />
        <div><div style={{ fontWeight: 800 }}>Jan</div><div className="soft">Přihlášen PINem · data v Google tabulce</div></div>
      </div>
      <div className="soft" style={{ marginTop: 16 }}>Odhlášením se z tohoto zařízení smaže PIN i místní kopie dat. Po opětovném přihlášení se vše načte z tabulky.</div>
      <button className="pri" style={{ marginTop: 16, background: C.red, boxShadow: "0 4px 0 #C41F1F" }} onClick={logout}><LogOut size={18} /> Odhlásit</button>
      <div className="mute" style={{ marginTop: 24 }}>Verze aplikace {VERSION}</div>
    </div>
  );
}

function PinScreen({ onDone }) {
  const [pin, setP] = useState("");
  return (
    <div className="scr" style={{ paddingTop: 80 }}>
      <img src="/icons/icon-192.png" alt="" width="72" height="72" style={{ borderRadius: 18 }} />
      <h1 className="h1" style={{ marginTop: 16 }}>English</h1>
      {!isConfigured() && <Err msg="Chybí VITE_SHEETS_URL v nastavení Netlify (adresa Apps Script webové aplikace)." />}
      <div className="soft" style={{ marginBottom: 10 }}>Zadej PIN aplikace.</div>
      <input type="text" inputMode="numeric" value={pin} onChange={(e) => setP(e.target.value)} placeholder="PIN" onKeyDown={(e) => e.key === "Enter" && pin && onDone(pin)} />
      <button className="pri" style={{ marginTop: 12 }} disabled={!pin} onClick={() => onDone(pin)}><LogIn size={18} /> Přihlásit</button>
    </div>
  );
}

export default function App() {
  const [data, setData] = useState(null);
  const [needPin, setNeedPin] = useState(!getPin());
  const [tab, setTab] = useState("today");
  const [view, setView] = useState(null);
  const [lessonId, setLessonId] = useState(null);
  const [talkLesson, setTalkLesson] = useState(null);
  const [testOpts, setTestOpts] = useState(null);
  const [banner, setBanner] = useState("");
  const [loadErr, setLoadErr] = useState("");
  const [online, setOnline] = useState(null);

  async function boot() {
    setLoadErr("");
    try {
      const r = await loadData();
      setData(r.data);
      setOnline(r.online);
      if (!r.online) setBanner("Offline režim: " + (r.error || "") + " Používám data uložená v zařízení.");
    } catch (e) {
      clearPin(); setNeedPin(true); setLoadErr(e.message);
    }
  }
  useEffect(() => {
    setErrorHandler((m, ok) => { if (ok === true) { setOnline(true); return; } setOnline(false); setBanner(m); });
    window.speechSynthesis?.getVoices();
    if (!needPin) boot();
  }, []);
  useEffect(() => { if (banner) { const t = setTimeout(() => setBanner(""), 8000); return () => clearTimeout(t); } }, [banner]);

  if (needPin) return <div className="ef"><style>{css}</style><PinScreen onDone={(p) => { setPin(p); setNeedPin(false); boot(); }} />{loadErr && <div className="scr"><Err msg={loadErr} /></div>}</div>;
  if (!data) return <div className="ef"><style>{css}</style><div className="scr soft">Načítám z tabulky…</div></div>;

  const go = (v) => setView(v);
  const back = () => { setView(null); setTalkLesson(null); };
  const logout = () => { if (confirm("Odhlásit toto zařízení?")) { clearPin(); localStorage.removeItem("english:cache"); setData(null); setView(null); setTab("today"); setNeedPin(true); } };
  let body;
  if (view === "account") body = <Account back={back} logout={logout} />;
  else if (view === "review") body = <Review data={data} setData={setData} back={back} />;
  else if (view === "add") body = <AddLesson data={data} setData={setData} back={back} openLesson={(id) => { setLessonId(id); setTab("lessons"); setView("lesson"); }} />;
  else if (view === "lesson") body = <LessonDetail data={data} setData={setData} id={lessonId} back={back} talk={(l) => { setTalkLesson(l); setView("talk"); }} />;
  else if (view === "talk") body = <Talk data={data} setData={setData} back={back} lesson={talkLesson} />;
  else if (view === "sentences") body = <SentenceReview data={data} setData={setData} back={back} />;
  else if (view === "test") body = <TestRun key={JSON.stringify(testOpts)} data={data} setData={setData} back={back} scope={testOpts?.lessonId ? "lesson" : "all"} lessonId={testOpts?.lessonId || null} retakeOf={testOpts?.retakeOf || null} />;
  else if (tab === "today") body = <Today data={data} go={go} name="Jane" />;
  else if (tab === "lessons") body = <Lessons data={data} go={go} open={(id) => { setLessonId(id); setView("lesson"); }} />;
  else if (tab === "practice") body = <Practice data={data} go={go} />;
  else if (tab === "tests") body = <Tests data={data} go={go} startTest={(o) => { setTestOpts(o); setView("test"); }} />;
  else body = <><Stats data={data} /><button onClick={() => go("account")} aria-label="Účet" style={{ position: "absolute", top: 20, right: 20, color: C.blu }}><UserCircle size={30} /></button></>;
  const tabs = [["today", "Dnes", Home], ["lessons", "Lekce", BookOpen], ["practice", "Opakovat", Dumbbell], ["tests", "Testy", ClipboardCheck], ["stats", "Statistiky", BarChart3]];
  return (
    <div className="ef" style={{ position: "relative" }}>
      <style>{css}</style>
      {banner && <div style={{ position: "fixed", top: 36, left: "50%", transform: "translateX(-50%)", maxWidth: 400, width: "calc(100% - 32px)", background: C.amberSoft, color: C.amber, padding: "10px 14px", borderRadius: 12, fontSize: 13, zIndex: 10 }}>{banner}</div>}
      {!view && (
        <div style={{ position: "absolute", top: 8, left: 0, right: 0, display: "flex", justifyContent: "center", pointerEvents: "none" }}>
          <span className="pill" style={online === null ? { background: C.bg, color: C.mute } : online ? { background: C.greenSoft, color: C.green } : { background: C.redSoft, color: C.red }}>
            {online === null ? "…" : online ? <><Wifi size={11} style={{ verticalAlign: "-1px" }} /> online</> : <><WifiOff size={11} style={{ verticalAlign: "-1px" }} /> offline</>}
          </span>
        </div>
      )}
      {body}
      {!view && (
        <nav className="nav">
          {tabs.map(([id, lbl, Icon]) => <button key={id} className={tab === id ? "on" : ""} onClick={() => setTab(id)}><Icon size={20} />{lbl}</button>)}
          <span style={{ position: "absolute", right: 10, bottom: 2, fontSize: 9, color: C.mute, fontWeight: 700 }}>v{VERSION}</span>
        </nav>
      )}
    </div>
  );
}
