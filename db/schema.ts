import { pgTable, text, timestamp, index } from "drizzle-orm/pg-core"

export const events = pgTable(
  "events",
  {
    id: text().primaryKey(),
    city: text().notNull(),
    title: text().notNull(),
    date: text().notNull(),
    time: text().notNull().default("Time TBA"),
    venue: text().notNull().default("Venue TBA"),
    area: text().notNull().default(""),
    category: text().notNull().default("Event"),
    price: text().notNull().default("Price TBA"),
    description: text().notNull().default(""),
    imageUrl: text("image_url").notNull().default(""),
    sourceUrl: text("source_url").notNull().default(""),
    source: text().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("events_city_date_idx").on(table.city, table.date)],
)

export const refreshLog = pgTable("refresh_log", {
  city: text().primaryKey(),
  startedAt: timestamp("started_at", { withTimezone: true }).notNull(),
  finishedAt: timestamp("finished_at", { withTimezone: true }),
  summary: text().notNull().default(""),
})
