import type { FastifyInstance } from "fastify";
import argon2 from "argon2";
import { addDays, addHours } from "date-fns";
import { OAuth2Client } from "google-auth-library";
import { createHash, randomBytes, randomUUID } from "node:crypto";
import { env } from "../../config/env.js";
import { sendEmail } from "../../lib/mailer.js";
import { prisma } from "../../lib/prisma.js";

type MembershipWithWorkspace = {
  workspaceId: string;
  role: string;
  workspace: {
    id: string;
    name: string;
    slug: string;
    timezone: string;
  };
};

type AuthenticatedUser = {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  emailVerifiedAt: Date | null;
  memberships: MembershipWithWorkspace[];
};

type PasswordRegistrationInput = {
  email: string;
  password: string;
  name: string;
  workspaceName: string;
  slug: string;
  whatsapp?: string;
  timezone: string;
};

type GoogleAuthInput = {
  credential: string;
  workspaceName?: string;
  slug?: string;
  whatsapp?: string;
  timezone: string;
};

let googleClient: OAuth2Client | null = null;

const defaultBusinessHours = [
  { weekday: 1, startTime: "09:00", endTime: "19:00" },
  { weekday: 2, startTime: "09:00", endTime: "19:00" },
  { weekday: 3, startTime: "09:00", endTime: "19:00" },
  { weekday: 4, startTime: "09:00", endTime: "19:00" },
  { weekday: 5, startTime: "09:00", endTime: "19:00" },
  { weekday: 6, startTime: "09:00", endTime: "16:00" }
];

export function normalizeSlug(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function createOpaqueToken() {
  return randomBytes(32).toString("base64url");
}

function hashOpaqueToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function buildAuthLinks(token: string, kind: "verify-email" | "reset-password") {
  const url = new URL(`/auth/${kind}`, env.PUBLIC_URL);
  url.searchParams.set("token", token);
  return url.toString();
}

function getGoogleClient() {
  if (!env.GOOGLE_CLIENT_ID) {
    throw new Error("Google auth nao configurado");
  }

  googleClient ??= new OAuth2Client(env.GOOGLE_CLIENT_ID);
  return googleClient;
}

function assertSmtpConfigured(app: FastifyInstance) {
  if (!env.SMTP_USER || !env.SMTP_PASSWORD) {
    throw app.httpErrors.badRequest("SMTP nao configurado para fluxo de autenticacao");
  }
}

async function ensureWorkspaceAvailability(app: FastifyInstance, email: string, slug: string) {
  const normalizedEmail = email.toLowerCase();
  const normalizedSlug = normalizeSlug(slug);

  const [existingUser, existingWorkspace] = await Promise.all([
    prisma.user.findUnique({ where: { email: normalizedEmail } }),
    prisma.workspace.findUnique({ where: { slug: normalizedSlug } })
  ]);

  if (existingUser) {
    throw app.httpErrors.conflict("Ja existe uma conta com este email");
  }

  if (existingWorkspace) {
    throw app.httpErrors.conflict("Este link do negocio ja esta em uso");
  }

  return normalizedSlug;
}

async function createAuthToken(userId: string, type: "verify_email" | "reset_password", expiresAt: Date) {
  const token = createOpaqueToken();
  const tokenHash = hashOpaqueToken(token);

  await prisma.authToken.create({
    data: {
      userId,
      type,
      tokenHash,
      expiresAt
    }
  });

  return token;
}

async function markOtherTokensConsumed(userId: string, type: "verify_email" | "reset_password") {
  await prisma.authToken.updateMany({
    where: {
      userId,
      type,
      consumedAt: null
    },
    data: {
      consumedAt: new Date()
    }
  });
}

async function findActiveToken(token: string, type: "verify_email" | "reset_password") {
  return prisma.authToken.findFirst({
    where: {
      tokenHash: hashOpaqueToken(token),
      type,
      consumedAt: null,
      expiresAt: { gt: new Date() }
    }
  });
}

function buildWorkspaceSeed(input: { workspaceName: string; slug: string; timezone: string; whatsapp?: string }) {
  const trialEndsAt = addDays(new Date(), 14);

  return {
    name: input.workspaceName,
    slug: normalizeSlug(input.slug),
    timezone: input.timezone,
    whatsapp: input.whatsapp,
    businessHours: {
      createMany: {
        data: defaultBusinessHours
      }
    },
    subscription: {
      create: {
        plan: "trial" as const,
        status: "trialing" as const,
        paidUntil: trialEndsAt,
        trialEndsAt
      }
    }
  };
}

function buildSessionPayload(user: AuthenticatedUser) {
  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      avatarUrl: user.avatarUrl,
      emailVerifiedAt: user.emailVerifiedAt
    },
    workspaces: user.memberships.map((membership) => ({
      id: membership.workspaceId,
      role: membership.role,
      name: membership.workspace.name,
      slug: membership.workspace.slug,
      timezone: membership.workspace.timezone
    }))
  };
}

