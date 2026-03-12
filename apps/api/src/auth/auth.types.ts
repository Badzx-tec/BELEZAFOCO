import type { Request } from "express";

export interface SessionTokenPayload {
  sub: string;
  sid: string;
  jti: string;
  wid?: string;
  type: "access" | "refresh";
  iat?: number;
  exp?: number;
}

export interface ActionTokenPayload {
  sub: string;
  email: string;
  passwordVersion: number;
  type: "email-verification" | "password-reset";
  iat?: number;
  exp?: number;
}

export interface RequestMetadata {
  ipAddress: string | null;
  userAgent: string | null;
}

export interface AuthContext {
  sessionId: string;
  userId: string;
  workspaceId: string | null;
  roleCode: string | null;
}

export interface AuthenticatedRequest extends Request {
  auth?: AuthContext;
}
