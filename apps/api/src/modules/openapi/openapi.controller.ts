import { Controller, Get, Post, Body, UseGuards, Req , Inject} from "@nestjs/common";
import { ApiAuthGuard } from "../auth/guards";
import { PrismaService } from "../../prisma/prisma.service";

@Controller("openapi")
@UseGuards(ApiAuthGuard)
export class OpenApiController {
  constructor(@Inject(PrismaService) private prisma: PrismaService) {}

  @Get("me")
  async getMe(@Req() req: any) {
    const tenant = req.tenant;
    return {
      success: true,
      data: {
        id: tenant.id,
        name: tenant.name,
      }
    };
  }

  @Post("contacts")
  async createContact(@Req() req: any, @Body() body: any) {
    const tenant = req.tenant;
    const { phone, name, email } = body;
    
    const contact = await this.prisma.contact.create({
      data: {
        tenantId: tenant.id,
        phone,
        name,
        email,
      }
    });

    return { success: true, data: contact };
  }

  @Get("contacts")
  async getContacts(@Req() req: any) {
    const tenant = req.tenant;
    const contacts = await this.prisma.contact.findMany({
      where: { tenantId: tenant.id },
      take: 50,
      orderBy: { createdAt: "desc" }
    });

    return { success: true, data: contacts };
  }
}
