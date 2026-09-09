// Google Apps Script – API nad tabulkou. Nasadit jako Webová aplikace (Spustit jako: já, Přístup: kdokoli).
// PIN aplikace – stejný zadej v Netlify jako APP_PIN. Změň, pokud chceš jiný.
const TOKEN = "736251";

const SHEETS = {
  lessons:  ["id", "title", "level", "grammar", "created"],
  words:    ["id", "lessonId", "en", "ipa", "cz", "ex", "lv", "ease", "interval", "reps", "lapses", "due", "seen", "last"],
  log:      ["id", "d", "wordId", "g"],
  sessions: ["id", "d", "topic", "turns", "ok", "errs"],
  sentences: ["id", "d", "cz", "en", "wrong", "why", "type", "lv", "ease", "interval", "reps", "lapses", "due", "seen", "last"],
  tests: ["id", "d", "scope", "lessonId", "total", "correct", "items", "retakeOf"],
};
const JSON_COLS = ["grammar", "errs", "items"];

function sheet_(name) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(name);
  if (!sh) { sh = ss.insertSheet(name); sh.appendRow(SHEETS[name]); sh.setFrozenRows(1); }
  return sh;
}
function readAll_(name) {
  const sh = sheet_(name), cols = SHEETS[name];
  if (sh.getLastRow() < 2) return [];
  const rows = sh.getRange(2, 1, sh.getLastRow() - 1, cols.length).getValues().filter((r) => r[0] !== "");
  return rows.map((r) => {
    const o = {};
    cols.forEach((c, i) => {
      let v = r[i];
      if (JSON_COLS.includes(c)) { try { v = v ? JSON.parse(v) : []; } catch (e) { v = []; } }
      o[c] = v === "" ? null : v;
    });
    return o;
  });
}
function toRow_(name, o) {
  return SHEETS[name].map((c) => {
    const v = o[c];
    if (v === undefined || v === null) return "";
    return JSON_COLS.includes(c) ? JSON.stringify(v) : v;
  });
}
function upsert_(name, objs) {
  const sh = sheet_(name);
  const ids = sh.getRange(1, 1, Math.max(1, sh.getLastRow()), 1).getValues().map((r) => String(r[0]));
  const toAppend = [];
  objs.forEach((o) => {
    const i = ids.indexOf(String(o.id));
    if (i > 0) sh.getRange(i + 1, 1, 1, SHEETS[name].length).setValues([toRow_(name, o)]);
    else toAppend.push(toRow_(name, o));
  });
  if (toAppend.length) sh.getRange(sh.getLastRow() + 1, 1, toAppend.length, SHEETS[name].length).setValues(toAppend);
}
function remove_(name, idsToDelete) {
  const sh = sheet_(name);
  const ids = sh.getRange(1, 1, Math.max(1, sh.getLastRow()), 1).getValues().map((r) => String(r[0]));
  for (let i = ids.length - 1; i >= 1; i--) if (idsToDelete.includes(ids[i])) sh.deleteRow(i + 1);
}
function ok_(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }
function auth_(t) { return !!t && t === TOKEN; }

function doGet(e) {
  if (!auth_(e.parameter.token)) return ok_({ error: "unauthorized" });
  const out = {};
  Object.keys(SHEETS).forEach((n) => (out[n] = readAll_(n)));
  return ok_(out);
}
function doPost(e) {
  const b = JSON.parse(e.postData.contents || "{}");
  if (!auth_(b.token)) return ok_({ error: "unauthorized" });
  const lock = LockService.getScriptLock(); lock.waitLock(10000);
  try {
    (b.ops || []).forEach((op) => {
      if (!SHEETS[op.sheet]) return;
      if (op.type === "upsert") upsert_(op.sheet, op.rows || []);
      if (op.type === "delete") remove_(op.sheet, (op.ids || []).map(String));
    });
  } finally { lock.releaseLock(); }
  return ok_({ ok: true });
}
