ALTER TYPE "BookingStatus" ADD VALUE IF NOT EXISTS 'IN_PROGRESS';
ALTER TYPE "BookingStatus" ADD VALUE IF NOT EXISTS 'NO_SHOW';

ALTER TABLE "guest_invitations"
  ADD COLUMN "bio" TEXT,
  ADD COLUMN "photo_path" TEXT,
  ADD COLUMN "social_links" JSONB,
  ADD COLUMN "rundown" TEXT,
  ADD COLUMN "image_consent" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "image_consent_at" TIMESTAMP(3),
  ADD COLUMN "image_consent_revoked_at" TIMESTAMP(3),
  ADD COLUMN "proposed_date" VARCHAR(10),
  ADD COLUMN "proposed_time" VARCHAR(5);

CREATE TABLE "booking_schedule_changes" (
  "id" UUID NOT NULL,
  "booking_id" UUID NOT NULL,
  "requested_by" UUID NOT NULL,
  "old_date" VARCHAR(10) NOT NULL,
  "old_time" VARCHAR(5) NOT NULL,
  "new_date" VARCHAR(10) NOT NULL,
  "new_time" VARCHAR(5) NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "decided_by" UUID,
  "decided_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "booking_schedule_changes_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "booking_schedule_changes_booking_id_status_idx" ON "booking_schedule_changes"("booking_id", "status");
ALTER TABLE "booking_schedule_changes" ADD CONSTRAINT "booking_schedule_changes_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "studio_bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "studio_projects" (
  "id" UUID NOT NULL,
  "booking_id" UUID NOT NULL,
  "title" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'ACTIVE',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "studio_projects_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "studio_projects_booking_id_key" ON "studio_projects"("booking_id");
ALTER TABLE "studio_projects" ADD CONSTRAINT "studio_projects_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "studio_bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "project_tasks" (
  "id" UUID NOT NULL,
  "project_id" UUID NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT NOT NULL DEFAULT '',
  "status" TEXT NOT NULL DEFAULT 'TODO',
  "sort_order" INTEGER NOT NULL DEFAULT 0,
  "due_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "project_tasks_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "project_tasks_project_id_sort_order_idx" ON "project_tasks"("project_id", "sort_order");
ALTER TABLE "project_tasks" ADD CONSTRAINT "project_tasks_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "studio_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "project_notes" (
  "id" UUID NOT NULL,
  "project_id" UUID NOT NULL,
  "author_id" UUID NOT NULL,
  "content" TEXT NOT NULL,
  "internal" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "project_notes_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "project_notes_project_id_created_at_idx" ON "project_notes"("project_id", "created_at");
ALTER TABLE "project_notes" ADD CONSTRAINT "project_notes_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "studio_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "project_deliverables" (
  "id" UUID NOT NULL,
  "project_id" UUID NOT NULL,
  "name" TEXT NOT NULL,
  "object_path" TEXT NOT NULL,
  "content_type" TEXT NOT NULL,
  "size_bytes" INTEGER NOT NULL,
  "visible_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "project_deliverables_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "project_deliverables_object_path_key" ON "project_deliverables"("object_path");
CREATE INDEX "project_deliverables_project_id_visible_at_idx" ON "project_deliverables"("project_id", "visible_at");
ALTER TABLE "project_deliverables" ADD CONSTRAINT "project_deliverables_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "studio_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "studio_invoices" (
  "id" UUID NOT NULL,
  "booking_id" UUID NOT NULL,
  "invoice_number" TEXT NOT NULL,
  "service_name" TEXT NOT NULL,
  "client_name" TEXT NOT NULL,
  "amount" INTEGER NOT NULL,
  "amount_paid" INTEGER NOT NULL,
  "issued_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "status" TEXT NOT NULL DEFAULT 'READY_TO_EMAIL',
  "recipient" TEXT NOT NULL,
  "emailed_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "studio_invoices_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "studio_invoices_booking_id_key" ON "studio_invoices"("booking_id");
CREATE UNIQUE INDEX "studio_invoices_invoice_number_key" ON "studio_invoices"("invoice_number");
ALTER TABLE "studio_invoices" ADD CONSTRAINT "studio_invoices_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "studio_bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
