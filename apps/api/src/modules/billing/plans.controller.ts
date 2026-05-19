import { Controller, Get , Inject} from "@nestjs/common";
import { PlansService } from "./plans.service";

@Controller("billing/plans")
export class PlansController {
  constructor(@Inject(PlansService) private plansService: PlansService) {}

  @Get()
  async findAll() {
    const data = await this.plansService.findAll();
    return { success: true, data };
  }
}
