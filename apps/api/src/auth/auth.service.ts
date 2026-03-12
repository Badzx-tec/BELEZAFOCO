import { JwtService } from "@nestjs/jwt";
import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import {
  MembershipStatus,
  Prisma,
  SessionKind,
  UserStatus
} from "@prisma/client";
import { compare, hash } from "bcryptjs";
import { createHash, randomUUID } from "crypto";
import { OAuth2Client } from "google-auth-library";
import type { Request } from "express";
import { MailService } from "../mail/mail.service";
import { PrismaService } from "../database/prisma.service";
import {
  AUTH_ACCESS_COOKIE,
  AUTH_ACTION_EMAIL_VERIFICATION,
  AUTH_ACTION_PASSWORD_RESET,
  AUTH_GOOGLE_CSRF_COOKIE,
  AUTH_REFRESH_COOKIE
} from "./auth.constants";
import {
  normalizeEmail,
  parseDurationToMs,
  readCookieFromRequest,
  slugify,
  type AuthCookieBundle
} from "./auth.utils";
import type {
  ActionTokenPayload,
  AuthContext,
  RequestMetadata,
  SessionTokenPayload
} from "./auth.types";
import {
  EmailOnlyDto,
  GoogleLoginDto,
  LoginDto,
  RegisterDto,
  ResetPasswordDto,
  VerifyEmailDto
} from "./dto/auth.dto";

const membershipSelect = {
  id: true,
  status: true,
  joinedAt: true,
  role: {
    select: {
      code: true,
      name: true
    }
  },
  workspace: {
    select: {
      id: true,
      name: true,
      slug: true,
      timezone: true,
      status: true,
      businessProfile: {
        select: {
          tradeName: true,
          niche: true,
          primaryColor: true,
          accentColor: true
        }
      }
    }
  }
} satisfies Prisma.MembershipSelect;

const authUserSelect = {
  id: true,
  email: true,
  fullName: true,
  avatarUrl: true,
  status: true,
  emailVerifiedAt: true,
  passwordCredential: {
    select: {
      passwordHash: true,
      passwordVersion: true
    }
  },
  memberships: {
    where: {
      status: MembershipStatus.active
    },
    orderBy: {
      createdAt: "asc"
    },
    select: membershipSelect
  }
} satisfies Prisma.UserSelect;

type AuthUserRecord = Prisma.UserGetPayload<{ select: typeof authUserSelect }>;

interface GoogleIdentity {
  avatarUrl: string | null;
  email: string;
  fullName: string;
  sub: string;
}

interface OwnerProvisionInput {
  avatarUrl?: string | null;
  businessName: string;
  email: string;
  emailVerifiedAt?: Date | null;
  fullName: string;
  googleSub?: string;
  metadata: RequestMetadata;
  phone?: string;
}

interface SessionRecord {
  id: string;
  userId: string;
  workspaceId: string | null;
  kind: SessionKind;
  accessTokenId: string;
  refreshTokenId: string;
  csrfSecret: string;
  expiresAt: Date;
  revokedAt: Date | null;
}

export interface WorkspaceSummary {
  branding: {
    accentColor: string | null;
    niche: string | null;
    primaryColor: string | null;
    tradeName: string | null;
  };
  id: string;
  name: string;
  role: {
    code: string;
    name: string;
  };
  slug: string;
  status: string;
  timezone: string;
}

export interface AuthSessionResponse {
  authenticated: boolean;
  csrfToken: string | null;
  session: {
    expiresAt: string;
    id: string;
    kind: SessionKind;
  } | null;
  user: {
    avatarUrl: string | null;
    email: string;
    emailVerified: boolean;
    fullName: string;
    id: string;
    status: UserStatus;
  } | null;
  workspace: WorkspaceSummary | null;
  workspaces: WorkspaceSummary[];
}

interface SessionCookiesResult {
  cookies: AuthCookieBundle;
  response: AuthSessionResponse;
}

interface TokenDispatchResult {
  deliveryMode: "preview" | "smtp";
  previewToken?: string;
  previewUrl?: string;
}