export async function issueSession(app: FastifyInstance, userId: string) {
  const accessToken = (app as any).accessJwt.sign({ sub: userId });
  const refreshToken = (app as any).refreshJwt.sign({ sub: userId, jti: randomUUID() });
  const tokenHash = await argon2.hash(refreshToken);

  await prisma.refreshToken.create({
    data: {
      userId,
      tokenHash,
      expiresAt: addDays(new Date(), 30)
    }
  });

  return { accessToken, refreshToken };
}

export async function findRefreshTokenRecord(userId: string, refreshToken: string) {
  const tokens = await prisma.refreshToken.findMany({
    where: {
      userId,
      revokedAt: null,
      expiresAt: { gt: new Date() }
    },
    orderBy: { createdAt: "desc" }
  });

  for (const token of tokens) {
    if (await argon2.verify(token.tokenHash, refreshToken)) {
      return token;
    }
  }

  return null;
}

async function loadUserSession(userId: string) {
  return prisma.user.findUniqueOrThrow({
    where: { id: userId },
    include: {
      memberships: {
        include: { workspace: true },
        orderBy: { workspace: { createdAt: "asc" } }
      }
    }
  });
}

async function sendVerificationEmail(name: string, email: string, token: string) {
  const actionUrl = buildAuthLinks(token, "verify-email");
  await sendEmail({
    to: email,
    subject: "Confirme seu e-mail no BELEZAFOCO",
    text: [
      `Oi, ${name}.`,
      "",
      "Confirme seu e-mail para liberar o acesso ao painel do BELEZAFOCO:",
      actionUrl,
      "",
      "Este link expira em 24 horas."
    ].join("\n"),
    html: `
      <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#0f172a">
        <p style="font-size:14px;letter-spacing:0.16em;text-transform:uppercase;color:#c26b36;font-weight:700">BELEZAFOCO</p>
        <h1 style="margin:16px 0 12px;font-size:28px;line-height:1.2">Confirme seu e-mail</h1>
        <p style="font-size:16px;line-height:1.7">Oi, ${name}. Confirme seu e-mail para liberar o acesso ao painel do BELEZAFOCO.</p>
        <p style="margin:28px 0">
          <a href="${actionUrl}" style="display:inline-block;background:#0f172a;color:#fff;padding:14px 22px;border-radius:999px;text-decoration:none;font-weight:700">Confirmar e-mail</a>
        </p>
        <p style="font-size:14px;line-height:1.7;color:#475569">Se o botao nao abrir, cole este link no navegador:<br/><a href="${actionUrl}" style="color:#c26b36">${actionUrl}</a></p>
        <p style="font-size:13px;line-height:1.7;color:#64748b">Este link expira em 24 horas.</p>
      </div>
    `
  });
}

async function sendPasswordResetEmail(name: string, email: string, token: string) {
  const actionUrl = buildAuthLinks(token, "reset-password");
  await sendEmail({
    to: email,
    subject: "Redefina sua senha no BELEZAFOCO",
    text: [
      `Oi, ${name}.`,
      "",
      "Recebemos um pedido para redefinir sua senha.",
      actionUrl,
      "",
      "Se nao foi voce, ignore este e-mail."
    ].join("\n"),
    html: `
      <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#0f172a">
        <p style="font-size:14px;letter-spacing:0.16em;text-transform:uppercase;color:#c26b36;font-weight:700">BELEZAFOCO</p>
        <h1 style="margin:16px 0 12px;font-size:28px;line-height:1.2">Redefina sua senha</h1>
        <p style="font-size:16px;line-height:1.7">Oi, ${name}. Recebemos um pedido para redefinir sua senha.</p>
        <p style="margin:28px 0">
          <a href="${actionUrl}" style="display:inline-block;background:#0f172a;color:#fff;padding:14px 22px;border-radius:999px;text-decoration:none;font-weight:700">Criar nova senha</a>
        </p>
        <p style="font-size:14px;line-height:1.7;color:#475569">Se voce nao pediu a troca, ignore este e-mail. O link expira em 2 horas.</p>
      </div>
    `
  });
}

