// Datová vrstva: Google Sheets (přes Apps Script) + Netlify funkce pro Claude.
const SHEETS_URL = import.meta.env.VITE_SHEETS_URL;
const CACHE = "english:cache";
const PIN_KEY = "english:pin";
const EMPTY = { lessons: [], words: [], log: [], sessions: [], sentences: [], tests: [] };
const SHEET_NAMES = ["lessons", "words", "log", "sessions", "sentences", "tests"];

export const getPin = () => localStorage.getItem(PIN_KEY) || "";
export const setPin = (p) => localStorage.setItem(PIN_KEY, p);
export const clearPin = () => localStorage.removeItem(PIN_KEY);
export const isConfigured = () => !!SHEETS_URL;

let last = null; // poslední stav známý v Sheets, pro výpočet rozdílu
let chain = Promise.resolve();
let onError = () => {};
export const setErrorHandler = (f) => (onError = f);

const num = (v) => (v === null || v === undefined || v === "" ? 0 : Number(v));
function normalize(d) {
  return {
    lessons: (d.lessons || []).map((l) => ({ ...l, id: String(l.id), created: num(l.created), grammar: Array.isArray(l.grammar) ? l.grammar : [] })),
    words: (d.words || []).map((w) => ({ ...w, id: String(w.id), lessonId: String(w.lessonId), ease: num(w.ease) || 2.5, interval: num(w.interval), reps: num(w.reps), lapses: num(w.lapses), due: num(w.due), seen: num(w.seen), last: num(w.last) })),
    log: (d.log || []).map((l) => ({ ...l, id: String(l.id), g: num(l.g) })),
    sessions: (d.sessions || []).map((s) => ({ ...s, id: String(s.id), turns: num(s.turns), ok: num(s.ok), errs: Array.isArray(s.errs) ? s.errs : [] })),
    sentences: (d.sentences || []).map((x) => ({ ...x, id: String(x.id), ease: num(x.ease) || 2.5, interval: num(x.interval), reps: num(x.reps), lapses: num(x.lapses), due: num(x.due), seen: num(x.seen), last: num(x.last) })),
    tests: (d.tests || []).map((t) => ({ ...t, id: String(t.id), total: num(t.total), correct: num(t.correct), items: Array.isArray(t.items) ? t.items : [], lessonId: t.lessonId ? String(t.lessonId) : null, retakeOf: t.retakeOf ? String(t.retakeOf) : null })),
  };
}

export async function loadData() {
  const pin = getPin();
  try {
    if (!SHEETS_URL) throw new Error("Chybí VITE_SHEETS_URL v Netlify (Environment variables) – po doplnění spusť nový deploy.");
    const r = await fetch(`${SHEETS_URL}?token=${encodeURIComponent(pin)}`);
    const j = await r.json();
    if (j.error) throw new Error(j.error === "unauthorized" ? "Špatný PIN" : j.error);
    const d = normalize(j);
    last = JSON.parse(JSON.stringify(d));
    localStorage.setItem(CACHE, JSON.stringify(d));
    return { data: d, online: true };
  } catch (e) {
    const c = localStorage.getItem(CACHE);
    if (c) { const d = normalize(JSON.parse(c)); last = JSON.parse(JSON.stringify(d)); return { data: d, online: false, error: e.message }; }
    if (e.message === "Špatný PIN") throw e;
    return { data: EMPTY, online: false, error: e.message };
  }
}

function diffOps(prev, next) {
  const ops = [];
  for (const sheet of SHEET_NAMES) {
    const pm = new Map((prev[sheet] || []).map((x) => [x.id, JSON.stringify(x)]));
    const nm = new Map((next[sheet] || []).map((x) => [x.id, x]));
    const up = [...nm.values()].filter((x) => pm.get(x.id) !== JSON.stringify(x));
    const del = [...pm.keys()].filter((id) => !nm.has(id));
    if (up.length) ops.push({ sheet, type: "upsert", rows: up });
    if (del.length) ops.push({ sheet, type: "delete", ids: del });
  }
  return ops;
}

export function saveData(next) {
  localStorage.setItem(CACHE, JSON.stringify(next));
  const snapshot = JSON.parse(JSON.stringify(next));
  chain = chain.then(async () => {
    const ops = diffOps(last || EMPTY, snapshot);
    if (!ops.length) return;
    if (!SHEETS_URL) { onError("Chybí VITE_SHEETS_URL v Netlify – data se ukládají jen v tomto zařízení."); return; }
    try {
      const r = await fetch(SHEETS_URL, { method: "POST", body: JSON.stringify({ token: getPin(), ops }) });
      const j = await r.json();
      if (j.error) throw new Error(j.error);
      last = snapshot;
      onError("", true);
    } catch (e) {
      onError("Uložení do tabulky selhalo: " + e.message + ". Data zůstávají v zařízení, zkusím to znovu při další změně.");
    }
  });
  return chain;
}

export async function askClaude(messages, system) {
  const res = await fetch("/api/claude", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-app-pin": getPin() },
    body: JSON.stringify({ system, messages }),
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error.message || "API error");
  return data.content.filter((c) => c.type === "text").map((c) => c.text).join("\n");
}
