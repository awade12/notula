CREATE TABLE "user_settings" (
	"user_id" text PRIMARY KEY NOT NULL,
	"ai_default_model" text DEFAULT 'openai/gpt-4o-mini' NOT NULL,
	"ai_enable_embeddings" boolean DEFAULT false NOT NULL,
	"openrouter_api_key_encrypted" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "user_settings" ADD CONSTRAINT "user_settings_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
