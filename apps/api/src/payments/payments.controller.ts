import { Body, Controller, Get, Param, Post, UseGuards } from "@nestjs/common";
import { CsrfGuard } from "../auth/csrf.guard";
import { SessionAuthGuard } from "../auth/session-auth.guard";
import { WorkspaceId } from "../auth/workspace.decorator";
import { CreatePixPaymentDto } from "./dto/create-pix-payment.dto";
import { PaymentsService } from "./payments.service";

@UseGuards(SessionAuthGuard)
@Controller("me/payments")
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post("pix")
  @UseGuards(CsrfGuard)
  createPix(@WorkspaceId() wid: string, @Body() dto: CreatePixPaymentDto) {
    return this.paymentsService.createPixPayment(wid, dto);
  }

  @Get(":id")
  getPayment(@WorkspaceId() wid: string, @Param("id") id: string) {
    return this.paymentsService.getPayment(wid, id);
  }
}
