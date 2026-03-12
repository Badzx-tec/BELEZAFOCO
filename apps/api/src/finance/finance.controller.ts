import {
  Controller,
  Get,
  Post,
  UseGuards
} from "@nestjs/common";
import { CsrfGuard } from "../auth/csrf.guard";
import { Roles } from "../auth/roles.decorator";
import { RolesGuard } from "../auth/roles.guard";
import { SessionAuthGuard } from "../auth/session-auth.guard";

@UseGuards(SessionAuthGuard, RolesGuard)
@Roles("owner", "manager", "admin")
@Controller("me/finance")
export class FinanceController {
  @Get("dashboard")
  dashboard() {
    return {
      receivedTodayCents: 284000,
      expectedCashCents: 792000,
      delinquencyCents: 32000
    };
  }

  @Get("ledger")
  ledger() {
    return [{ id: "led-demo", kind: "receivable", amountCents: 32000, status: "settled" }];
  }

  @Get("receivables")
  receivables() {
    return [{ id: "rec-demo", amountCents: 32000, status: "pending" }];
  }

  @Get("payables")
  payables() {
    return [{ id: "pay-demo", amountCents: 14200, status: "pending" }];
  }

  @Get("commissions")
  commissions() {
    return [{ id: "com-demo", staffProfileId: "stf-demo", amountCents: 14200 }];
  }

  @Get("export.csv")
  exportCsv() {
    return {
      status: "accepted",
      format: "csv",
      message: "Export pipeline scaffolded"
    };
  }

  @Post("cash-sessions")
  @UseGuards(CsrfGuard)
  createCashSession() {
    return {
      status: "accepted",
      resource: "cash-session"
    };
  }
}
