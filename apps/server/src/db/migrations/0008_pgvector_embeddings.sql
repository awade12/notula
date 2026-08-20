CREATE EXTENSION IF NOT EXISTS vector;
--> statement-breakpoint
ALTER TABLE "pages" ADD COLUMN IF NOT EXISTS "embedding" vector(1536);
