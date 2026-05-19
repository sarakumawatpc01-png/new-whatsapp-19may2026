import { 
  Controller, 
  Post, 
  Get, 
  Delete, 
  Body, 
  Query, 
  Param, 
  Req, 
  HttpStatus, 
  HttpCode,
  UseGuards,
  Logger,
  ForbiddenException,
  Inject,
  RawBodyRequest,
} from "@nestjs/common";
import { WhatsAppService } from "./whatsapp.service";
import { Public } from "../auth/decorators";
import { JwtAuthGuard } from "../auth/guards";
import { CurrentTenant } from "../auth/decorators";
import type { Request } from "express";

@Controller()
export class WhatsAppController {
  private readonly logger = new Logger(WhatsAppController.name);

  constructor(@Inject(WhatsAppService) private whatsappService: WhatsAppService) {}

  @Public()
  @Get("webhooks/whatsapp/:tenantId")
  async verifyWebhook(
    @Query("hub.mode") mode: string,
    @Query("hub.verify_token") token: string,
    @Query("hub.challenge") challenge: string
  ) {
    if (mode === "subscribe") {
      return this.whatsappService.verifyWebhook(token, challenge);
    }
    return "OK";
  }

  @Public()
  @Post("webhooks/whatsapp/:tenantId")
  @HttpCode(HttpStatus.OK)
  async handleWebhook(
    @Param("tenantId") tenantId: string,
    @Req() req: RawBodyRequest<Request>,
    @Body() payload: any
  ) {
    const signature = req.headers["x-hub-signature-256"] as string;
    
    // Use raw body buffer for HMAC validation (not parsed JSON)
    const rawBody = req.rawBody || Buffer.from(JSON.stringify(payload));
    
    if (!this.whatsappService.validateSignature(signature, rawBody)) {
      this.logger.warn(`Invalid webhook signature for tenant ${tenantId}`);
      throw new ForbiddenException("Invalid signature");
    }

    // Return 200 immediately, process asynchronously via queue
    await this.whatsappService.handleWebhook(tenantId, payload);
    return { success: true };
  }

  @UseGuards(JwtAuthGuard)
  @Post("whatsapp/connect")
  async connect(
    @CurrentTenant() tenant: any,
    @Body() body: { code: string; wabaId: string; phoneNumberId: string }
  ) {
    const number = await this.whatsappService.connect(tenant.id, body.code, body.wabaId, body.phoneNumberId);
    return { success: true, data: number };
  }

  @UseGuards(JwtAuthGuard)
  @Get("whatsapp/numbers")
  async listNumbers(@CurrentTenant() tenant: any) {
    const numbers = await this.whatsappService.listNumbers(tenant.id);
    return { success: true, data: numbers };
  }

  @UseGuards(JwtAuthGuard)
  @Delete("whatsapp/numbers/:id")
  async disconnect(@CurrentTenant() tenant: any, @Param("id") id: string) {
    await this.whatsappService.disconnect(tenant.id, id);
    return { success: true };
  }

  @UseGuards(JwtAuthGuard)
  @Get("whatsapp/numbers/:id/health")
  async getHealth(@CurrentTenant() tenant: any, @Param("id") id: string) {
    const health = await this.whatsappService.getHealth(tenant.id, id);
    return { success: true, data: health };
  }
}
