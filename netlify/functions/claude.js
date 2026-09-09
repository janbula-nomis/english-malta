// Proxy na Anthropic API. Klíč zůstává na serveru, přístup chrání PIN.
// GET /api/claude = diagnostika (bez tajných hodnot), POST = volání modelu.
const env = (k) => (process.env[k] || "").trim();

export default async (req) => {
  if (req.method === "GET") {
    return json({
      ok: true,
      appPinNastaven: !!env("APP_PIN"),
      apiKlicNastaven: !!env("ANTHROPIC_API_KEY"),
      apiKlicVypadaSpravne: env("ANTHROPIC_API_KEY").startsWith("sk-ant-"),
      model: env("CLAUDE_MODEL") || "claude-sonnet-5 (výchozí)",
      napoveda: "Pokud je něco false: Netlify → Environment variables → zkontroluj název, hodnotu a Scopes (musí zahrnovat Functions) → Trigger deploy.",
    });
  }
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

  const pin = env("APP_PIN");
  if (!pin) return json({ error: { message: "APP_PIN není v Netlify nastaven pro Functions – doplň proměnnou a spusť nový deploy." } }, 500);
  if ((req.headers.get("x-app-pin") || "").trim() !== pin) return json({ error: { message: "Špatný PIN (neshoduje se s APP_PIN v Netlify)." } }, 401);
  if (!env("ANTHROPIC_API_KEY")) return json({ error: { message: "ANTHROPIC_API_KEY není v Netlify nastaven pro Functions." } }, 500);

  const body = await req.json();
  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": env("ANTHROPIC_API_KEY"),
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({ model: env("CLAUDE_MODEL") || "claude-sonnet-5", max_tokens: 2000, ...body }),
  });
  return new Response(await r.text(), { status: r.status, headers: { "Content-Type": "application/json; charset=utf-8" } });
};
const json = (o, status = 200) => new Response(JSON.stringify(o), { status, headers: { "Content-Type": "application/json; charset=utf-8" } });
export const config = { path: "/api/claude" };
