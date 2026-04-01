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
import { CreateServiceDto } from "./dto/create-service.dto";
import { UpdateServiceDto } from "./dto/update-service.dto";
import { ServicesService } from "./services.service";

@UseGuards(SessionAuthGuard, RolesGuard)
@Controller("me/services")
export class ServicesController {
  constructor(private readonly services: ServicesService) {}

  @Get()
  list(
    @WorkspaceId() wid: string,
    @Query("page") page?: string,
    @Query("limit") limit?: string,
    @Query("includeInactive") includeInactive?: string
  ) {
    return this.services.list(
      wid,
      page ? Number(page) : 1,
      limit ? Number(limit) : 50,
      includeInactive === "true"
    );
  }

  @Get(":id")
  findOne(@WorkspaceId() wid: string, @Param("id") id: string) {
    return this.services.findOne(wid, id);
  }

  @Post()
  @UseGuards(CsrfGuard)
  @Roles("owner", "manager", "admin")
  create(@WorkspaceId() wid: string, @Body() dto: CreateServiceDto) {
    return this.services.create(wid, dto);
  }

  @Patch(":id")
  @UseGuards(CsrfGuard)
  @Roles("owner", "manager", "admin")
  update(@WorkspaceId() wid: string, @Param("id") id: string, @Body() dto: UpdateServiceDto) {
    return this.services.update(wid, id, dto);
  }

  @Delete(":id")
  @UseGuards(CsrfGuard)
  @Roles("owner", "manager", "admin")
  deactivate(@WorkspaceId() wid: string, @Param("id") id: string) {
    return this.services.deactivate(wid, id);
  }
}
