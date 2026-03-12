import { Module } from "@nestjs/common";
import {
  AppointmentsController,
  AvailabilityController,
  ClientsController,
  ServicesController,
  StaffController
} from "./catalog.controller";

@Module({
  controllers: [ServicesController, StaffController, ClientsController, AppointmentsController, AvailabilityController]
})
export class CatalogModule {}