export async function registerWithPassword(app: FastifyInstance, input: PasswordRegistrationInput) {
  assertSmtpConfigured(app);
  const normalizedSlug = await ensureWorkspaceAvailability(app, input.email, input.slug);
  const passwordHash = await argon2.hash(input.password);

  const user = await prisma.user.create({
    data: {
      email: input.email.toLowerCase(),
      passwordHash,
      name: input.name,
      memberships: {
        create: {
          role: "owner",
          workspace: {
            create: buildWorkspaceSeed({
              workspaceName: input.workspaceName,
              slug: normalizedSlug,
              timezone: input.timezone,
              whatsapp: input.whatsapp
            })
          }
        }
      }
    }
  });

  await markOtherTokensConsumed(user.id, "verify_email");
  const verificationToken = await createAuthToken(user.id, "verify_email", addHours(new Date(), 24));

  let emailSent = true;
  try {
    await sendVerificationEmail(user.name, user.email, verificationToken);
  } catch (error) {
    emailSent = false;
    app.log.error({ error, email: user.email }, "failed_to_send_verification_email");
  }

  return {
    requiresEmailVerification: true,
    email: user.email,
    emailSent
  };
}

export async function loginWithPassword(app: FastifyInstance, email: string, password: string) {
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
    include: {
      memberships: {
        include: { workspace: true },
        orderBy: { workspace: { createdAt: "asc" } }
      }
    }
  });

  if (!user?.passwordHash || !(await argon2.verify(user.passwordHash, password))) {
    throw app.httpErrors.unauthorized("Credenciais invalidas");
  }

  if (!user.emailVerifiedAt) {
    return {
      blocked: true,
      code: "EMAIL_NOT_VERIFIED" as const,
      message: "Confirme seu e-mail antes de entrar"
    };
  }

  await prisma.refreshToken.deleteMany({
    where: {
      userId: user.id,
      OR: [{ expiresAt: { lte: new Date() } }, { revokedAt: { not: null } }]
    }
  });

  const session = await issueSession(app, user.id);
  return {
    ...session,
    ...buildSessionPayload(user as AuthenticatedUser)
  };
}

export async function verifyEmailToken(app: FastifyInstance, token: string) {
  const record = await findActiveToken(token, "verify_email");
  if (!record) {
    throw app.httpErrors.badRequest("Link de confirmacao invalido ou expirado");
  }

  await prisma.$transaction([
    prisma.authToken.update({
      where: { id: record.id },
      data: { consumedAt: new Date() }
    }),
    prisma.user.update({
      where: { id: record.userId },
      data: { emailVerifiedAt: new Date() }
    })
  ]);

  const user = (await loadUserSession(record.userId)) as AuthenticatedUser;
  const session = await issueSession(app, user.id);

  return {
    ...session,
    ...buildSessionPayload(user)
  };
}

export async function resendVerificationEmail(app: FastifyInstance, email: string) {
  assertSmtpConfigured(app);

  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (!user || user.emailVerifiedAt) {
    return { ok: true };
  }

  await markOtherTokensConsumed(user.id, "verify_email");
  const token = await createAuthToken(user.id, "verify_email", addHours(new Date(), 24));

  try {
    await sendVerificationEmail(user.name, user.email, token);
  } catch (error) {
    app.log.error({ error, email: user.email }, "failed_to_resend_verification_email");
    throw app.httpErrors.internalServerError("Nao foi possivel reenviar o e-mail agora");
  }

  return { ok: true };
}

export async function requestPasswordReset(app: FastifyInstance, email: string) {
  assertSmtpConfigured(app);

  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (!user) {
    return { ok: true };
  }

  await markOtherTokensConsumed(user.id, "reset_password");
  const token = await createAuthToken(user.id, "reset_password", addHours(new Date(), 2));

  try {
    await sendPasswordResetEmail(user.name, user.email, token);
  } catch (error) {
    app.log.error({ error, email: user.email }, "failed_to_send_password_reset");
    throw app.httpErrors.internalServerError("Nao foi possivel enviar o e-mail de redefinicao");
  }

  return { ok: true };
}

