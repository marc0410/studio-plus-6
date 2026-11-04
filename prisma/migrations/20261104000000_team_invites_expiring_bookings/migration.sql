ALTER TABLE "studio_bookings" ADD COLUMN "expires_at" TIMESTAMP(3);
UPDATE "studio_bookings" SET "expires_at" = "created_at" + INTERVAL '48 hours' WHERE "status" = 'REQUESTED' AND "expires_at" IS NULL;
CREATE INDEX "studio_bookings_status_expires_at_idx" ON "studio_bookings"("status", "expires_at");

CREATE TABLE "team_invitations" (
  "id" UUID NOT NULL,
  "user_id" UUID NOT NULL,
  "invited_by" UUID NOT NULL,
  "email" TEXT NOT NULL,
  "full_name" TEXT NOT NULL,
  "role" "Role" NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "token_digest" TEXT NOT NULL,
  "expires_at" TIMESTAMP(3) NOT NULL,
  "accepted_at" TIMESTAMP(3),
  "revoked_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "team_invitations_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "team_invitations_user_id_key" ON "team_invitations"("user_id");
CREATE UNIQUE INDEX "team_invitations_token_digest_key" ON "team_invitations"("token_digest");
CREATE INDEX "team_invitations_status_expires_at_idx" ON "team_invitations"("status", "expires_at");
