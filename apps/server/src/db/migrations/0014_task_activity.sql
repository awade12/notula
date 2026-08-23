CREATE TABLE IF NOT EXISTS "task_activity" (
  "id" text PRIMARY KEY NOT NULL,
  "row_id" text NOT NULL REFERENCES "database_rows"("id") ON DELETE CASCADE,
  "space_id" text NOT NULL REFERENCES "spaces"("id") ON DELETE CASCADE,
  "actor_id" text NOT NULL,
  "actor_name" text NOT NULL,
  "kind" text NOT NULL,
  "body" text NOT NULL,
  "metadata" jsonb,
  "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "task_activity_row_id_idx" ON "task_activity" ("row_id");
CREATE INDEX IF NOT EXISTS "task_activity_space_id_idx" ON "task_activity" ("space_id");
