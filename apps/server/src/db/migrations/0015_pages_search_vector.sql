ALTER TABLE "pages" ADD COLUMN IF NOT EXISTS "search_vector" tsvector
  GENERATED ALWAYS AS (
    to_tsvector('english', coalesce("title", '') || ' ' || coalesce("plaintext", ''))
  ) STORED;

CREATE INDEX IF NOT EXISTS "pages_search_vector_idx" ON "pages" USING GIN ("search_vector");
