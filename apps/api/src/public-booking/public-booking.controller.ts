import { Body, Controller, Get, Param, Post } from "@nestjs/common";
import { IsString } from "class-validator";

class CreatePublicBookingDto {
  @IsString()
  clientName!: string;

  @IsString()
  phone!: string;

  @IsString()
  serviceId!: string;

  @IsString()
  startsAt!: string;
}

@Controller("public/bookings")
export class PublicBookingController {
  @Get(":slug")
  show(@Param("slug") slug: string) {
    return {
      slug,
      businessName: "Studio Jardins",
      services: [{ id: "svc-demo", name: "Corte premium", durationMinutes: 60 }]
    };
  }

  @Get(":slug/slots")
  slots(@Param("slug") slug: string) {
    return {
      slug,
      slots: ["2026-03-12T14:30:00.000Z", "2026-03-12T15:15:00.000Z"]
    };
  }

  @Post(":slug")
  create(@Param("slug") slug: string, @Body() body: CreatePublicBookingDto) {
    return {
      status: "accepted",
      slug,
      payload: body
    };
  }
}
