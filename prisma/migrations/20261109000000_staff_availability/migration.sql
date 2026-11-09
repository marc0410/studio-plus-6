CREATE TABLE "staff_availability_rules" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "staff_id" UUID NOT NULL,
  "weekday" INTEGER NOT NULL,
  "start_time" VARCHAR(5) NOT NULL,
  "end_time" VARCHAR(5) NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "staff_availability_rules_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "staff_availability_rules_weekday_check" CHECK ("weekday" BETWEEN 0 AND 6),
  CONSTRAINT "staff_availability_rules_time_check" CHECK (
    "start_time" ~ '^([01][0-9]|2[0-3]):(00|30)$' AND
    "end_time" ~ '^(([01][0-9]|2[0-3]):(00|30)|24:00)$' AND
    "start_time" < "end_time"
  ),
  CONSTRAINT "staff_availability_rules_staff_id_fkey" FOREIGN KEY ("staff_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "staff_availability_rules_staff_id_weekday_start_time_key" ON "staff_availability_rules"("staff_id", "weekday", "start_time");
ALTER TABLE "staff_availability_rules" ENABLE ROW LEVEL SECURITY;

CREATE TABLE "staff_availability_exceptions" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "staff_id" UUID NOT NULL,
  "date" VARCHAR(10) NOT NULL,
  "is_available" BOOLEAN NOT NULL DEFAULT FALSE,
  "start_time" VARCHAR(5),
  "end_time" VARCHAR(5),
  "note" VARCHAR(240),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "staff_availability_exceptions_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "staff_availability_exceptions_date_check" CHECK ("date" ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$'),
  CONSTRAINT "staff_availability_exceptions_time_check" CHECK (
    (NOT "is_available" AND "start_time" IS NULL AND "end_time" IS NULL) OR
    ("is_available" AND "start_time" ~ '^([01][0-9]|2[0-3]):(00|30)$' AND "end_time" ~ '^(([01][0-9]|2[0-3]):(00|30)|24:00)$' AND "start_time" < "end_time")
  ),
  CONSTRAINT "staff_availability_exceptions_staff_id_fkey" FOREIGN KEY ("staff_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "staff_availability_exceptions_staff_id_date_key" ON "staff_availability_exceptions"("staff_id", "date");
ALTER TABLE "staff_availability_exceptions" ENABLE ROW LEVEL SECURITY;