export async function resetPassword(app: FastifyInstance, token: string, password: string) {
  const record = await findActiveToken(token, "reset_password");
  if (!record) {
    throw app.httpErrors.badRequest("Link de redefinicao invalido ou expirado");
  }

  const passwordHash = await argon2.hash(password);

  await prisma.$transaction([
    prisma.authToken.update({
      where: { id: record.id },
      data: { consumedAt: new Date() }
    }),
    prisma.user.update({
      where: { id: record.userId },
      data: { passwordHash }
    }),
    prisma.refreshToken.updateMany({
      where: { userId: record.userId, revokedAt: null },
      data: { revokedAt: new Date() }
    })
  ]);

  return { ok: true };
}

async function verifyGoogleCredential(credential: string) {
  const client = getGoogleClient();
  const ticket = await client.verifyIdToken({
    idToken: credential,
    audience: env.GOOGLE_CLIENT_ID
  });

  const payload = ticket.getPayload();
  if (!payload?.email || !payload.sub || !payload.email_verified) {
    throw new Error("Google credential invalida");
  }

  return {
    googleSub: payload.sub,
    email: payload.email.toLowerCase(),
    name: payload.name ?? payload.email,
    picture: payload.picture ?? null
  };
}

export async function authenticateWithGoogle(app: FastifyInstance, input: GoogleAuthInput) {
  if (!env.GOOGLE_CLIENT_ID) {
    throw app.httpErrors.badRequest("Google auth nao configurado");
  }

  let googleProfile;
  try {
    googleProfile = await verifyGoogleCredential(input.credential);
  } catch {
    throw app.httpErrors.unauthorized("Credencial Google invalida");
  }

  const existingUser = await prisma.user.findFirst({
    where: {
      OR: [{ googleSub: googleProfile.googleSub }, { email: googleProfile.email }]
    },
    include: {
      memberships: {
        include: { workspace: true },
        orderBy: { workspace: { createdAt: "asc" } }
      }
    }
  });

  if (existingUser) {
    const updatedUser = await prisma.user.update({
      where: { id: existingUser.id },
      data: {
        googleSub: googleProfile.googleSub,
        avatarUrl: googleProfile.picture,
        emailVerifiedAt: existingUser.emailVerifiedAt ?? new Date()
      },
      include: {
        memberships: {
          include: { workspace: true },
          orderBy: { workspace: { createdAt: "asc" } }
        }
      }
    });

    const session = await issueSession(app, updatedUser.id);
    return {
      mode: "authenticated" as const,
      ...session,
      ...buildSessionPayload(updatedUser as AuthenticatedUser)
    };
  }

  if (!input.workspaceName || !input.slug) {
    return {
      mode: "needs_registration" as const,
      profile: {
        email: googleProfile.email,
        name: googleProfile.name,
        avatarUrl: googleProfile.picture
      }
    };
  }

  const normalizedSlug = await ensureWorkspaceAvailability(app, googleProfile.email, input.slug);
  const createdUser = await prisma.user.create({
    data: {
      email: googleProfile.email,
      name: googleProfile.name,
      avatarUrl: googleProfile.picture,
      googleSub: googleProfile.googleSub,
      emailVerifiedAt: new Date(),
      memberships: {
        create: {
          role: "owner",
          workspace: {
            create: buildWorkspaceSeed({
              workspaceName: input.workspaceName,
              slug: normalizedSlug,
              timezone: input.timezone,
              whatsapp: input.whatsapp
            })
          }
        }
      }
    },
    include: {
      memberships: {
        include: { workspace: true },
        orderBy: { workspace: { createdAt: "asc" } }
      }
    }
  });

  const session = await issueSession(app, createdUser.id);
  return {
    mode: "authenticated" as const,
    ...session,
    ...buildSessionPayload(createdUser as AuthenticatedUser)
  };
}

export async function getMe(userId: string) {
  const user = (await loadUserSession(userId)) as AuthenticatedUser;
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    avatarUrl: user.avatarUrl,
    emailVerifiedAt: user.emailVerifiedAt,
    workspaces: buildSessionPayload(user).workspaces
  };
}

export function getPublicAuthConfig() {
  return {
    googleEnabled: Boolean(env.GOOGLE_CLIENT_ID),
    googleClientId: env.GOOGLE_CLIENT_ID ?? null,
    emailPasswordEnabled: true,
    emailVerificationRequired: true
  };
}
