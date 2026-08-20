CREATE TABLE "page_insights" (
	"id" text PRIMARY KEY NOT NULL,
	"space_id" text NOT NULL,
	"page_id" text NOT NULL,
	"kind" text NOT NULL,
	"content" text DEFAULT '' NOT NULL,
	"status" text NOT NULL,
	"owner" text DEFAULT '' NOT NULL,
	"source" text DEFAULT '' NOT NULL,
	"supersedes" text DEFAULT '' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "page_insights" ADD CONSTRAINT "page_insights_space_id_spaces_id_fk" FOREIGN KEY ("space_id") REFERENCES "public"."spaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "page_insights" ADD CONSTRAINT "page_insights_page_id_pages_id_fk" FOREIGN KEY ("page_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "page_insights_space_kind_status_idx" ON "page_insights" USING btree ("space_id","kind","status");--> statement-breakpoint
CREATE INDEX "page_insights_page_idx" ON "page_insights" USING btree ("page_id");--> statement-breakpoint
CREATE INDEX "page_insights_updated_idx" ON "page_insights" USING btree ("updated_at");