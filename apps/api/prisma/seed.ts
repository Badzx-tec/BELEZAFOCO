import { PrismaClient } from "@prisma/client";
import argon2 from "argon2";
import { addDays, addHours, setHours, setMinutes } from "date-fns";
import { randomUUID } from "node:crypto";

const prisma = new PrismaClient();

function atHour(date: Date, hour: number, minute = 0) {
  return setMinutes(setHours(date, hour), minute);
}

async function main() {
  const email = process.env.SEED_ADMIN_EMAIL ?? "admin@belezafoco.local";
  const password = process.env.SEED_ADMIN_PASSWORD ?? "12345678";
  const workspaceName = process.env.SEED_WORKSPACE_NAME ?? "Studio Inicial";
  const workspaceSlug = process.env.SEED_WORKSPACE_SLUG ?? "studio-inicial";
  const hash = await argon2.hash(password);

  const user = await prisma.user.upsert({
    where: { email },
    update: { passwordHash: hash, name: "Admin BELEZAFOCO", emailVerifiedAt: new Date() },
    create: { email, passwordHash: hash, name: "Admin BELEZAFOCO", emailVerifiedAt: new Date() }
  });

  const workspace = await prisma.workspace.upsert({
    where: { slug: workspaceSlug },
    update: {
      name: workspaceName,
      timezone: "America/Sao_Paulo",
      address: "Rua das Flores, 120 - Centro",
      whatsapp: "+5511999999999",
      description: "Agenda online, equipe organizada e lembretes automáticos para reduzir faltas.",
      bookingPolicy: "Chegue com 5 minutos de antecedência. Cancelamentos com menos de 24h podem gerar taxa.",
      brandPrimaryColor: "#111827",
      brandAccentColor: "#c26b36",
      onboardingStep: 6,
      onboardingCompletedAt: new Date()
    },
    create: {
      name: workspaceName,
      slug: workspaceSlug,
      timezone: "America/Sao_Paulo",
      address: "Rua das Flores, 120 - Centro",
      whatsapp: "+5511999999999",
      description: "Agenda online, equipe organizada e lembretes automáticos para reduzir faltas.",
      bookingPolicy: "Chegue com 5 minutos de antecedência. Cancelamentos com menos de 24h podem gerar taxa.",
      brandPrimaryColor: "#111827",
      brandAccentColor: "#c26b36",
      onboardingStep: 6,
      onboardingCompletedAt: new Date()
    }
  });

  await prisma.membership.upsert({
    where: { userId_workspaceId: { userId: user.id, workspaceId: workspace.id } },
    update: { role: "owner" },
    create: { userId: user.id, workspaceId: workspace.id, role: "owner" }
  });

  const trialEndsAt = addDays(new Date(), 14);
  await prisma.workspaceSubscription.upsert({
    where: { workspaceId: workspace.id },
    update: { plan: "trial", status: "trialing", paidUntil: trialEndsAt, trialEndsAt },
    create: { workspaceId: workspace.id, plan: "trial", status: "trialing", paidUntil: trialEndsAt, trialEndsAt }
  });

  await prisma.calendarBlock.deleteMany({ where: { workspaceId: workspace.id } });
  await prisma.appointment.deleteMany({ where: { workspaceId: workspace.id } });
  await prisma.waitlistEntry.deleteMany({ where: { workspaceId: workspace.id } });
  await prisma.messageTemplate.deleteMany({ where: { workspaceId: workspace.id } });
  await prisma.client.deleteMany({ where: { workspaceId: workspace.id } });
  await prisma.staffMember.deleteMany({ where: { workspaceId: workspace.id } });
  await prisma.service.deleteMany({ where: { workspaceId: workspace.id } });
  await prisma.resource.deleteMany({ where: { workspaceId: workspace.id } });
  await prisma.businessHour.deleteMany({ where: { workspaceId: workspace.id } });

  await prisma.businessHour.createMany({
    data: [
      { workspaceId: workspace.id, weekday: 1, startTime: "09:00", endTime: "19:00" },
      { workspaceId: workspace.id, weekday: 2, startTime: "09:00", endTime: "19:00" },
      { workspaceId: workspace.id, weekday: 3, startTime: "09:00", endTime: "19:00" },
      { workspaceId: workspace.id, weekday: 4, startTime: "09:00", endTime: "19:00" },
      { workspaceId: workspace.id, weekday: 5, startTime: "09:00", endTime: "19:00" },
      { workspaceId: workspace.id, weekday: 6, startTime: "09:00", endTime: "16:00" }
    ]
  });

  const [barberChair, estheticsRoom] = await Promise.all([
    prisma.resource.create({
      data: {
        workspaceId: workspace.id,
        name: "Cadeira Premium",
        type: "cadeira"
      }
    }),
    prisma.resource.create({
      data: {
        workspaceId: workspace.id,
        name: "Sala de estética 1",
        type: "sala"
      }
    })
  ]);

  const [haircut, beard, manicure, skin] = await Promise.all([
    prisma.service.create({
      data: {
        workspaceId: workspace.id,
        name: "Corte Premium",
        category: "Barbearia",
        description: "Corte com consultoria rápida de estilo e acabamento completo.",
        durationMinutes: 45,
        prepMinutes: 5,
        finishingMinutes: 10,
        bufferBeforeMinutes: 5,
        bufferAfterMinutes: 5,
        priceType: "fixed",
        priceValue: 5500,
        featured: true,
        displayOrder: 1,
        requiredResourceId: barberChair.id
      }
    }),
    prisma.service.create({
      data: {
        workspaceId: workspace.id,
        name: "Barba Terapia",
        category: "Barbearia",
        description: "Toalha quente, modelagem e finalização.",
        durationMinutes: 35,
        prepMinutes: 5,
        finishingMinutes: 5,
        priceType: "fixed",
        priceValue: 3500,
        displayOrder: 2,
        requiredResourceId: barberChair.id
      }
    }),
    prisma.service.create({
      data: {
        workspaceId: workspace.id,
        name: "Manicure em Gel",
        category: "Nail Design",
        description: "Alongamento e acabamento com esmaltação em gel.",
        durationMinutes: 75,
        prepMinutes: 10,
        finishingMinutes: 10,
        bufferAfterMinutes: 10,
        priceType: "starts_at",
        priceValue: 9000,
        depositEnabled: true,
        depositType: "fixed",
        depositValue: 2000,
        featured: true,
        displayOrder: 3
      }
    }),
    prisma.service.create({
      data: {
        workspaceId: workspace.id,
        name: "Limpeza de Pele Premium",
        category: "Estética",
        description: "Sessão completa com extração, máscara calmante e orientação pós-atendimento.",
        durationMinutes: 90,
        prepMinutes: 10,
        finishingMinutes: 10,
        priceType: "fixed",
        priceValue: 15000,
        depositEnabled: true,
        depositType: "percent",
        depositValue: 20,
        displayOrder: 4,
        requiredResourceId: estheticsRoom.id
      }
    })
  ]);

  const [joao, camila, bruna] = await Promise.all([
    prisma.staffMember.create({
      data: {
        workspaceId: workspace.id,
        name: "João Silva",
        bio: "Barbeiro especialista em corte social e barba desenhada.",
        contact: "+5511988881111",
        colorHex: "#2563eb",
        commissionPercent: 40,
        staffServices: {
          createMany: {
            data: [{ serviceId: haircut.id }, { serviceId: beard.id }]
          }
        },
        availabilities: {
          createMany: {
            data: [
              { weekday: 1, startTime: "09:00", endTime: "19:00" },
              { weekday: 2, startTime: "09:00", endTime: "19:00" },
              { weekday: 3, startTime: "09:00", endTime: "19:00" },
              { weekday: 4, startTime: "09:00", endTime: "19:00" },
              { weekday: 5, startTime: "09:00", endTime: "19:00" },
              { weekday: 6, startTime: "09:00", endTime: "15:00" }
            ]
          }
        }
      }
    }),
    prisma.staffMember.create({
      data: {
        workspaceId: workspace.id,
        name: "Camila Rocha",
        bio: "Nail designer com foco em alongamento e manutenção recorrente.",
        contact: "+5511988882222",
        colorHex: "#be185d",
        commissionPercent: 45,
        staffServices: {
          createMany: {
            data: [{ serviceId: manicure.id }]
          }
        },
        availabilities: {
          createMany: {
            data: [
              { weekday: 1, startTime: "10:00", endTime: "19:00" },
              { weekday: 2, startTime: "10:00", endTime: "19:00" },
              { weekday: 3, startTime: "10:00", endTime: "19:00" },
              { weekday: 4, startTime: "10:00", endTime: "19:00" },
              { weekday: 5, startTime: "10:00", endTime: "19:00" }
            ]
          }
        }
      }
    }),
    prisma.staffMember.create({
      data: {
        workspaceId: workspace.id,
        name: "Bruna Costa",
        bio: "Esteticista com agenda focada em tratamentos faciais e recorrência.",
        contact: "+5511988883333",
        colorHex: "#0f766e",
        commissionPercent: 35,
        staffServices: {
          createMany: {
            data: [{ serviceId: skin.id }]
          }
        },
        availabilities: {
          createMany: {
            data: [
              { weekday: 2, startTime: "09:00", endTime: "18:00" },
              { weekday: 3, startTime: "09:00", endTime: "18:00" },
              { weekday: 4, startTime: "09:00", endTime: "18:00" },
              { weekday: 5, startTime: "09:00", endTime: "18:00" },
              { weekday: 6, startTime: "09:00", endTime: "14:00" }
            ]
          }
        }
      }
    })
  ]);

  await prisma.messageTemplate.createMany({
    data: [
      {
        workspaceId: workspace.id,
        type: "reminder_24h",
        templateName: "lembrete_24h",
        body: "Olá {{clientName}}, lembrando seu horário amanhã às {{time}}."
      },
      {
        workspaceId: workspace.id,
        type: "reminder_2h",
        templateName: "lembrete_2h",
        body: "Seu atendimento começa em 2 horas."
      }
    ]
  });

  const [clienteAna, clientePedro, clienteMarina] = await Promise.all([
    prisma.client.create({
      data: {
        workspaceId: workspace.id,
        name: "Ana Paula",
        whatsapp: "+5511977771111",
        email: "ana@example.com",
        whatsappOptInAt: new Date(),
        whatsappOptInMethod: "seed"
      }
    }),
    prisma.client.create({
      data: {
        workspaceId: workspace.id,
        name: "Pedro Gomes",
        whatsapp: "+5511977772222",
        email: "pedro@example.com",
        whatsappOptInAt: new Date(),
        whatsappOptInMethod: "seed"
      }
    }),
    prisma.client.create({
      data: {
        workspaceId: workspace.id,
        name: "Marina Souza",
        whatsapp: "+5511977773333",
        email: "marina@example.com",
        whatsappOptInAt: new Date(),
        whatsappOptInMethod: "seed"
      }
    })
  ]);

  const today = new Date();
  const tomorrow = addDays(today, 1);

  await prisma.calendarBlock.create({
    data: {
      workspaceId: workspace.id,
      scope: "workspace",
      type: "break",
      title: "Intervalo do almoço",
      startAt: atHour(today, 12, 0),
      endAt: atHour(today, 13, 0)
    }
  });

  await prisma.appointment.createMany({
    data: [
      {
        workspaceId: workspace.id,
        serviceId: haircut.id,
        staffMemberId: joao.id,
        resourceId: barberChair.id,
        clientId: clientePedro.id,
        source: "public_page",
        status: "confirmed",
        startAt: atHour(today, 10, 0),
        endAt: atHour(today, 10, 55),
        confirmedAt: new Date(),
        cancelToken: randomUUID()
      },
      {
        workspaceId: workspace.id,
        serviceId: manicure.id,
        staffMemberId: camila.id,
        clientId: clienteAna.id,
        source: "public_page",
        status: "pending_payment",
        startAt: atHour(today, 14, 0),
        endAt: atHour(today, 15, 25),
        depositAmount: 2000,
        depositProvider: "mercado_pago",
        depositStatus: "pending",
        paymentExpiresAt: addHours(new Date(), 2),
        cancelToken: randomUUID()
      },
      {
        workspaceId: workspace.id,
        serviceId: skin.id,
        staffMemberId: bruna.id,
        resourceId: estheticsRoom.id,
        clientId: clienteMarina.id,
        source: "internal_dashboard",
        status: "confirmed",
        startAt: atHour(tomorrow, 11, 0),
        endAt: atHour(tomorrow, 12, 40),
        confirmedAt: new Date(),
        cancelToken: randomUUID()
      }
    ]
  });

  const pendingAppointment = await prisma.appointment.findFirstOrThrow({
    where: {
      workspaceId: workspace.id,
      status: "pending_payment"
    }
  });

  await prisma.payment.create({
    data: {
      appointmentId: pendingAppointment.id,
      provider: "mercado_pago",
      externalId: `seed_mp_${pendingAppointment.id}`,
      amount: 2000,
      status: "pending",
      qrCode: "data:image/png;base64,SEED",
      pixCopyPaste: "0002012636SEEDPIX",
      expiresAt: addHours(new Date(), 2),
      idempotencyKey: pendingAppointment.id
    }
  });
}

main()
  .finally(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
