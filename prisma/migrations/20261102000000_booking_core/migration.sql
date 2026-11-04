CREATE TYPE "Role" AS ENUM ('ADMIN', 'MANAGER', 'STAFF', 'CLIENT');
CREATE TYPE "BookingStatus" AS ENUM ('REQUESTED', 'CONFIRMED', 'CANCELLED', 'COMPLETED');
CREATE TYPE "PaymentMethod" AS ENUM ('CASH', 'WAVE', 'ORANGE_MONEY', 'MTN_MOMO', 'BANK_TRANSFER', 'OTHER');
CREATE TYPE "InvitationStatus" AS ENUM ('INVITED', 'ACCEPTED', 'DECLINED');

CREATE TABLE "profiles" (
  "id" UUID NOT NULL,
  "email" TEXT NOT NULL,
  "full_name" TEXT NOT NULL,
  "phone" TEXT,
  "role" "Role" NOT NULL DEFAULT 'CLIENT',
  "is_active" BOOLEAN NOT NULL DEFAULT TRUE,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "profiles_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "profiles_email_key" ON "profiles"("email");
ALTER TABLE "profiles" ENABLE ROW LEVEL SECURITY;

CREATE TABLE "studio_services" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "duration" INTEGER NOT NULL,
  "price" INTEGER,
  "image" TEXT NOT NULL,
  "active" BOOLEAN NOT NULL DEFAULT TRUE,
  "sort_order" INTEGER NOT NULL DEFAULT 0,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "studio_services_pkey" PRIMARY KEY ("id")
);
ALTER TABLE "studio_services" ENABLE ROW LEVEL SECURITY;

CREATE TABLE "studio_bookings" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "owner_id" UUID NOT NULL,
  "service_id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "date" VARCHAR(10) NOT NULL,
  "time" VARCHAR(5) NOT NULL,
  "duration" INTEGER NOT NULL,
  "amount" INTEGER,
  "status" "BookingStatus" NOT NULL DEFAULT 'REQUESTED',
  "name" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "phone" TEXT NOT NULL,
  "notes" TEXT NOT NULL DEFAULT '',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "studio_bookings_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "studio_bookings_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "studio_bookings_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "studio_services"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE INDEX "studio_bookings_owner_id_date_time_idx" ON "studio_bookings"("owner_id", "date", "time");
CREATE INDEX "studio_bookings_status_date_idx" ON "studio_bookings"("status", "date");
ALTER TABLE "studio_bookings" ENABLE ROW LEVEL SECURITY;

CREATE TABLE "studio_slots" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "booking_id" UUID NOT NULL,
  "date" VARCHAR(10) NOT NULL,
  "time" VARCHAR(5) NOT NULL,
  CONSTRAINT "studio_slots_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "studio_slots_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "studio_bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "studio_slots_date_time_key" ON "studio_slots"("date", "time");
CREATE INDEX "studio_slots_booking_id_idx" ON "studio_slots"("booking_id");
ALTER TABLE "studio_slots" ENABLE ROW LEVEL SECURITY;

CREATE TABLE "studio_participants" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "booking_id" UUID NOT NULL,
  "name" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "role" TEXT NOT NULL DEFAULT 'Invité',
  CONSTRAINT "studio_participants_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "studio_participants_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "studio_bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "studio_participants_booking_id_email_key" ON "studio_participants"("booking_id", "email");
CREATE INDEX "studio_participants_email_idx" ON "studio_participants"("email");
ALTER TABLE "studio_participants" ENABLE ROW LEVEL SECURITY;

CREATE TABLE "guest_invitations" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "booking_id" UUID NOT NULL,
  "name" TEXT NOT NULL,
  "email" TEXT,
  "phone" TEXT,
  "token_hash" TEXT NOT NULL,
  "status" "InvitationStatus" NOT NULL DEFAULT 'INVITED',
  "note" TEXT,
  "expires_at" TIMESTAMP(3) NOT NULL,
  "responded_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "guest_invitations_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "guest_invitations_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "studio_bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "guest_invitations_token_hash_key" ON "guest_invitations"("token_hash");
CREATE INDEX "guest_invitations_booking_id_status_idx" ON "guest_invitations"("booking_id", "status");
ALTER TABLE "guest_invitations" ENABLE ROW LEVEL SECURITY;

CREATE TABLE "booking_payments" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "booking_id" UUID NOT NULL,
  "amount" INTEGER NOT NULL,
  "method" "PaymentMethod" NOT NULL,
  "reference" TEXT,
  "recorded_by" UUID NOT NULL,
  "paid_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "booking_payments_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "booking_payments_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "studio_bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "booking_payments_recorded_by_fkey" FOREIGN KEY ("recorded_by") REFERENCES "profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE INDEX "booking_payments_booking_id_paid_at_idx" ON "booking_payments"("booking_id", "paid_at");
ALTER TABLE "booking_payments" ENABLE ROW LEVEL SECURITY;

CREATE TABLE "booking_staff" (
  "booking_id" UUID NOT NULL,
  "staff_id" UUID NOT NULL,
  CONSTRAINT "booking_staff_pkey" PRIMARY KEY ("booking_id", "staff_id"),
  CONSTRAINT "booking_staff_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "studio_bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "booking_staff_staff_id_fkey" FOREIGN KEY ("staff_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
ALTER TABLE "booking_staff" ENABLE ROW LEVEL SECURITY;

CREATE TABLE "studio_settings" (
  "key" TEXT NOT NULL,
  "value" JSONB NOT NULL,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "studio_settings_pkey" PRIMARY KEY ("key")
);
ALTER TABLE "studio_settings" ENABLE ROW LEVEL SECURITY;

CREATE TABLE "email_deliveries" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "event" TEXT NOT NULL,
  "recipient" TEXT NOT NULL,
  "provider_id" TEXT,
  "status" TEXT NOT NULL DEFAULT 'QUEUED',
  "error" TEXT,
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "sent_at" TIMESTAMP(3),
  CONSTRAINT "email_deliveries_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "email_deliveries_status_created_at_idx" ON "email_deliveries"("status", "created_at");
ALTER TABLE "email_deliveries" ENABLE ROW LEVEL SECURITY;
