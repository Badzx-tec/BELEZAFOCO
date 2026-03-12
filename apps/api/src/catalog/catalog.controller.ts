import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards
} from "@nestjs/common";
import { IsBoolean, IsInt, IsOptional, IsString, Min } from "class-validator";
import { CsrfGuard } from "../auth/csrf.guard";
import { Roles } from "../auth/roles.decorator";
import { RolesGuard } from "../auth/roles.guard";
import { SessionAuthGuard } from "../auth/session-auth.guard";

class ServiceDto {
  @IsString()
  name!: string;

  @IsInt()
  @Min(1)
  durationMinutes!: number;
}

class StaffDto {
  @IsString()
  displayName!: string;
}

class ClientDto {
  @IsString()
  fullName!: string;

  @IsOptional()
  @IsBoolean()
  communicationConsent?: boolean;
}

class AppointmentDto {
  @IsString()
  serviceId!: string;

  @IsString()
  staffProfileId!: string;

  @IsString()
  clientId!: string;

  @IsString()
  startsAt!: string;
}

class AvailabilityRuleDto {
  @IsInt()
  dayOfWeek!: number;

  @IsString()
  startTime!: string;

  @IsString()
  endTime!: string;
}

class AvailabilityExceptionDto {
  @IsString()
  startsAt!: string;

  @IsString()
  endsAt!: string;

  @IsOptional()
  @IsString()
  reason?: string;
}

@UseGuards(SessionAuthGuard, RolesGuard)
@Controller("me/services")
export class ServicesController {
  @Get()
  list() {
    return [{ id: "svc-demo", name: "Corte premium", durationMinutes: 60 }];
  }

  @Post()
  @UseGuards(CsrfGuard)
  @Roles("owner", "manager", "admin")
  create(@Body() body: ServiceDto) {
    return { status: "accepted", resource: "service", payload: body };
  }

  @Patch(":id")
  @UseGuards(CsrfGuard)
  @Roles("owner", "manager", "admin")
  update(@Param("id") id: string, @Body() body: ServiceDto) {
    return { status: "accepted", id, payload: body };
  }
}

@UseGuards(SessionAuthGuard, RolesGuard)
@Controller("me/staff")
export class StaffController {
  @Get()
  list() {
    return [{ id: "stf-demo", displayName: "Bruno Silva" }];
  }

  @Post()
  @UseGuards(CsrfGuard)
  @Roles("owner", "manager", "admin")
  create(@Body() body: StaffDto) {
    return { status: "accepted", resource: "staff", payload: body };
  }

  @Patch(":id")
  @UseGuards(CsrfGuard)
  @Roles("owner", "manager", "admin")
  update(@Param("id") id: string, @Body() body: StaffDto) {
    return { status: "accepted", id, payload: body };
  }
}

@UseGuards(SessionAuthGuard)
@Controller("me/clients")
export class ClientsController {
  @Get()
  list() {
    return [{ id: "cli-demo", fullName: "Ana Luiza Silva" }];
  }

  @Post()
  @UseGuards(CsrfGuard)
  create(@Body() body: ClientDto) {
    return { status: "accepted", resource: "client", payload: body };
  }

  @Patch(":id")
  @UseGuards(CsrfGuard)
  update(@Param("id") id: string, @Body() body: ClientDto) {
    return { status: "accepted", id, payload: body };
  }
}

@UseGuards(SessionAuthGuard)
@Controller("me/appointments")
export class AppointmentsController {
  @Get()
  list() {
    return [{ id: "apt-demo", status: "confirmed", startsAt: new Date().toISOString() }];
  }

  @Post()
  @UseGuards(CsrfGuard)
  create(@Body() body: AppointmentDto) {
    return { status: "accepted", resource: "appointment", payload: body };
  }

  @Patch(":id")
  @UseGuards(CsrfGuard)
  update(@Param("id") id: string, @Body() body: AppointmentDto) {
    return { status: "accepted", id, payload: body };
  }
}

@UseGuards(SessionAuthGuard)
@Controller("me/availability")
export class AvailabilityController {
  @Get()
  list() {
    return {
      rules: [{ id: "avr-demo", dayOfWeek: 1, startTime: "09:00", endTime: "18:00" }],
      exceptions: []
    };
  }

  @Post("rules")
  @UseGuards(CsrfGuard)
  createRule(@Body() body: AvailabilityRuleDto) {
    return { status: "accepted", resource: "availability-rule", payload: body };
  }

  @Post("exceptions")
  @UseGuards(CsrfGuard)
  createException(@Body() body: AvailabilityExceptionDto) {
    return { status: "accepted", resource: "availability-exception", payload: body };
  }
}
