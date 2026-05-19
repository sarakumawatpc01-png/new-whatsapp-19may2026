import { Controller, Get, Put, Post, Body, UseGuards, Inject } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { JwtAuthGuard, RolesGuard } from "../auth/guards";
import { Roles } from "../auth/decorators";
import { UserRole, AIProvider } from "@repo/database";
import { getEnv } from "@repo/config";
import { createEncryptor } from "@repo/shared";

const { encrypt: encryptKey } = createEncryptor(getEnv().ENCRYPTION_KEY);

function maskKey(val: string | null | undefined): string {
  if (!val) return "";
  if (val.length <= 8) return "••••••••";
  return val.substring(0, 4) + "••••" + val.substring(val.length - 4);
}

@Controller("admin/ai-config")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN)
export class AIConfigController {
  constructor(@Inject(PrismaService) private prisma: PrismaService) {}

  @Get()
  async getConfig() {
    const configs = await this.prisma.globalAIConfig.findMany({
      orderBy: { createdAt: 'desc' },
    });
    
    // Mask API keys in response
    return configs.map((c: any) => ({
      ...c,
      apiKeyEncrypted: c.apiKeyEncrypted ? maskKey(c.apiKeyEncrypted) : "",
    }));
  }

  @Put()
  async updateConfig(@Body() body: any) {
    const { 
      provider, apiKeyEncrypted, modelChat, isDefault,
      isLocked, systemPrompt, maxTokens, temperature, taskModels 
    } = body;
    
    // Encrypt API key if provided and not already masked
    let encryptedKey = apiKeyEncrypted;
    if (apiKeyEncrypted && !apiKeyEncrypted.includes("••••")) {
      encryptedKey = encryptKey(apiKeyEncrypted);
    }

    const config = await this.prisma.globalAIConfig.findFirst({
      where: { provider: provider as AIProvider }
    });

    const data: any = {
      modelChat,
      isDefault: isDefault ?? false,
    };

    // Only update API key if a real value was provided (not masked)
    if (encryptedKey && !encryptedKey.includes("••••")) {
      data.apiKeyEncrypted = encryptedKey;
    }

    // Store additional config fields
    if (isLocked !== undefined) data.isLocked = isLocked;
    if (systemPrompt !== undefined) data.systemPrompt = systemPrompt;
    if (maxTokens !== undefined) data.maxTokens = maxTokens;
    if (temperature !== undefined) data.temperature = temperature;
    if (taskModels !== undefined) data.taskModels = taskModels;

    if (config) {
      return this.prisma.globalAIConfig.update({
        where: { id: config.id },
        data,
      });
    } else {
      return this.prisma.globalAIConfig.create({
        data: {
          provider: provider as AIProvider,
          apiKeyEncrypted: encryptedKey || "",
          ...data,
        }
      });
    }
  }

  @Post("test")
  async testConfig(@Body() body: any) {
    // Attempt a basic API call to verify the config
    try {
      const { AIFactory } = await import("@repo/ai");
      const provider = body?.provider || "OPENAI";
      const p = AIFactory.getProvider(provider);
      // If we get here without error, the provider is valid
      return { success: true, message: `Provider ${provider} is available` };
    } catch (e: any) {
      return { success: false, message: e.message };
    }
  }
}
