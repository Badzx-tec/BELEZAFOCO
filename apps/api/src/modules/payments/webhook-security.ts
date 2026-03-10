import { createHmac, timingSafeEqual } from "node:crypto";

const MERCADO_PAGO_WEBHOOK_TOLERANCE_MS = 5 * 60 * 1000;

function getSingleHeaderValue(value: string | string[] | undefined) {
  if (typeof value === "string") return value.trim();
  if (Array.isArray(value)) return value[0]?.trim();
  return undefined;
}

function secureCompare(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  if (leftBuffer.length !== rightBuffer.length) return false;

  return timingSafeEqual(leftBuffer, rightBuffer);
}

export function verifySharedWebhookSecret(input: {
  expectedSecret?: string;
  providedSecret?: string | string[];
}) {
  if (!input.expectedSecret) return true;

  const providedSecret = getSingleHeaderValue(input.providedSecret);
  if (!providedSecret) return false;

  return secureCompare(providedSecret, input.expectedSecret);
}

export function parseMercadoPagoSignatureHeader(signatureHeader?: string | string[]) {
  const rawHeader = getSingleHeaderValue(signatureHeader);
  if (!rawHeader) return null;

  const pairs = rawHeader
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean)
    .reduce<Record<string, string>>((acc, part) => {
      const separatorIndex = part.indexOf("=");
      if (separatorIndex === -1) return acc;

      const key = part.slice(0, separatorIndex).trim();
      const value = part.slice(separatorIndex + 1).trim();
      if (key && value) acc[key] = value;
      return acc;
    }, {});

  if (!pairs.ts || !pairs.v1) return null;

  return {
    timestamp: pairs.ts,
    signature: pairs.v1.toLowerCase()
  };
}

export function verifyMercadoPagoWebhookSignature(input: {
  secret?: string;
  signatureHeader?: string | string[];
  requestIdHeader?: string | string[];
  dataId?: string;
  now?: Date;
}) {
  if (!input.secret) return true;

  const parsedSignature = parseMercadoPagoSignatureHeader(input.signatureHeader);
  if (!parsedSignature) return false;

  const requestId = getSingleHeaderValue(input.requestIdHeader);
  const dataId = input.dataId?.trim().toLowerCase();
  if (!requestId || !dataId) return false;

  const timestampMs = Number(parsedSignature.timestamp) * 1000;
  if (!Number.isFinite(timestampMs)) return false;

  const now = input.now ?? new Date();
  if (Math.abs(now.getTime() - timestampMs) > MERCADO_PAGO_WEBHOOK_TOLERANCE_MS) {
    return false;
  }

  const manifest = `id:${dataId};request-id:${requestId};ts:${parsedSignature.timestamp};`;
  const expectedSignature = createHmac("sha256", input.secret).update(manifest).digest("hex");

  return secureCompare(parsedSignature.signature, expectedSignature);
}
