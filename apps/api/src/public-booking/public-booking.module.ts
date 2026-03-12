import { Module } from "@nestjs/common";
import { PublicBookingController } from "./public-booking.controller";

@Module({
  controllers: [PublicBookingController]
})
export class PublicBookingModule {}
