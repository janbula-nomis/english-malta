// Jazyk rozhraní: cs (výchozí), en, es. Statický slovník pro hlavní prvky, zbytek se přeloží AI jednou a uloží do tabulky (list i18n).
import { useSyncExternalStore } from "react";

export const LANGS = {
  cs: { flag: "🇨🇿", name: "Czech", label: "Čeština" },
  en: { flag: "🇬🇧", name: "English", label: "English" },
  es: { flag: "🇪🇸", name: "Spanish", label: "Español" },
};
const LANG_KEY = "english:lang";
let lang = localStorage.getItem(LANG_KEY) || "cs";
let version = 0;
const subs = new Set();
const notify = () => { version++; subs.forEach((f) => f()); };
export const getLang = () => lang;
export const langName = () => LANGS[lang].name;
export function setLang(l) { lang = l; localStorage.setItem(LANG_KEY, l); notify(); }
export function useI18n() {
  useSyncExternalStore((f) => { subs.add(f); return () => subs.delete(f); }, () => version + ":" + lang);
  return { lang, L, setLang };
}

const STATIC = {
  en: { "Dnes": "Today", "Kurz": "Course", "Lekce": "Lessons", "Opakovat": "Practice", "Statistiky": "Stats", "Zpět": "Back", "Další": "Next", "Začít": "Start", "Zavřít": "Close", "Přihlásit": "Sign in", "Odhlásit": "Sign out", "Účet": "Account", "Slovíčka": "Vocabulary", "Nová lekce": "New lesson", "Mluvit": "Speak", "Konverzace": "Conversation", "Testy": "Tests", "Nevím": "Don't know", "Těžké": "Hard", "Umím": "Know it", "Správně": "Correct", "Špatně": "Wrong", "Hotovo": "Done", "Probíhá": "In progress", "Čeká": "To do", "Gramatika": "Grammar", "Cvičení": "Exercises", "Nepravidelná slovesa": "Irregular verbs", "Frázová slovesa": "Phrasal verbs", "Hovorové fráze": "Everyday phrases", "Věty z oprav": "Corrected sentences", "Ukončit": "Finish", "Přeskočit": "Skip", "Přidat": "Add", "Vyfotit": "Take photo", "Galerie / soubor": "Gallery / file", "Text": "Text", "Vytěžit": "Extract", "Dril": "Drill", "Témata": "Topics", "Ukázat překlad": "Show translation", "Klepni a mluv": "Tap and speak", "Poslat": "Send", "Zkontrolovat": "Check", "Dobré ráno": "Good morning", "Dobrý den": "Good afternoon", "Dobrý večer": "Good evening", "Dnešní opakování": "Today's review", "Opakování za týden": "Reviews this week", "Materiály ze školy": "School materials", "Zvládnuto": "Mastered", "Odhadovaná úroveň": "Estimated level", "Trénink": "Training", "Téma": "Topic", "Odborná témata": "Specialised topics", "Připravit": "Prepare", "slovíček": "words", "z": "of", "zvládnuto": "mastered", "čeká na opakování": "due for review", "otevřít": "open", "umím": "known", "učím se": "learning", "procvičeno": "practised", "Postup": "Progress", "Témata": "Topics", "Nový materiál": "New material", "Zkontroluj a zařaď": "Review and file", "Kam zařadit": "Where to file", "Nové téma": "New topic", "Přidat do": "Add to", "Uložit": "Save", "Zahodit": "Discard", "už máš": "you have it", "Sloučit do": "Merge into", "Přejmenovat": "Rename", "Uklidit": "Clean up", "do tématu": "to topic", "do nového tématu": "to new topic", "Otevřít téma": "Open topic", "Další fotka": "Next photo" },
  es: { "Dnes": "Hoy", "Kurz": "Curso", "Lekce": "Clases", "Opakovat": "Practicar", "Statistiky": "Progreso", "Zpět": "Atrás", "Další": "Siguiente", "Začít": "Empezar", "Zavřít": "Cerrar", "Přihlásit": "Entrar", "Odhlásit": "Salir", "Účet": "Cuenta", "Slovíčka": "Vocabulario", "Nová lekce": "Nueva lección", "Mluvit": "Hablar", "Konverzace": "Conversación", "Testy": "Tests", "Nevím": "No lo sé", "Těžké": "Difícil", "Umím": "Lo sé", "Správně": "Correcto", "Špatně": "Incorrecto", "Hotovo": "Hecho", "Probíhá": "En curso", "Čeká": "Pendiente", "Gramatika": "Gramática", "Cvičení": "Ejercicios", "Nepravidelná slovesa": "Verbos irregulares", "Frázová slovesa": "Phrasal verbs", "Hovorové fráze": "Frases cotidianas", "Věty z oprav": "Frases corregidas", "Ukončit": "Terminar", "Přeskočit": "Saltar", "Přidat": "Añadir", "Vyfotit": "Hacer foto", "Galerie / soubor": "Galería / archivo", "Text": "Texto", "Vytěžit": "Extraer", "Dril": "Práctica", "Témata": "Temas", "Ukázat překlad": "Mostrar traducción", "Klepni a mluv": "Toca y habla", "Poslat": "Enviar", "Zkontrolovat": "Comprobar", "Dobré ráno": "Buenos días", "Dobrý den": "Buenas tardes", "Dobrý večer": "Buenas noches", "Dnešní opakování": "Repaso de hoy", "Opakování za týden": "Repasos de la semana", "Materiály ze školy": "Materiales de la escuela", "Zvládnuto": "Dominado", "Odhadovaná úroveň": "Nivel estimado", "Trénink": "Práctica", "Téma": "Tema", "Odborná témata": "Temas especializados", "Připravit": "Preparar", "slovíček": "palabras", "z": "de", "zvládnuto": "dominado", "čeká na opakování": "para repasar", "otevřít": "abrir", "umím": "sé", "učím se": "aprendiendo", "procvičeno": "practicado", "Postup": "Progreso", "Témata": "Temas", "Nový materiál": "Nuevo material", "Zkontroluj a zařaď": "Revisa y clasifica", "Kam zařadit": "Dónde guardar", "Nové téma": "Nuevo tema", "Přidat do": "Añadir a", "Uložit": "Guardar", "Zahodit": "Descartar", "už máš": "ya lo tienes", "Sloučit do": "Fusionar en", "Přejmenovat": "Renombrar", "Uklidit": "Limpiar", "do tématu": "al tema", "do nového tématu": "al tema nuevo", "Otevřít téma": "Abrir tema", "Další fotka": "Otra foto" },
};

