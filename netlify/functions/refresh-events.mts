import type { Config } from "@netlify/functions"
import { refreshHyderabad } from "../lib/refresh.js"

// Background function (up to 15 min): researches Hyderabad events via Ticketmaster + Groq and stores them.
export default async () => {
  await refreshHyderabad()
}

export const config: Config = { background: true }
