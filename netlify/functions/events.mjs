export default async (req) => {
  const apiKey = process.env.GROQ_API_KEY

  if (!apiKey) {
    return json(500, { error: "GROQ_API_KEY is not configured." })
  }

  const url = new URL(req.url)
  const query = (url.searchParams.get("query") || "").slice(0, 200)
  const location = (url.searchParams.get("location") || "Bengaluru, India").slice(0, 120)

  const prompt = `Find real, currently advertised events in or near "${location}".${
    query ? ` Focus on: "${query}".` : " Include a mix of popular upcoming events."
  }

  Use web knowledge and prioritize events with clear public sources. Do not invent ticket links. If you cannot verify an event, omit it.

  For each event, include:
  - A short 1-2 sentence summary describing the event and its venue/place.
  - A sources array containing real, publicly accessible pages that refer to the event, preferably its official website, organizer page, or ticket page.
  - Only include a source URL if you are confident it is real. Never invent URLs.

  Return ONLY valid JSON in this exact shape:
  {
    "events": [
      {
        "title": "string",
        "category": "string",
        "date": "YYYY-MM-DD",
        "time": "HH:MM",
        "endTime": "HH:MM",
        "venue": "string",
        "area": "string",
        "price": "string",
        "description": "string",
        "summary": "1-2 sentence summary of the event and place",
        "sourceUrl": "string or empty",
        "sources": [
          { "title": "string", "url": "string" }
        ],
        "imageQuery": "short image search phrase"
      }
    ]
  }

  Return between 6 and 12 events.`

  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "openai/gpt-oss-120b",
        messages: [
          {
            role: "system",
            content:
              "You are an event research assistant. Return only valid JSON. Never include markdown, explanations, or invented URLs. Omit events and sources you cannot verify.",
          },
          { role: "user", content: prompt },
        ],
        temperature: 0.3,
        max_completion_tokens: 3500,
        response_format: { type: "json_object" },
      }),
    })

    if (!response.ok) {
      const detail = await response.text()
      return json(response.status, { error: "Groq request failed", detail })
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content || "{}"
    const parsed = JSON.parse(content)

    return json(200, {
      location,
      query,
      events: Array.isArray(parsed.events) ? parsed.events : [],
      discoveredWith: "groq",
    })
  } catch (error) {
    return json(500, { error: "Could not load events", detail: String(error) })
  }
}

function json(status, body) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
    },
  })
}
