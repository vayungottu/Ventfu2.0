const SYSTEM_PROMPT =
  "You are Venty, an event discovery assistant for the Ventful app. Use browser_search to find real upcoming public events in the user's location. Recommend specific events with date, time, venue, price if available, and the event's own ticket or detail URL. Never invent events or links. Keep answers short, friendly and mobile-friendly, using plain text with short lines (no markdown tables). Exclude adult or explicit events."

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  })

export default async (request) => {
  if (request.method !== "POST") return json({ reply: "Use POST." }, 405)

  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) return json({ reply: "The assistant isn't configured yet (missing Groq API key)." }, 500)

  let payload = {}
  try {
    payload = await request.json()
  } catch {
    return json({ reply: "Invalid request." }, 400)
  }

  const location = String(payload.location || "not provided").slice(0, 120)
  const message = String(payload.message || "What events are coming up?").slice(0, 2000)
  const history = Array.isArray(payload.history)
    ? payload.history
        .filter((item) => item && (item.role === "user" || item.role === "assistant") && typeof item.text === "string")
        .slice(-10)
        .map((item) => ({ role: item.role, content: item.text.slice(0, 2000) }))
    : []

  const today = new Date().toISOString().slice(0, 10)

  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "openai/gpt-oss-120b",
        tools: [{ type: "browser_search" }],
        messages: [
          { role: "system", content: `${SYSTEM_PROMPT}\nToday's date is ${today}. The user's selected location is ${location}.` },
          ...history,
          { role: "user", content: message },
        ],
      }),
    })

    const data = await response.json().catch(() => ({}))
    if (!response.ok) {
      console.error("Groq error", response.status, data?.error?.message)
      return json({ reply: "I couldn't reach the event search right now. Please try again in a moment." }, 502)
    }

    const reply = data.choices?.[0]?.message?.content?.trim()
    return json({ reply: reply || "I couldn't find events for that right now. Try asking another way." })
  } catch (error) {
    console.error("Assistant failure", error)
    return json({ reply: "Something went wrong while searching for events. Please try again." }, 500)
  }
}

export const config = { path: "/api/assistant" }
