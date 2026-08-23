CREATE TABLE IF NOT EXISTS "ai_threads" (
  "id" text PRIMARY KEY NOT NULL,
  "space_id" text NOT NULL,
  "user_id" text NOT NULL,
  "scope_type" text NOT NULL,
  "scope_id" text NOT NULL,
  "title" text NOT NULL,
  "messages" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

ALTER TABLE "ai_threads" ADD CONSTRAINT "ai_threads_space_id_spaces_id_fk"
  FOREIGN KEY ("space_id") REFERENCES "public"."spaces"("id") ON DELETE cascade ON UPDATE no action;

ALTER TABLE "ai_threads" ADD CONSTRAINT "ai_threads_user_id_user_id_fk"
  FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;

CREATE INDEX IF NOT EXISTS "ai_threads_user_scope_idx"
  ON "ai_threads" ("user_id", "space_id", "scope_type", "scope_id");
