import type { Config } from "@netlify/functions"

// Every day at 06:00 IST (00:30 UTC) kick off the background refresh so "today" stays accurate.
export default async () => {
  const base = process.env.URL || process.env.DEPLOY_PRIME_URL
  if (!base) return
  await fetch(`${base}/.netlify/functions/refresh-events`, { method: "POST" })
}

export const config: Config = { schedule: "30 0 * * *" }
