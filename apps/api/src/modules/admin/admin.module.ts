import { PrismaModule } from "../../prisma/prisma.module";
import { Module } from "@nestjs/common";
import { TenantsController } from "./tenants.controller";
import { TenantsService } from "./tenants.service";
import { PlansController } from "./plans.controller";
import { PlansService } from "./plans.service";
import { AIConfigController } from "./ai-config.controller";
import { AnalyticsController } from "./analytics.controller";
import { SupportTicketsController, AuditLogsController, FeatureFlagsController } from "./admin-misc.controllers";

import { AdminResellersController } from "./resellers.controller";
import { AdminResellersService } from "./resellers.service";
import { SystemConfigController } from "./system-config.controller";

@Module({
  imports: [PrismaModule],
  controllers: [
    TenantsController,
    PlansController,
    AIConfigController,
    AnalyticsController,
    SupportTicketsController,
    AuditLogsController,
    FeatureFlagsController,
    AdminResellersController,
    SystemConfigController,
  ],
  providers: [
    TenantsService,
    PlansService,
    AdminResellersService,
  ],
})
export class AdminModule {}
