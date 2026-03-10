ALTER TABLE "AppointmentSegment"
ADD COLUMN "resourceUnit" INTEGER;

UPDATE "AppointmentSegment"
SET "resourceUnit" = 1
WHERE "resourceId" IS NOT NULL;

DROP INDEX "AppointmentSegment_resourceId_startsAt_key";

CREATE UNIQUE INDEX "AppointmentSegment_resourceId_startsAt_resourceUnit_key"
ON "AppointmentSegment"("resourceId", "startsAt", "resourceUnit");

ALTER TABLE "AppointmentSegment"
ADD CONSTRAINT "AppointmentSegment_resource_unit_consistency_check"
CHECK (
  ("resourceId" IS NULL AND "resourceUnit" IS NULL)
  OR ("resourceId" IS NOT NULL AND "resourceUnit" IS NOT NULL AND "resourceUnit" >= 1)
);
