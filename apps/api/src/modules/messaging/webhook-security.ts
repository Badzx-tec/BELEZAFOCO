import { createHmac, timingSafeEqual } from "node:crypto";

function normalizeSignatureHeader(signatureHeader?: string | string[]) {
  if (typeof signatureHeader !== "string") {
    return null;
  }

  const normalized = signatureHeader.trim().toLowerCase();
  if (!normalized.startsWith("sha256=")) {
    return null;
  }

  return normalized.slice("sha256=".length);
}

export function verifyWhatsAppWebhookSignature(input: {
  appSecret?: string;
  rawBody: string;
  signatureHeader?: string | string[];
}) {
  if (!input.appSecret) {
    return true;
  }

  const expected = createHmac("sha256", input.appSecret).update(input.rawBody).digest("hex");
  const provided = normalizeSignatureHeader(input.signatureHeader);

  if (!provided || provided.length !== expected.length) {
    return false;
  }

  return timingSafeEqual(Buffer.from(expected, "utf8"), Buffer.from(provided, "utf8"));
}
