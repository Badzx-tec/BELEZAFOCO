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
import { AppointmentsService } from "./appointments.service";
import { CreateAppointmentDto } from "./dto/create-appointment.dto";
import { ListAppointmentsDto } from "./dto/list-appointments.dto";
import { UpdateStatusDto } from "./dto/update-status.dto";

@UseGuards(SessionAuthGuard)
@Controller("me/appointments")
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  @Get()
  list(@WorkspaceId() wid: string, @Query() query: ListAppointmentsDto) {
    return this.appointmentsService.list(wid, query);
  }

  @Get(":id")
  findOne(@WorkspaceId() wid: string, @Param("id") id: string) {
    return this.appointmentsService.findOne(wid, id);
  }

  @Post()
  @UseGuards(CsrfGuard)
  create(@WorkspaceId() wid: string, @Body() dto: CreateAppointmentDto) {
    return this.appointmentsService.create(wid, dto);
  }

  @Patch(":id/status")
  @UseGuards(CsrfGuard)
  updateStatus(
    @WorkspaceId() wid: string,
    @Param("id") id: string,
    @Body() dto: UpdateStatusDto
  ) {
    return this.appointmentsService.updateStatus(wid, id, dto);
  }
}
