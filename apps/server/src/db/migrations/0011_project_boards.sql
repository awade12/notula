ALTER TABLE "databases" ADD COLUMN "is_project_board" boolean DEFAULT false NOT NULL;

CREATE INDEX "databases_space_project_board_idx" ON "databases" ("space_id", "is_project_board");
