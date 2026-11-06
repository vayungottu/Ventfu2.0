export default async function handler(request) {
  if (request.httpMethod !== 'POST') return { statusCode: 405, body: 'Use POST' }
  const { location, message } = JSON.parse(request.body || '{}')
  if (!process.env.GROQ_API_KEY) return { statusCode: 500, body: 'GROQ_API_KEY missing' }
  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.GROQ_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'openai/gpt-oss-120b',
      tools: [{ type: 'browser_search' }],
      messages: [
        { role: 'system', content: 'You are Venty, an event discovery assistant. Use browser_search to find real upcoming public events in the user’s location. Recommend specific events with date, time, venue, price if available, and the event’s own ticket or detail URL. Never invent events or links. Keep answers short and mobile-friendly. Exclude adult or explicit events.' },
        { role: 'user', content: `Location: ${location || 'not provided'}\nQuestion: ${message || 'What events are coming up?'}` },
      ],
    }),
  })
  const data = await response.json()
  return { statusCode: 200, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }, body: JSON.stringify({ reply: data.choices?.[0]?.message?.content || 'I could not find events right now.' }) }
}
