import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  Get,
  Headers,
  Logger,
  Post,
  Query,
  Req,
  Res
} from "@nestjs/common";
import { SkipThrottle } from "@nestjs/throttler";
import type { Request, Response } from "express";
import { MercadoPagoService } from "../integrations/mercadopago/mercadopago.service";
import { PaymentsService } from "../payments/payments.service";

interface MpWebhookBody {
  action?: string;
  data?: { id?: string };
  id?: string;
}

@SkipThrottle()
@Controller("webhooks")
export class WebhooksController {
  private readonly logger = new Logger(WebhooksController.name);

  constructor(
    private readonly mp: MercadoPagoService,
    private readonly paymentsService: PaymentsService
  ) {}

  @Post("mercadopago")
  async mercadoPago(
    @Headers("x-signature") xSignature: string | undefined,
    @Headers("x-request-id") xRequestId: string | undefined,
    @Query("data.id") dataId: string | undefined,
    @Body() body: MpWebhookBody,
    @Req() req: Request
  ) {
    if (xSignature && dataId) {
      const parts: Record<string, string> = {};
      for (const part of xSignature.split(",")) {
        const [k, v] = part.trim().split("=");
        if (k && v) parts[k] = v;
      }
      const ts = parts["ts"];
      const v1 = parts["v1"];
      if (ts && v1) {
        const valid = this.mp.validateWebhookSignature({
          ts,
          v1,
          dataId,
          requestId: xRequestId ?? ""
        });
        if (!valid) {
          this.logger.warn(`Invalid MP webhook signature from ${req.ip}`);
          throw new ForbiddenException("Invalid webhook signature");
        }
      }
    }

    const notificationDataId = dataId ?? String(body.data?.id ?? body.id ?? "");
    if (!notificationDataId) throw new BadRequestException("Missing data.id");

    const action = body.action;
    if (action === "payment.updated" || action === "payment.created") {
      try {
        const statusResult = await this.mp.getPaymentStatus(notificationDataId);
        await this.paymentsService.reconcilePayment(notificationDataId, statusResult.status);
        this.logger.log(`MP payment ${notificationDataId} reconciled: ${statusResult.status}`);
      } catch (err) {
        this.logger.error(`Failed to reconcile MP payment ${notificationDataId}`, err);
        // Return 200 — let MP handle retries on genuine failures
      }
    }

    return { ok: true };
  }

  @Get("whatsapp")
  whatsappVerify(
    @Query("hub.mode") mode: string | undefined,
    @Query("hub.verify_token") verifyToken: string | undefined,
    @Query("hub.challenge") challenge: string | undefined,
    @Res() res: Response
  ) {
    const expected = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN;
    if (mode === "subscribe" && verifyToken && expected && verifyToken === expected) {
      res.status(200).send(challenge ?? "");
      return;
    }
    throw new ForbiddenException("Verification failed");
  }

  @Post("whatsapp")
  whatsappNotify(@Body() body: unknown) {
    this.logger.log("WhatsApp webhook received");
    return { ok: true };
  }
}
