import { Controller, Get, Param, Query, Res, UseGuards , Inject} from "@nestjs/common";
import { InvoicesService } from "./invoices.service";
import { JwtAuthGuard } from "../auth/guards";
import { CurrentTenant } from "../auth/decorators";
import type { Response } from "express";

@Controller("billing/invoices")
@UseGuards(JwtAuthGuard)
export class InvoicesController {
  constructor(@Inject(InvoicesService) private invoicesService: InvoicesService) {}

  @Get()
  async findAll(@CurrentTenant() tenant: any, @Query() query: any) {
    const data = await this.invoicesService.findAll(tenant.id, query);
    return { success: true, ...data };
  }

  @Get(":id")
  async findOne(@CurrentTenant() tenant: any, @Param("id") id: string) {
    const data = await this.invoicesService.findOne(tenant.id, id);
    return { success: true, data };
  }

  @Get(":id/pdf")
  async downloadPdf(
    @CurrentTenant() tenant: any,
    @Param("id") id: string,
    @Res() res: Response
  ) {
    const buffer = await this.invoicesService.generatePdf(tenant.id, id);
    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename=invoice-${id}.pdf`,
      "Content-Length": buffer.length,
    });
    res.end(buffer);
  }
}
