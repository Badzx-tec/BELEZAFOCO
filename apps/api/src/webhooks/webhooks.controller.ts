import { Body, Controller, Get, Headers, Post, Query } from "@nestjs/common";
import { SkipThrottle } from "@nestjs/throttler";

@SkipThrottle()
@Controller("webhooks")
export class WebhooksController {
  @Post("mercadopago")
  mercadoPago(@Headers("x-signature") signature: string | undefined, @Body() body: unknown) {
    return {
      status: "accepted",
      provider: "mercadopago",
      signaturePresent: Boolean(signature),
      payload: body
    };
  }

  @Get("whatsapp")
  whatsappVerify(@Query() query: Record<string, string | string[] | undefined>) {
    return {
      mode: query["hub.mode"],
      challenge: query["hub.challenge"],
      verifyToken: query["hub.verify_token"]
    };
  }

  @Post("whatsapp")
  whatsappNotify(@Body() body: unknown) {
    return {
      status: "accepted",
      provider: "whatsapp",
      payload: body
    };
  }
}
