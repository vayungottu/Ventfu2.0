CREATE TABLE "events" (
	"id" text PRIMARY KEY,
	"city" text NOT NULL,
	"title" text NOT NULL,
	"date" text NOT NULL,
	"time" text DEFAULT 'Time TBA' NOT NULL,
	"venue" text DEFAULT 'Venue TBA' NOT NULL,
	"area" text DEFAULT '' NOT NULL,
	"category" text DEFAULT 'Event' NOT NULL,
	"price" text DEFAULT 'Price TBA' NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"image_url" text DEFAULT '' NOT NULL,
	"source_url" text DEFAULT '' NOT NULL,
	"source" text NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "refresh_log" (
	"city" text PRIMARY KEY,
	"started_at" timestamp with time zone NOT NULL,
	"finished_at" timestamp with time zone,
	"summary" text DEFAULT '' NOT NULL
);
--> statement-breakpoint
CREATE INDEX "events_city_date_idx" ON "events" ("city","date");