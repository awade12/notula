ALTER TABLE "databases" ADD COLUMN "is_public" boolean DEFAULT false NOT NULL;
ALTER TABLE "databases" ADD COLUMN "public_slug" text;
CREATE UNIQUE INDEX "databases_public_slug_idx" ON "databases" ("public_slug") WHERE "public_slug" IS NOT NULL;
