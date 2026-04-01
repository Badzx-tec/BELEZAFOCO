import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards
} from "@nestjs/common";
import { CsrfGuard } from "../auth/csrf.guard";
import { Roles } from "../auth/roles.decorator";
import { RolesGuard } from "../auth/roles.guard";
import { SessionAuthGuard } from "../auth/session-auth.guard";
import { WorkspaceId } from "../auth/workspace.decorator";
import { CreateStaffDto } from "./dto/create-staff.dto";
import { UpdateStaffDto } from "./dto/update-staff.dto";
import { StaffService } from "./staff.service";

@UseGuards(SessionAuthGuard, RolesGuard)
@Controller("me/staff")
export class StaffController {
  constructor(private readonly staffService: StaffService) {}

  @Get()
  list(@WorkspaceId() wid: string, @Query("includeInactive") includeInactive?: string) {
    return this.staffService.list(wid, includeInactive === "true");
  }

  @Get(":id")
  findOne(@WorkspaceId() wid: string, @Param("id") id: string) {
    return this.staffService.findOne(wid, id);
  }

  @Post()
  @UseGuards(CsrfGuard)
  @Roles("owner", "manager", "admin")
  create(@WorkspaceId() wid: string, @Body() dto: CreateStaffDto) {
    return this.staffService.create(wid, dto);
  }

  @Patch(":id")
  @UseGuards(CsrfGuard)
  @Roles("owner", "manager", "admin")
  update(@WorkspaceId() wid: string, @Param("id") id: string, @Body() dto: UpdateStaffDto) {
    return this.staffService.update(wid, id, dto);
  }

  @Delete(":id")
  @UseGuards(CsrfGuard)
  @Roles("owner", "manager", "admin")
  deactivate(@WorkspaceId() wid: string, @Param("id") id: string) {
    return this.staffService.deactivate(wid, id);
  }
}
