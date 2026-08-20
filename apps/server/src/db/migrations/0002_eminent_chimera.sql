CREATE TABLE "page_links" (
	"id" text PRIMARY KEY NOT NULL,
	"space_id" text NOT NULL,
	"source_page_id" text NOT NULL,
	"target_page_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "page_links" ADD CONSTRAINT "page_links_space_id_spaces_id_fk" FOREIGN KEY ("space_id") REFERENCES "public"."spaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "page_links" ADD CONSTRAINT "page_links_source_page_id_pages_id_fk" FOREIGN KEY ("source_page_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "page_links" ADD CONSTRAINT "page_links_target_page_id_pages_id_fk" FOREIGN KEY ("target_page_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "page_links_source_target_idx" ON "page_links" USING btree ("source_page_id","target_page_id");--> statement-breakpoint
CREATE INDEX "page_links_target_idx" ON "page_links" USING btree ("target_page_id");