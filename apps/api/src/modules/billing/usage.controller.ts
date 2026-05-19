import { Controller, Get, UseGuards , Inject} from "@nestjs/common";
import { UsageService } from "./usage.service";
import { JwtAuthGuard } from "../auth/guards";
import { CurrentTenant } from "../auth/decorators";

@Controller("billing/usage")
@UseGuards(JwtAuthGuard)
export class UsageController {
  constructor(@Inject(UsageService) private usageService: UsageService) {}

  @Get()
  async getUsage(@CurrentTenant() tenant: any) {
    const data = await this.usageService.getUsage(tenant.id);
    return { success: true, data };
  }
}
