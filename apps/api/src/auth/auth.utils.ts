import type { CookieOptions, Request, Response } from "express";
import {
  AUTH_ACCESS_COOKIE,
  AUTH_CSRF_COOKIE,
  AUTH_REFRESH_COOKIE
} from "./auth.constants";
import type { RequestMetadata } from "./auth.types";

export interface AuthCookieBundle {
  accessToken: string;
  refreshToken: string;
  csrfToken: string;
  accessMaxAgeMs: number;
  refreshMaxAgeMs: number;
  secure: boolean;
}

interface CookieInstruction {
  clear?: boolean;
  name: string;
  options: CookieOptions;
  value?: string;
}

export function applyAuthCookies(response: Response, bundle: AuthCookieBundle) {
  for (const instruction of buildCookieInstructions(bundle)) {
    if (instruction.clear) {
      response.clearCookie(instruction.name, instruction.options);
      continue;
    }

    response.cookie(instruction.name, instruction.value ?? "", instruction.options);
  }
}

export function clearAuthCookies(response: Response, secure: boolean) {
  for (const instruction of buildClearCookieInstructions(secure)) {
    response.clearCookie(instruction.name, instruction.options);
  }
}

export function buildClearCookieInstructions(secure: boolean): CookieInstruction[] {
  return [AUTH_ACCESS_COOKIE, AUTH_REFRESH_COOKIE, AUTH_CSRF_COOKIE].map((name) => ({
    clear: true,
    name,
    options: buildCookieOptions(secure, 0, name !== AUTH_CSRF_COOKIE)
  }));
}

export function extractRequestMetadata(request: Request): RequestMetadata {
  const forwardedFor = request.headers["x-forwarded-for"];
  const firstForwardedIp = Array.isArray(forwardedFor)
    ? forwardedFor[0]
    : forwardedFor?.split(",")[0];

  return {
    ipAddress: firstForwardedIp?.trim() ?? request.ip ?? null,
    userAgent: request.get("user-agent") ?? null
  };
}

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export function parseDurationToMs(input: string) {
  const match = input.trim().match(/^(\d+)(ms|s|m|h|d)$/i);
  if (!match) {
    throw new Error(`Unsupported duration format: ${input}`);
  }

  const amount = Number(match[1]);
  const unit = match[2].toLowerCase();

  switch (unit) {
    case "ms":
      return amount;
    case "s":
      return amount * 1000;
    case "m":
      return amount * 60 * 1000;
    case "h":
      return amount * 60 * 60 * 1000;
    case "d":
      return amount * 24 * 60 * 60 * 1000;
    default:
      throw new Error(`Unsupported duration unit: ${unit}`);
  }
}

export function readCookieFromRequest(request: Request, name: string) {
  const cookieValue = request.cookies?.[name];
  if (typeof cookieValue === "string" && cookieValue.length > 0) {
    return cookieValue;
  }

  const headerValue = request.headers.cookie;
  if (!headerValue) {
    return null;
  }

  for (const chunk of headerValue.split(";")) {
    const trimmed = chunk.trim();
    if (!trimmed.startsWith(`${name}=`)) {
      continue;
    }

    return decodeURIComponent(trimmed.slice(name.length + 1));
  }

  return null;
}

export function slugify(input: string) {
  const ascii = input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

  return (
    ascii
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .replace(/-{2,}/g, "-") || "workspace"
  );
}

function buildCookieInstructions(bundle: AuthCookieBundle): CookieInstruction[] {
  return [
    {
      name: AUTH_ACCESS_COOKIE,
      value: bundle.accessToken,
      options: buildCookieOptions(bundle.secure, bundle.accessMaxAgeMs, true)
    },
    {
      name: AUTH_REFRESH_COOKIE,
      value: bundle.refreshToken,
      options: buildCookieOptions(bundle.secure, bundle.refreshMaxAgeMs, true)
    },
    {
      name: AUTH_CSRF_COOKIE,
      value: bundle.csrfToken,
      options: buildCookieOptions(bundle.secure, bundle.accessMaxAgeMs, false)
    }
  ];
}

function buildCookieOptions(secure: boolean, maxAge: number, httpOnly: boolean): CookieOptions {
  return {
    httpOnly,
    sameSite: "lax",
    secure,
    path: "/",
    maxAge
  };
}
