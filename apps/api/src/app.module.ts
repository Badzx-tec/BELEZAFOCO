import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { ThrottlerModule, ThrottlerGuard } from "@nestjs/throttler";
import { APP_GUARD } from "@nestjs/core";
import { AuthModule } from "./auth/auth.module";
import { AuditModule } from "./audit/audit.module";
import { AvailabilityModule } from "./availability/availability.module";
import { AppointmentsModule } from "./appointments/appointments.module";
import { BillingModule } from "./billing/billing.module";
import { CatalogModule } from "./catalog/catalog.module";
import { ClientsModule } from "./clients/clients.module";
import { FilesModule } from "./files/files.module";
import { FinanceModule } from "./finance/finance.module";
import { HealthModule } from "./health/health.module";
import { GoogleIntegrationModule } from "./integrations/google/google.module";
import { MercadoPagoIntegrationModule } from "./integrations/mercadopago/mercadopago.module";
import { WhatsAppIntegrationModule } from "./integrations/whatsapp/whatsapp.module";
import { MeModule } from "./me/me.module";
import { MembershipsModule } from "./memberships/memberships.module";
import { PaymentsModule } from "./payments/payments.module";
import { PublicBookingModule } from "./public-booking/public-booking.module";
import { RemindersModule } from "./reminders/reminders.module";
import { ReportsModule } from "./reports/reports.module";
import { SettingsModule } from "./settings/settings.module";
import { ServicesModule } from "./services/services.module";
import { StaffModule } from "./staff/staff.module";
import { UsersModule } from "./users/users.module";
import { WebhooksModule } from "./webhooks/webhooks.module";
import { WorkspacesModule } from "./workspaces/workspaces.module";
import { DatabaseModule } from "./database/database.module";
import { MailModule } from "./mail/mail.module";
import { RedisModule } from "./redis/redis.module";

@Module({
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard }
  ],
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      expandVariables: true
    }),
    ThrottlerModule.forRoot({
      throttlers: [{ ttl: 60_000, limit: 60 }]
    }),
    DatabaseModule,
    RedisModule,
    MailModule,
    HealthModule,
    AuthModule,
    MeModule,
    CatalogModule,
    ServicesModule,
    StaffModule,
    ClientsModule,
    AppointmentsModule,
    AvailabilityModule,
    WorkspacesModule,
    UsersModule,
    MembershipsModule,
    RemindersModule,
    PublicBookingModule,
    PaymentsModule,
    BillingModule,
    FinanceModule,
    ReportsModule,
    AuditModule,
    FilesModule,
    SettingsModule,
    GoogleIntegrationModule,
    WhatsAppIntegrationModule,
    MercadoPagoIntegrationModule,
    WebhooksModule
  ]
})
export class AppModule {}