// cache: klíč = lang + "\u0001" + text
const cache = new Map();
const CACHE_KEY = "english:i18n";
try { const c = JSON.parse(localStorage.getItem(CACHE_KEY) || "{}"); Object.entries(c).forEach(([k, v]) => cache.set(k, v)); } catch {}
let persist = null; // callback pro uložení do tabulky
let translator = null; // (lang, texts[]) => Promise<{src: txt}>
export function configureI18n({ onPersist, translate, rows }) { persist = onPersist; translator = translate; (rows || []).forEach((r) => cache.set(r.lang + "\u0001" + r.src, r.txt)); }

const pending = new Set(); let timer = null; let inflight = false;
async function flush() {
  timer = null;
  if (inflight || !translator || lang === "cs" || pending.size === 0) return;
  const batch = [...pending].slice(0, 60); batch.forEach((t) => pending.delete(t));
  inflight = true;
  try {
    const map = await translator(lang, batch);
    const rows = [];
    Object.entries(map || {}).forEach(([src, txt]) => { if (typeof txt === "string" && txt) { cache.set(lang + "\u0001" + src, txt); rows.push({ id: lang + ":" + hash(src), lang, src, txt }); } });
    try { const o = {}; cache.forEach((v, k) => (o[k] = v)); localStorage.setItem(CACHE_KEY, JSON.stringify(o)); } catch {}
    if (rows.length && persist) persist(rows);
    notify();
  } catch (e) { console.warn("translate failed", e); }
  inflight = false;
  if (pending.size) timer = setTimeout(flush, 300);
}
function hash(s) { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return (h >>> 0).toString(36); }

export function L(text) {
  if (lang === "cs" || !text) return text;
  const st = STATIC[lang]?.[text]; if (st) return st;
  const c = cache.get(lang + "\u0001" + text); if (c) return c;
  pending.add(text);
  if (!timer) timer = setTimeout(flush, 400);
  return text;
}
