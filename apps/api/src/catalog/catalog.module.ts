import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import {
  AppointmentsController,
  AvailabilityController,
  ClientsController,
  ServicesController,
  StaffController
} from "./catalog.controller";

@Module({
  imports: [AuthModule],
  controllers: [ServicesController, StaffController, ClientsController, AppointmentsController, AvailabilityController]
})
export class CatalogModule {}
