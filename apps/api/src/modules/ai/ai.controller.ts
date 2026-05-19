import { 
  Controller, 
  Get, 
  Post, 
  Put, 
  Delete,
  Body, 
  Param, 
  Query,
  UseGuards 
, Inject} from "@nestjs/common";
import { AIService } from "./ai.service";
import { JwtAuthGuard } from "../auth/guards";
import { CurrentTenant } from "../auth/decorators";

@Controller("ai")
@UseGuards(JwtAuthGuard)
export class AIController {
  constructor(@Inject(AIService) private aiService: AIService) {}

  @Get("config")
  async getConfig(@CurrentTenant() tenant: any) {
    const data = await this.aiService.getConfig(tenant.id);
    return { success: true, data };
  }

  @Put("config")
  async updateConfig(@CurrentTenant() tenant: any, @Body() body: any) {
    const data = await this.aiService.updateConfig(tenant.id, body);
    return { success: true, data };
  }

  @Get("providers")
  async getProviders() {
    const data = await this.aiService.getProviders();
    return { success: true, data };
  }

  @Get("models")
  async getModels(@CurrentTenant() tenant: any, @Query("provider") provider: string) {
    const data = await this.aiService.getModels(provider, tenant.id);
    return { success: true, data };
  }

  @Post("test")
  async testConfig(@CurrentTenant() tenant: any, @Body("message") message: string) {
    const data = await this.aiService.testConfig(tenant.id, message);
    return { success: true, data };
  }

  @Get("usage")
  async getUsage(@CurrentTenant() tenant: any) {
    const data = await this.aiService.getUsage(tenant.id);
    return { success: true, data };
  }

  @Post("conversations/:id/suggest")
  async suggest(@CurrentTenant() tenant: any, @Param("id") id: string) {
    const data = await this.aiService.getSuggestions(tenant.id, id);
    return { success: true, data };
  }

  @Post("conversations/:id/summarize")
  async summarize(@CurrentTenant() tenant: any, @Param("id") id: string) {
    const data = await this.aiService.summarize(tenant.id, id);
    return { success: true, data };
  }

  // FAQ Management
  @Get("faqs")
  async getFAQs(@CurrentTenant() tenant: any) {
    const data = await this.aiService.getFAQs(tenant.id);
    return { success: true, data };
  }

  @Post("faqs")
  async createFAQ(@CurrentTenant() tenant: any, @Body() body: any) {
    const data = await this.aiService.createFAQ(tenant.id, body);
    return { success: true, data };
  }

  @Put("faqs/:id")
  async updateFAQ(@CurrentTenant() tenant: any, @Param("id") id: string, @Body() body: any) {
    const data = await this.aiService.updateFAQ(tenant.id, id, body);
    return { success: true, data };
  }

  @Delete("faqs/:id")
  async deleteFAQ(@CurrentTenant() tenant: any, @Param("id") id: string) {
    await this.aiService.deleteFAQ(tenant.id, id);
    return { success: true };
  }

  // Document Management
  @Get("documents")
  async getDocuments(@CurrentTenant() tenant: any) {
    const data = await this.aiService.getDocuments(tenant.id);
    return { success: true, data };
  }

  @Post("documents")
  async uploadDocument(@CurrentTenant() tenant: any, @Body() body: any) {
    const data = await this.aiService.uploadDocument(
      tenant.id, 
      body.name, 
      body.fileUrl || "", 
      body.fileType || "txt", 
      body.fileSize || 0
    );
    return { success: true, data };
  }

  @Delete("documents/:id")
  async deleteDocument(@CurrentTenant() tenant: any, @Param("id") id: string) {
    await this.aiService.deleteDocument(tenant.id, id);
    return { success: true };
  }

  // Compilation
  @Post("config/compile")
  async compile(@CurrentTenant() tenant: any) {
    await this.aiService.compileSystemPrompt(tenant.id);
    return { success: true };
  }

  // Onboarding Wizard
  @Post("onboarding/generate")
  async generateOnboarding(@CurrentTenant() tenant: any, @Body() body: any) {
    const data = await this.aiService.generateOnboarding(tenant.id, body);
    return { success: true, data };
  }
}
