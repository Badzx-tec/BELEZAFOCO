ALTER TABLE "IdempotencyKey" ADD COLUMN "namespaceKey" TEXT;

UPDATE "IdempotencyKey"
SET "namespaceKey" = CONCAT("scope", ':', COALESCE("workspaceId", 'global'), ':', "key")
WHERE "namespaceKey" IS NULL;

ALTER TABLE "IdempotencyKey" ALTER COLUMN "namespaceKey" SET NOT NULL;

DROP INDEX "IdempotencyKey_key_key";

CREATE UNIQUE INDEX "IdempotencyKey_namespaceKey_key" ON "IdempotencyKey"("namespaceKey");
CREATE INDEX "IdempotencyKey_scope_key_idx" ON "IdempotencyKey"("scope", "key");
