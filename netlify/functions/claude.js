// Proxy na Anthropic API. Klíč zůstává na serveru, přístup chrání PIN.
export default async (req) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });
  if (req.headers.get("x-app-pin") !== process.env.APP_PIN) {
    return new Response(JSON.stringify({ error: { message: "Špatný PIN" } }), { status: 401, headers: { "Content-Type": "application/json" } });
  }
  const body = await req.json();
  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({ model: process.env.CLAUDE_MODEL || "claude-sonnet-5", max_tokens: 2000, ...body }),
  });
  return new Response(await r.text(), { status: r.status, headers: { "Content-Type": "application/json" } });
};
export const config = { path: "/api/claude" };
