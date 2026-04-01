import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards
} from "@nestjs/common";
import { CsrfGuard } from "../auth/csrf.guard";
import { SessionAuthGuard } from "../auth/session-auth.guard";
import { WorkspaceId } from "../auth/workspace.decorator";
import { ClientsService } from "./clients.service";
import { CreateClientDto } from "./dto/create-client.dto";
import { UpdateClientDto } from "./dto/update-client.dto";

@UseGuards(SessionAuthGuard)
@Controller("me/clients")
export class ClientsController {
  constructor(private readonly clientsService: ClientsService) {}

  @Get()
  list(
    @WorkspaceId() wid: string,
    @Query("page") page?: string,
    @Query("limit") limit?: string,
    @Query("q") q?: string
  ) {
    return this.clientsService.list(
      wid,
      page ? Number(page) : 1,
      limit ? Number(limit) : 50,
      q
    );
  }

  @Get(":id")
  findOne(@WorkspaceId() wid: string, @Param("id") id: string) {
    return this.clientsService.findOne(wid, id);
  }

  @Post()
  @UseGuards(CsrfGuard)
  create(@WorkspaceId() wid: string, @Body() dto: CreateClientDto) {
    return this.clientsService.create(wid, dto);
  }

  @Patch(":id")
  @UseGuards(CsrfGuard)
  update(@WorkspaceId() wid: string, @Param("id") id: string, @Body() dto: UpdateClientDto) {
    return this.clientsService.update(wid, id, dto);
  }
}
