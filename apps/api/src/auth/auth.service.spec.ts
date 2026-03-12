import { JwtService } from "@nestjs/jwt";
import { UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { hash } from "bcryptjs";
import {
  AUTH_CSRF_COOKIE,
  AUTH_REFRESH_COOKIE
} from "./auth.constants";
import { AuthService } from "./auth.service";

describe("AuthService", () => {
  const config = new ConfigService({
    JWT_ACCESS_SECRET: "test-access-secret",
    JWT_REFRESH_SECRET: "test-refresh-secret",
    JWT_ACCESS_TTL: "15m",
    JWT_REFRESH_TTL_DAYS: "30",
    NODE_ENV: "development",
    SESSION_COOKIE_SECURE: "false"
  });

  function buildPrismaMock() {
    return {
      $transaction: jest.fn(),
      auditLog: {
        create: jest.fn()
      },
      membership: {
        create: jest.fn(),
        findFirst: jest.fn()
      },
      role: {
        upsert: jest.fn()
      },
      session: {
        create: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn()
      },
      user: {
        create: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn()
      },
      workspace: {
        create: jest.fn(),
        findUnique: jest.fn()
      }
    };
  }

  function buildMailServiceMock() {
    return {
      sendEmailVerification: jest.fn().mockResolvedValue({
        mode: "preview"
      }),
      sendPasswordReset: jest.fn().mockResolvedValue({
        mode: "preview"
      })
    };
  }

  it("registers a new owner and returns an authenticated session", async () => {
    const prisma = buildPrismaMock();
    const mailService = buildMailServiceMock();
    const jwt = new JwtService();
    const service = new AuthService(prisma as never, jwt, config, mailService as never);

    const authUser = {
      id: "user_1",
      email: "owner@studio.dev",
      fullName: "Studio Owner",
      avatarUrl: null,
      status: "active",
      emailVerifiedAt: null,
      passwordCredential: {
        passwordHash: "unused",
        passwordVersion: 1
      },
      memberships: [
        {
          id: "membership_1",
          status: "active",
          joinedAt: new Date("2026-03-12T12:00:00.000Z"),
          role: {
            code: "owner",
            name: "Owner"
          },
          workspace: {
            id: "workspace_1",
            name: "Studio Bela",
            slug: "studio-bela",
            timezone: "America/Sao_Paulo",
            status: "trial",
            businessProfile: {
              tradeName: "Studio Bela",
              niche: "Negocio beauty",
              primaryColor: "#c26b36",
              accentColor: "#0f172a"
            }
          }
        }
      ]
    };

    prisma.user.findUnique
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(authUser);
    prisma.session.create.mockResolvedValue({
      id: "session_1",
      userId: "user_1",
      workspaceId: "workspace_1",
      kind: "web",
      accessTokenId: "access_1",
      refreshTokenId: "refresh_1",
      csrfSecret: "csrf_1",
      expiresAt: new Date("2026-04-11T12:00:00.000Z"),
      revokedAt: null
    });

    const tx = {
      auditLog: {
        create: jest.fn()
      },
      membership: {
        create: jest.fn().mockResolvedValue({ id: "membership_1" })
      },
      role: {
        upsert: jest.fn().mockResolvedValue({ id: "role_owner" })
      },
      user: {
        create: jest.fn().mockResolvedValue({ id: "user_1" })
      },
      workspace: {
        create: jest.fn().mockResolvedValue({ id: "workspace_1" }),
        findUnique: jest.fn().mockResolvedValue(null)
      }
    };

    prisma.$transaction.mockImplementation(async (callback: (input: typeof tx) => unknown) =>
      callback(tx)
    );

    const result = await service.register(
      {
        businessName: "Studio Bela",
        email: "owner@studio.dev",
        fullName: "Studio Owner",
        password: "ChangeMe123!",
        phone: "11999999999"
      },
      {
        ipAddress: "127.0.0.1",
        userAgent: "jest"
      }
    );

    expect(result.response.authenticated).toBe(true);
    expect(result.response.user?.email).toBe("owner@studio.dev");
    expect(result.response.workspace?.slug).toBe("studio-bela");
    expect(result.cookies.accessToken).toEqual(expect.any(String));
    expect(result.cookies.refreshToken).toEqual(expect.any(String));
    expect(result.verificationTokenPreview).toEqual(expect.any(String));
    expect(mailService.sendEmailVerification).toHaveBeenCalledTimes(1);
  });

  it("rejects login with an invalid password", async () => {
    const prisma = buildPrismaMock();
    const mailService = buildMailServiceMock();
    const jwt = new JwtService();
    const service = new AuthService(prisma as never, jwt, config, mailService as never);
    const passwordHash = await hash("CorrectPassword123!", 12);

    prisma.user.findUnique.mockResolvedValue({
      id: "user_1",
      email: "owner@studio.dev",
      fullName: "Studio Owner",
      avatarUrl: null,
      status: "active",
      emailVerifiedAt: new Date(),
      passwordCredential: {
        passwordHash,
        passwordVersion: 1
      },
      memberships: []
    });

    await expect(
      service.login(
        {
          email: "owner@studio.dev",
          password: "WrongPassword123!"
        },
        {
          ipAddress: "127.0.0.1",
          userAgent: "jest"
        }
      )
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it("rotates refresh credentials and returns new cookies", async () => {
    const prisma = buildPrismaMock();
    const mailService = buildMailServiceMock();
    const jwt = new JwtService();
    const service = new AuthService(prisma as never, jwt, config, mailService as never);

    const refreshToken = await jwt.signAsync(
      {
        sub: "user_1",
        sid: "session_1",
        jti: "refresh_1",
        wid: "workspace_1",
        type: "refresh"
      },
      {
        expiresIn: "30d",
        secret: "test-refresh-secret"
      }
    );

    prisma.session.findUnique.mockResolvedValue({
      id: "session_1",
      userId: "user_1",
      workspaceId: "workspace_1",
      kind: "web",
      accessTokenId: "access_1",
      refreshTokenId: "refresh_1",
      csrfSecret: "csrf_1",
      expiresAt: new Date(Date.now() + 86_400_000),
      revokedAt: null
    });

    prisma.membership.findFirst.mockResolvedValue({
      role: {
        code: "owner"
      }
    });

    prisma.session.update.mockResolvedValue({
      id: "session_1",
      userId: "user_1",
      workspaceId: "workspace_1",
      kind: "web",
      accessTokenId: "access_2",
      refreshTokenId: "refresh_2",
      csrfSecret: "csrf_2",
      expiresAt: new Date(Date.now() + 86_400_000),
      revokedAt: null
    });

    prisma.user.findUnique.mockResolvedValue({
      id: "user_1",
      email: "owner@studio.dev",
      fullName: "Studio Owner",
      avatarUrl: null,
      status: "active",
      emailVerifiedAt: new Date(),
      passwordCredential: {
        passwordHash: "unused",
        passwordVersion: 1
      },
      memberships: [
        {
          id: "membership_1",
          status: "active",
          joinedAt: new Date(),
          role: {
            code: "owner",
            name: "Owner"
          },
          workspace: {
            id: "workspace_1",
            name: "Studio Bela",
            slug: "studio-bela",
            timezone: "America/Sao_Paulo",
            status: "trial",
            businessProfile: {
              tradeName: "Studio Bela",
              niche: "Negocio beauty",
              primaryColor: "#c26b36",
              accentColor: "#0f172a"
            }
          }
        }
      ]
    });

    const result = await service.refresh(
      {
        cookies: {
          [AUTH_CSRF_COOKIE]: "csrf_1",
          [AUTH_REFRESH_COOKIE]: refreshToken
        },
        get: (name: string) => (name === "x-csrf-token" ? "csrf_1" : undefined),
        headers: {}
      } as never,
      {
        ipAddress: "127.0.0.1",
        userAgent: "jest"
      }
    );

    expect(prisma.session.update).toHaveBeenCalledTimes(1);
    expect(result.response.authenticated).toBe(true);
    expect(result.cookies.refreshToken).toEqual(expect.any(String));
    expect(result.cookies.csrfToken).toBe("csrf_2");
  });

  it("rejects requests with an invalid csrf token", async () => {
    const prisma = buildPrismaMock();
    const mailService = buildMailServiceMock();
    const jwt = new JwtService();
    const service = new AuthService(prisma as never, jwt, config, mailService as never);

    prisma.session.findUnique.mockResolvedValue({
      id: "session_1",
      csrfSecret: "csrf_expected",
      expiresAt: new Date(Date.now() + 86_400_000),
      revokedAt: null
    });

    await expect(
      service.assertRequestCsrf(
        {
          sessionId: "session_1",
          userId: "user_1",
          workspaceId: "workspace_1",
          roleCode: "owner"
        },
        {
          cookies: {
            [AUTH_CSRF_COOKIE]: "csrf_cookie"
          },
          get: (name: string) => (name === "x-csrf-token" ? "csrf_header" : undefined),
          headers: {}
        } as never
      )
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
