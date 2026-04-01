import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  UseGuards
} from "@nestjs/common";
import { CsrfGuard } from "../auth/csrf.guard";
import { Roles } from "../auth/roles.decorator";
import { RolesGuard } from "../auth/roles.guard";
import { SessionAuthGuard } from "../auth/session-auth.guard";
import { WorkspaceId } from "../auth/workspace.decorator";
import { AvailabilityService } from "./availability.service";
import { CreateExceptionDto } from "./dto/create-exception.dto";
import { CreateRuleDto } from "./dto/create-rule.dto";
import { QuerySlotsDto } from "./dto/query-slots.dto";

@UseGuards(SessionAuthGuard)
@Controller("me/availability")
export class AvailabilityController {
  constructor(private readonly availabilityService: AvailabilityService) {}

  // ── Rules ──────────────────────────────────────────────────────────────────

  @UseGuards(RolesGuard)
  @Get("rules")
  listRules(@WorkspaceId() wid: string, @Query("staffProfileId") staffProfileId?: string) {
    return this.availabilityService.listRules(wid, staffProfileId);
  }

  @UseGuards(RolesGuard)
  @Post("rules")
  @UseGuards(CsrfGuard)
  @Roles("owner", "manager", "admin")
  createRule(@WorkspaceId() wid: string, @Body() dto: CreateRuleDto) {
    return this.availabilityService.createRule(wid, dto);
  }

  @UseGuards(RolesGuard)
  @Delete("rules/:id")
  @UseGuards(CsrfGuard)
  @Roles("owner", "manager", "admin")
  deleteRule(@WorkspaceId() wid: string, @Param("id") id: string) {
    return this.availabilityService.deleteRule(wid, id);
  }

  // ── Exceptions ─────────────────────────────────────────────────────────────

  @UseGuards(RolesGuard)
  @Get("exceptions")
  listExceptions(@WorkspaceId() wid: string, @Query("staffProfileId") staffProfileId?: string) {
    return this.availabilityService.listExceptions(wid, staffProfileId);
  }

  @UseGuards(RolesGuard)
  @Post("exceptions")
  @UseGuards(CsrfGuard)
  @Roles("owner", "manager", "admin")
  createException(@WorkspaceId() wid: string, @Body() dto: CreateExceptionDto) {
    return this.availabilityService.createException(wid, dto);
  }

  @UseGuards(RolesGuard)
  @Delete("exceptions/:id")
  @UseGuards(CsrfGuard)
  @Roles("owner", "manager", "admin")
  deleteException(@WorkspaceId() wid: string, @Param("id") id: string) {
    return this.availabilityService.deleteException(wid, id);
  }

  // ── Slots ──────────────────────────────────────────────────────────────────

  @Get("slots")
  getSlots(@WorkspaceId() wid: string, @Query() query: QuerySlotsDto) {
    return this.availabilityService.getAvailableSlots(wid, query);
  }
}
