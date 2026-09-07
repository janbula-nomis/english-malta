# English – EF Malta: nasazení

Aplikace = React (Vite) na Netlify. Data v Google Sheets přes Apps Script. Claude přes Netlify funkci (klíč jen na serveru). Přístup chrání jeden PIN, který zadáš na každém zařízení jednou.

## 1. Google Sheets + Apps Script (databáze)

1. Vytvoř nový prázdný sešit na sheets.google.com, pojmenuj třeba „English“.
2. Rozšíření → Apps Script. Smaž obsah souboru Code.gs a vlož obsah `apps-script/Code.gs`. Ulož.
3. Vlevo ozubené kolo (Nastavení projektu) → Vlastnosti skriptu → Přidat vlastnost: název `TOKEN`, hodnota = tvůj PIN (např. 6 číslic). Ulož.
4. Vpravo nahoře Nasadit → Nové nasazení → typ Webová aplikace:
   - Spustit jako: Já
   - Kdo má přístup: Kdokoli
   → Nasadit, potvrď oprávnění. Zkopíruj adresu webové aplikace (končí `/exec`).
5. Test: otevři v prohlížeči `ADRESA/exec?token=TVŮJPIN` – musí vrátit `{"lessons":[],"words":[],...}`. Listy v sešitu se vytvoří automaticky při prvním použití.

Po každé změně kódu v Apps Script je nutné Nasadit → Spravovat nasazení → tužka → Verze: Nová → Nasadit (adresa zůstává stejná).

## 2. Anthropic API klíč

1. console.anthropic.com → Billing → dobij kredit (5 USD stačí na celý pobyt).
2. API Keys → Create key. Zkopíruj, zobrazí se jen jednou.

## 3. Netlify

Varianta A – GitHub (doporučeno, stejně jako NOMIS & HOMES):
1. Nahraj složku projektu do nového GitHub repozitáře (bez `node_modules` a `dist`, viz .gitignore).
2. Netlify → Add new site → Import from Git → vyber repozitář. Build command a publish dir se načtou z `netlify.toml`.

Varianta B – Netlify CLI z počítače:
```
npm install
npm install -g netlify-cli
netlify login
netlify init
netlify deploy --prod
```

V obou případech nastav proměnné prostředí (Site configuration → Environment variables):

| Název | Hodnota |
|---|---|
| `ANTHROPIC_API_KEY` | klíč z kroku 2 |
| `APP_PIN` | stejný PIN jako TOKEN v Apps Script |
| `VITE_SHEETS_URL` | adresa Apps Script `/exec` z kroku 1 |
| `CLAUDE_MODEL` | volitelné, výchozí `claude-sonnet-5` |

Po nastavení proměnných spusť Deploys → Trigger deploy (proměnná VITE_SHEETS_URL se zapéká při buildu).

## 4. Na plochu

- iPhone: otevři adresu v Safari → Sdílet → Přidat na plochu. Ikona žraloka a celá obrazovka.
- Android: Chrome → tři tečky → Přidat na plochu / Nainstalovat aplikaci.
- PC: Chrome/Edge → v adresním řádku ikona „Nainstalovat“ (nebo menu → Nainstalovat stránku jako aplikaci).

Při prvním otevření zadej PIN. Mikrofon povol při první konverzaci.

## Struktura

```
src/App.jsx              aplikace (obrazovky, opakování, konverzace)
src/api.js               načítání a ukládání do Sheets, volání Claude
netlify/functions/claude.js   proxy na Anthropic API
apps-script/Code.gs      API nad tabulkou
public/manifest.webmanifest, public/sw.js, public/icons   PWA
```

Data se při každé změně zapisují do tabulky (jen rozdíly). Když je zařízení offline, změny zůstanou v paměti prohlížeče a zapíší se při další změně online. Změna úrovně skupiny: konstanta `MY_LEVEL` v `src/App.jsx`.