@Injectable()
export class AuthService {
  private readonly googleClient = new OAuth2Client();

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly mailService: MailService
  ) {}

  async register(
    body: RegisterDto,
    metadata: RequestMetadata
  ): Promise<
    SessionCookiesResult & {
      verificationDeliveryMode?: "preview" | "smtp";
      verificationTokenPreview?: string;
      verificationUrlPreview?: string;
    }
  > {
    const email = normalizeEmail(body.email);

    if (await this.prisma.user.findUnique({ where: { email }, select: { id: true } })) {
      throw new ConflictException("Email already registered");
    }

    const passwordHash = await hash(body.password, 12);
    const businessName = body.businessName.trim();
    const fullName = body.fullName.trim();

    if (!businessName || !fullName) {
      throw new BadRequestException("Business name and full name are required");
    }

    const { userId, workspaceId } = await this.provisionOwnerWorkspace(
      {
        businessName,
        email,
        fullName,
        metadata,
        phone: body.phone?.trim(),
        emailVerifiedAt: null
      },
      passwordHash
    );

    const user = await this.loadUserById(userId);
    const result = await this.createSessionResponse(user, workspaceId, metadata);
    const verificationDispatch = await this.dispatchEmailVerification(user);

    return {
      ...result,
      verificationDeliveryMode: verificationDispatch.deliveryMode,
      verificationTokenPreview: verificationDispatch.previewToken,
      verificationUrlPreview: verificationDispatch.previewUrl
    };
  }

  async login(body: LoginDto, metadata: RequestMetadata): Promise<SessionCookiesResult> {
    const user = await this.loadUserByEmail(normalizeEmail(body.email));

    if (!user?.passwordCredential) {
      throw new UnauthorizedException("Invalid email or password");
    }

    if (user.status === UserStatus.blocked) {
      throw new UnauthorizedException("User is blocked");
    }

    const passwordMatches = await compare(body.password, user.passwordCredential.passwordHash);
    if (!passwordMatches) {
      throw new UnauthorizedException("Invalid email or password");
    }

    const workspaceId = this.getPreferredWorkspaceId(user);
    const result = await this.createSessionResponse(user, workspaceId, metadata);

    await this.safeAuditLog(this.prisma, {
      action: "auth.login",
      actorUserId: user.id,
      entityId: user.id,
      entityType: "user",
      ipAddress: metadata.ipAddress,
      metadata: {
        workspaceId
      },
      userAgent: metadata.userAgent,
      workspaceId
    });

    return result;
  }

  async google(
    body: GoogleLoginDto,
    request: Request,
    metadata: RequestMetadata
  ): Promise<SessionCookiesResult> {
    const googleIdentity = await this.verifyGoogleIdentity(body, request);
    const existingUser = await this.loadUserByEmail(googleIdentity.email);

    if (!existingUser && body.intent !== "register") {
      throw new UnauthorizedException("Google account is not linked yet");
    }

    let userId: string;
    let workspaceId: string | null;

    if (!existingUser) {
      const provisioned = await this.provisionOwnerWorkspace(
        {
          avatarUrl: googleIdentity.avatarUrl,
          businessName:
            body.businessName?.trim() ||
            this.deriveBusinessName(googleIdentity.fullName, googleIdentity.email),
          email: googleIdentity.email,
          emailVerifiedAt: new Date(),
          fullName: body.fullName?.trim() || googleIdentity.fullName,
          googleSub: googleIdentity.sub,
          metadata,
          phone: body.phone?.trim()
        },
        null
      );

      userId = provisioned.userId;
      workspaceId = provisioned.workspaceId;
    } else {
      if (existingUser.status === UserStatus.blocked) {
        throw new UnauthorizedException("User is blocked");
      }

      workspaceId = this.getPreferredWorkspaceId(existingUser);

      await this.prisma.$transaction(async (tx) => {
        await this.linkGoogleIdentity(tx, {
          avatarUrl: googleIdentity.avatarUrl,
          email: googleIdentity.email,
          googleSub: googleIdentity.sub,
          userId: existingUser.id
        });

        await tx.user.update({
          where: { id: existingUser.id },
          data: {
            avatarUrl: googleIdentity.avatarUrl ?? existingUser.avatarUrl ?? undefined,
            emailVerifiedAt: existingUser.emailVerifiedAt ?? new Date(),
            fullName:
              body.fullName?.trim() || existingUser.fullName || googleIdentity.fullName,
            status: "active"
          }
        });

        await this.safeAuditLog(tx, {
          action: "auth.google_login",
          actorUserId: existingUser.id,
          entityId: existingUser.id,
          entityType: "user",
          ipAddress: metadata.ipAddress,
          metadata: {
            workspaceId
          },
          userAgent: metadata.userAgent,
          workspaceId
        });
      });

      userId = existingUser.id;
    }

    const user = await this.loadUserById(userId);
    return this.createSessionResponse(
      user,
      workspaceId ?? this.getPreferredWorkspaceId(user),
      metadata
    );
  }

  async refresh(request: Request, metadata: RequestMetadata): Promise<SessionCookiesResult> {
    const refreshToken = readCookieFromRequest(request, AUTH_REFRESH_COOKIE);
    if (!refreshToken) {
      throw new UnauthorizedException("Refresh token missing");
    }

    const payload = await this.verifySessionToken(refreshToken, "refresh");
    const session = await this.prisma.session.findUnique({
      where: { id: payload.sid }
    });

    this.assertSessionIsActive(session, payload, "refresh");

    const updatedSession = await this.prisma.session.update({
      where: { id: session.id },
      data: {
        accessTokenId: randomUUID(),
        refreshTokenId: randomUUID(),
        csrfSecret: randomUUID(),
        expiresAt: new Date(Date.now() + this.getRefreshTtlMs()),
        ipAddress: metadata.ipAddress,
        userAgent: metadata.userAgent,
        revokedAt: null
      }
    });

    const user = await this.loadUserById(updatedSession.userId);
    return this.buildSessionCookiesResult(user, updatedSession, updatedSession.csrfSecret);
  }

  async logout(request: Request) {
    const refreshToken = readCookieFromRequest(request, AUTH_REFRESH_COOKIE);
    if (refreshToken) {
      try {
        const payload = await this.verifySessionToken(refreshToken, "refresh", true);
        await this.prisma.session.updateMany({
          where: {
            id: payload.sid,
            refreshTokenId: payload.jti
          },
          data: {
            revokedAt: new Date()
          }
        });
      } catch {
        // Ignore invalid tokens and still clear client cookies.
      }
    }

    return {
      secureCookies: this.useSecureCookies()
    };
  }

  async requestPasswordReset(body: EmailOnlyDto) {
    const user = await this.loadUserByEmail(normalizeEmail(body.email));
    if (!user?.passwordCredential) {
      return {
        status: "accepted"
      };
    }

    const previewToken = await this.createActionToken(user, AUTH_ACTION_PASSWORD_RESET, "30m");
    const previewUrl = this.buildAppUrl("/redefinir-senha", { token: previewToken });
    const delivery = await this.mailService.sendPasswordReset({
      email: user.email,
      fullName: user.fullName,
      resetUrl: previewUrl
    });

    await this.safeAuditLog(this.prisma, {
      action: "auth.password_reset_requested",
      actorUserId: user.id,
      entityId: user.id,
      entityType: "user",
      ipAddress: null,
      metadata: {
        email: user.email
      },
      userAgent: null,
      workspaceId: this.getPreferredWorkspaceId(user)
    });

    return {
      status: "accepted",
      deliveryMode: delivery.mode,
      ...(this.isProduction()
        ? {}
        : {
            previewToken,
            previewUrl
          })
    };
  }

  async resetPassword(
    body: ResetPasswordDto,
    metadata: RequestMetadata
  ): Promise<SessionCookiesResult> {
    const payload = await this.verifyActionToken(body.token, AUTH_ACTION_PASSWORD_RESET);
    const user = await this.loadUserById(payload.sub);

    if (!user.passwordCredential || user.passwordCredential.passwordVersion !== payload.passwordVersion) {
      throw new UnauthorizedException("Password reset token is no longer valid");
    }

    const nextHash = await hash(body.nextPassword, 12);

    await this.prisma.$transaction(async (tx) => {
      await tx.passwordCredential.update({
        where: { userId: user.id },
        data: {
          passwordHash: nextHash,
          passwordVersion: {
            increment: 1
          },
          lastChangedAt: new Date()
        }
      });

      await tx.session.updateMany({
        where: {
          userId: user.id,
          revokedAt: null
        },
        data: {
          revokedAt: new Date()
        }
      });

      await this.safeAuditLog(tx, {
        action: "auth.password_reset_completed",
        actorUserId: user.id,
        entityId: user.id,
        entityType: "user",
        ipAddress: metadata.ipAddress,
        metadata: {
          workspaceId: this.getPreferredWorkspaceId(user)
        },
        userAgent: metadata.userAgent,
        workspaceId: this.getPreferredWorkspaceId(user)
      });
    });

    const refreshedUser = await this.loadUserById(user.id);
    return this.createSessionResponse(refreshedUser, this.getPreferredWorkspaceId(refreshedUser), metadata);
  }

  async resendVerification(body: EmailOnlyDto) {
    const user = await this.loadUserByEmail(normalizeEmail(body.email));
    if (!user || user.emailVerifiedAt) {
      return {
        status: "accepted"
      };
    }

    const verification = await this.dispatchEmailVerification(user);
    return {
      status: "accepted",
      deliveryMode: verification.deliveryMode,
      ...(this.isProduction()
        ? {}
        : {
            previewToken: verification.previewToken,
            previewUrl: verification.previewUrl
          })
    };
  }

  async verifyEmail(body: VerifyEmailDto) {
    const payload = await this.verifyActionToken(body.token, AUTH_ACTION_EMAIL_VERIFICATION);
    const user = await this.loadUserById(payload.sub);

    if (user.email !== payload.email) {
      throw new UnauthorizedException("Email verification token is no longer valid");
    }

    const verifiedUser = await this.prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerifiedAt: user.emailVerifiedAt ?? new Date(),
        status: "active"
      },
      select: {
        emailVerifiedAt: true,
        id: true
      }
    });

    await this.safeAuditLog(this.prisma, {
      action: "auth.email_verified",
      actorUserId: user.id,
      entityId: user.id,
      entityType: "user",
      ipAddress: null,
      metadata: null,
      userAgent: null,
      workspaceId: this.getPreferredWorkspaceId(user)
    });

    return {
      status: "verified",
      userId: verifiedUser.id,
      verifiedAt: verifiedUser.emailVerifiedAt?.toISOString() ?? null
    };
  }

  async authenticateRequest(request: Request): Promise<AuthContext> {
    const accessToken = readCookieFromRequest(request, AUTH_ACCESS_COOKIE);
    if (!accessToken) {
      throw new UnauthorizedException("Access token missing");
    }

    const payload = await this.verifySessionToken(accessToken, "access");
    const session = await this.prisma.session.findUnique({
      where: { id: payload.sid }
    });

    this.assertSessionIsActive(session, payload, "access");

    return {
      sessionId: session.id,
      userId: session.userId,
      workspaceId: session.workspaceId
    };
  }

  async tryGetSessionState(request: Request) {
    const accessToken = readCookieFromRequest(request, AUTH_ACCESS_COOKIE);
    if (!accessToken) {
      return null;
    }

    try {
      const payload = await this.verifySessionToken(accessToken, "access");
      const session = await this.prisma.session.findUnique({
        where: { id: payload.sid }
      });

      this.assertSessionIsActive(session, payload, "access");
      const user = await this.loadUserById(session.userId);
      return this.serializeSessionResponse(user, session, session.csrfSecret);
    } catch {
      return null;
    }
  }

  async selectWorkspace(
    auth: AuthContext,
    workspaceId: string,
    metadata: RequestMetadata
  ): Promise<SessionCookiesResult> {
    const user = await this.loadUserById(auth.userId);
    const membership = user.memberships.find((item) => item.workspace.id === workspaceId);

    if (!membership) {
      throw new UnauthorizedException("Workspace is not available for this user");
    }

    const updatedSession = await this.prisma.session.update({
      where: { id: auth.sessionId },
      data: {
        workspaceId,
        accessTokenId: randomUUID(),
        csrfSecret: randomUUID(),
        ipAddress: metadata.ipAddress,
        userAgent: metadata.userAgent
      }
    });

    await this.safeAuditLog(this.prisma, {
      action: "auth.workspace_selected",
      actorUserId: user.id,
      entityId: updatedSession.id,
      entityType: "session",
      ipAddress: metadata.ipAddress,
      metadata: {
        workspaceId
      },
      userAgent: metadata.userAgent,
      workspaceId
    });

    return this.buildSessionCookiesResult(user, updatedSession, updatedSession.csrfSecret);
  }

  private assertSessionIsActive(
    session: SessionRecord | null,
    payload: SessionTokenPayload,
    expectedType: "access" | "refresh"
  ): asserts session is SessionRecord {
    if (!session) {
      throw new UnauthorizedException("Session not found");
    }

    if (session.revokedAt || session.expiresAt <= new Date()) {
      throw new UnauthorizedException("Session is no longer active");
    }

    const expectedTokenId =
      expectedType === "access" ? session.accessTokenId : session.refreshTokenId;

    if (payload.type !== expectedType || payload.jti !== expectedTokenId) {
      throw new UnauthorizedException("Session token is invalid");
    }
  }

  private async buildSessionCookiesResult(
    user: AuthUserRecord,
    session: SessionRecord,
    csrfToken: string
  ): Promise<SessionCookiesResult> {
    const accessTtl = this.getAccessTtl();
    const refreshTtlMs = this.getRefreshTtlMs();

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(
        {
          sub: user.id,
          sid: session.id,
          jti: session.accessTokenId,
          wid: session.workspaceId ?? undefined,
          type: "access"
        } satisfies SessionTokenPayload,
        {
          expiresIn: Math.floor(parseDurationToMs(accessTtl) / 1000),
          secret: this.getAccessSecret()
        }
      ),
      this.jwtService.signAsync(
        {
          sub: user.id,
          sid: session.id,
          jti: session.refreshTokenId,
          wid: session.workspaceId ?? undefined,
          type: "refresh"
        } satisfies SessionTokenPayload,
        {
          expiresIn: Math.floor(refreshTtlMs / 1000),
          secret: this.getRefreshSecret()
        }
      )
    ]);

    return {
      cookies: {
        accessToken,
        refreshToken,
        csrfToken,
        accessMaxAgeMs: parseDurationToMs(accessTtl),
        refreshMaxAgeMs: refreshTtlMs,
        secure: this.useSecureCookies()
      },
      response: this.serializeSessionResponse(user, session, csrfToken)
    };
  }

  private async createActionToken(
    user: AuthUserRecord,
    type: typeof AUTH_ACTION_EMAIL_VERIFICATION | typeof AUTH_ACTION_PASSWORD_RESET,
    expiresIn: string
  ) {
    if (!user.passwordCredential) {
      throw new BadRequestException("Password credential is not configured");
    }

    return this.jwtService.signAsync(
      {
        sub: user.id,
        email: user.email,
        passwordVersion: user.passwordCredential.passwordVersion,
        type
      } satisfies ActionTokenPayload,
      {
        expiresIn: Math.floor(parseDurationToMs(expiresIn) / 1000),
        secret: this.getDerivedSecret(type)
      }
    );
  }

  private async createSessionResponse(
    user: AuthUserRecord,
    workspaceId: string | null,
    metadata: RequestMetadata
  ) {
    const session = await this.prisma.session.create({
      data: {
        userId: user.id,
        workspaceId,
        kind: SessionKind.web,
        accessTokenId: randomUUID(),
        refreshTokenId: randomUUID(),
        csrfSecret: randomUUID(),
        ipAddress: metadata.ipAddress,
        userAgent: metadata.userAgent,
        expiresAt: new Date(Date.now() + this.getRefreshTtlMs())
      }
    });

    return this.buildSessionCookiesResult(user, session, session.csrfSecret);
  }

  private async dispatchEmailVerification(user: AuthUserRecord): Promise<TokenDispatchResult> {
    if (user.emailVerifiedAt) {
      return {
        deliveryMode: "preview"
      };
    }

    const previewToken = await this.createActionToken(user, AUTH_ACTION_EMAIL_VERIFICATION, "7d");
    const previewUrl = this.buildAppUrl("/verificar-email", { token: previewToken });
    const delivery = await this.mailService.sendEmailVerification({
      email: user.email,
      fullName: user.fullName,
      verificationUrl: previewUrl
    });

    return {
      deliveryMode: delivery.mode,
      ...(this.isProduction()
        ? {}
        : {
            previewToken,
            previewUrl
          })
    };
  }

  private async ensureOwnerRole(client: Prisma.TransactionClient) {
    return client.role.upsert({
      where: { code: "owner" },
      update: {
        name: "Owner",
        permissions: ["*"]
      },
      create: {
        code: "owner",
        name: "Owner",
        permissions: ["*"]
      }
    });
  }

  private createSessionResponseShape(
    user: AuthUserRecord,
    session: SessionRecord,
    csrfToken: string
  ): AuthSessionResponse {
    const workspaces = user.memberships.map((membership) => ({
      branding: {
        accentColor: membership.workspace.businessProfile?.accentColor ?? null,
        niche: membership.workspace.businessProfile?.niche ?? null,
        primaryColor: membership.workspace.businessProfile?.primaryColor ?? null,
        tradeName: membership.workspace.businessProfile?.tradeName ?? null
      },
      id: membership.workspace.id,
      name: membership.workspace.name,
      role: {
        code: membership.role.code,
        name: membership.role.name
      },
      slug: membership.workspace.slug,
      status: membership.workspace.status,
      timezone: membership.workspace.timezone
    }));

    return {
      authenticated: true,
      csrfToken,
      session: {
        expiresAt: session.expiresAt.toISOString(),
        id: session.id,
        kind: session.kind
      },
      user: {
        avatarUrl: user.avatarUrl ?? null,
        email: user.email,
        emailVerified: Boolean(user.emailVerifiedAt),
        fullName: user.fullName,
        id: user.id,
        status: user.status
      },
      workspace:
        workspaces.find((item) => item.id === session.workspaceId) ?? workspaces[0] ?? null,
      workspaces
    };
  }

  private async generateUniqueWorkspaceSlug(
    businessName: string,
    client: Prisma.TransactionClient | PrismaService
  ) {
    const baseSlug = slugify(businessName);
    let candidate = baseSlug;
    let suffix = 0;

    while (await client.workspace.findUnique({ where: { slug: candidate }, select: { id: true } })) {
      suffix += 1;
      candidate = `${baseSlug}-${suffix}`;
    }

    return candidate;
  }

  private getAccessSecret() {
    return this.configService.get("JWT_ACCESS_SECRET", "change_me_access_secret");
  }

  private getAccessTtl() {
    return this.configService.get("JWT_ACCESS_TTL", "15m");
  }

  private getAllowedGoogleOrigins() {
    return this.configService
      .get("GOOGLE_ALLOWED_ORIGINS", "")
      .split(",")
      .map((item: string) => item.trim())
      .filter(Boolean);
  }

  private getAppUrl() {
    return (
      this.configService.get("APP_URL") ??
      this.configService.get("PUBLIC_URL") ??
      "http://localhost:3000"
    );
  }

  private getDerivedSecret(purpose: string) {
    return createHash("sha256")
      .update(`${this.getAccessSecret()}:${purpose}`)
      .digest("hex");
  }

  private getGoogleClientIds() {
    return this.configService
      .get("GOOGLE_CLIENT_ID", "")
      .split(",")
      .map((item: string) => item.trim())
      .filter(Boolean);
  }

  private getPreferredWorkspaceId(user: AuthUserRecord) {
    return user.memberships[0]?.workspace.id ?? null;
  }

  private getRefreshSecret() {
    return this.configService.get("JWT_REFRESH_SECRET", "change_me_refresh_secret");
  }

  private getRefreshTtlDays() {
    return Number(this.configService.get("JWT_REFRESH_TTL_DAYS", "30"));
  }

  private getRefreshTtlMs() {
    return this.getRefreshTtlDays() * 24 * 60 * 60 * 1000;
  }

  private isProduction() {
    return this.configService.get("NODE_ENV", "development") === "production";
  }

  private async linkGoogleIdentity(
    client: Prisma.TransactionClient,
    input: {
      avatarUrl: string | null;
      email: string;
      googleSub: string;
      userId: string;
    }
  ) {
    const existingAccount = await client.account.findUnique({
      where: {
        provider_providerRef: {
          provider: "google",
          providerRef: input.googleSub
        }
      },
      select: {
        id: true,
        userId: true
      }
    });

    if (existingAccount && existingAccount.userId !== input.userId) {
      throw new ConflictException("Google account is already linked to another user");
    }

    const existingLink = await client.oAuthProviderLink.findUnique({
      where: {
        provider_providerSub: {
          provider: "google",
          providerSub: input.googleSub
        }
      },
      select: {
        id: true,
        userId: true
      }
    });

    if (existingLink && existingLink.userId !== input.userId) {
      throw new ConflictException("Google identity is already linked to another user");
    }

    const account =
      existingAccount ??
      (await client.account.create({
        data: {
          userId: input.userId,
          provider: "google",
          providerRef: input.googleSub
        },
        select: {
          id: true,
          userId: true
        }
      }));

    if (existingLink) {
      await client.oAuthProviderLink.update({
        where: {
          id: existingLink.id
        },
        data: {
          accountId: account.id,
          avatarUrl: input.avatarUrl ?? undefined,
          emailAtLink: input.email,
          userId: input.userId
        }
      });
      return;
    }

    await client.oAuthProviderLink.create({
      data: {
        accountId: account.id,
        avatarUrl: input.avatarUrl ?? undefined,
        emailAtLink: input.email,
        provider: "google",
        providerSub: input.googleSub,
        userId: input.userId
      }
    });
  }

  private async loadUserByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
      select: authUserSelect
    });
  }

  private async loadUserById(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: authUserSelect
    });

    if (!user) {
      throw new UnauthorizedException("User not found");
    }

    return user;
  }

  private async provisionOwnerWorkspace(
    input: OwnerProvisionInput,
    passwordHash: string | null
  ) {
    return this.prisma.$transaction(async (tx) => {
      const ownerRole = await this.ensureOwnerRole(tx);
      const slug = await this.generateUniqueWorkspaceSlug(input.businessName, tx);

      const workspace = await tx.workspace.create({
        data: {
          name: input.businessName,
          slug,
          timezone: "America/Sao_Paulo",
          status: "trial",
          businessProfile: {
            create: {
              legalName: input.businessName,
              tradeName: input.businessName,
              niche: "Negocio beauty",
              contactEmail: input.email,
              contactPhone: input.phone || null
            }
          },
          subscription: {
            create: {
              planCode: "trial",
              status: "trialing",
              seatsIncluded: 3
            }
          }
        },
        select: {
          id: true
        }
      });

      const user = await tx.user.create({
        data: {
          email: input.email,
          fullName: input.fullName,
          avatarUrl: input.avatarUrl ?? undefined,
          status: "active",
          emailVerifiedAt: input.emailVerifiedAt ?? undefined,
          ...(passwordHash
            ? {
                passwordCredential: {
                  create: {
                    passwordHash
                  }
                }
              }
            : {})
        },
        select: {
          id: true
        }
      });

      if (input.googleSub) {
        await this.linkGoogleIdentity(tx, {
          avatarUrl: input.avatarUrl ?? null,
          email: input.email,
          googleSub: input.googleSub,
          userId: user.id
        });
      }

      await tx.membership.create({
        data: {
          workspaceId: workspace.id,
          userId: user.id,
          roleId: ownerRole.id,
          status: "active",
          joinedAt: new Date()
        }
      });

      await this.safeAuditLog(tx, {
        action: input.googleSub ? "auth.google_register" : "auth.register",
        actorUserId: user.id,
        entityId: user.id,
        entityType: "user",
        ipAddress: input.metadata.ipAddress,
        metadata: {
          email: input.email,
          workspaceId: workspace.id
        },
        userAgent: input.metadata.userAgent,
        workspaceId: workspace.id
      });

      return {
        userId: user.id,
        workspaceId: workspace.id
      };
    });
  }

  private serializeSessionResponse(
    user: AuthUserRecord,
    session: SessionRecord,
    csrfToken: string
  ) {
    return this.createSessionResponseShape(user, session, csrfToken);
  }

  private async safeAuditLog(
    client: Pick<Prisma.TransactionClient, "auditLog"> | Pick<PrismaService, "auditLog">,
    params: {
      action: string;
      actorUserId: string | null;
      entityId: string;
      entityType: string;
      ipAddress: string | null;
      metadata: Prisma.InputJsonValue | null;
      userAgent: string | null;
      workspaceId: string | null;
    }
  ) {
    if (!params.workspaceId) {
      return;
    }

    try {
      await client.auditLog.create({
        data: {
          workspaceId: params.workspaceId,
          actorUserId: params.actorUserId ?? undefined,
          action: params.action,
          entityType: params.entityType,
          entityId: params.entityId,
          metadata: params.metadata ?? undefined,
          ipAddress: params.ipAddress ?? undefined,
          userAgent: params.userAgent ?? undefined
        }
      });
    } catch {
      // Audit logging must not take down the auth edge.
    }
  }

  private useSecureCookies() {
    return this.configService.get("SESSION_COOKIE_SECURE", "false").toLowerCase() === "true";
  }

  private async verifyActionToken(
    token: string,
    purpose: typeof AUTH_ACTION_EMAIL_VERIFICATION | typeof AUTH_ACTION_PASSWORD_RESET
  ) {
    try {
      return await this.jwtService.verifyAsync<ActionTokenPayload>(token, {
        secret: this.getDerivedSecret(purpose)
      });
    } catch {
      throw new UnauthorizedException("Action token is invalid or expired");
    }
  }

  private async verifyGoogleIdentity(
    body: GoogleLoginDto,
    request: Request
  ): Promise<GoogleIdentity> {
    const clientIds = this.getGoogleClientIds();
    if (clientIds.length === 0) {
      throw new BadRequestException("Google OAuth is not configured");
    }

    const requestOrigin = this.getRequestOrigin(request);
    const allowedOrigins = this.getAllowedGoogleOrigins();
    if (allowedOrigins.length > 0 && (!requestOrigin || !allowedOrigins.includes(requestOrigin))) {
      throw new UnauthorizedException("Origin is not allowed for Google OAuth");
    }

    const csrfCookie = readCookieFromRequest(request, AUTH_GOOGLE_CSRF_COOKIE);
    if (!csrfCookie || !body.csrfToken || csrfCookie !== body.csrfToken) {
      throw new UnauthorizedException("Google CSRF validation failed");
    }

    const ticket = await this.googleClient.verifyIdToken({
      idToken: body.credential,
      audience: clientIds
    });

    const payload = ticket.getPayload();
    if (!payload?.sub || !payload.email || !payload.email_verified) {
      throw new UnauthorizedException("Google identity payload is incomplete");
    }

    if (!payload.iss || !["accounts.google.com", "https://accounts.google.com"].includes(payload.iss)) {
      throw new UnauthorizedException("Google issuer is invalid");
    }

    return {
      avatarUrl: payload.picture ?? null,
      email: normalizeEmail(payload.email),
      fullName: payload.name?.trim() || payload.email,
      sub: payload.sub
    };
  }

  private async verifySessionToken(
    token: string,
    type: "access" | "refresh",
    ignoreExpiration = false
    ) {
    try {
      return await this.jwtService.verifyAsync<SessionTokenPayload>(token, {
        secret: type === "access" ? this.getAccessSecret() : this.getRefreshSecret(),
        ignoreExpiration
      });
    } catch {
      throw new UnauthorizedException("Session token is invalid or expired");
    }
  }

  private buildAppUrl(pathname: string, query?: Record<string, string>) {
    const url = new URL(pathname, this.getAppUrl());
    for (const [key, value] of Object.entries(query ?? {})) {
      url.searchParams.set(key, value);
    }
    return url.toString();
  }

  private deriveBusinessName(fullName: string, email: string) {
    if (fullName.trim()) {
      return `${fullName.trim()} Studio`;
    }

    return `${email.split("@")[0]} Studio`;
  }

  private getRequestOrigin(request: Request) {
    const origin = request.get("origin");
    if (origin) {
      return origin;
    }

    const referer = request.get("referer");
    if (!referer) {
      return null;
    }

    try {
      return new URL(referer).origin;
    } catch {
      return null;
    }
  }
}
