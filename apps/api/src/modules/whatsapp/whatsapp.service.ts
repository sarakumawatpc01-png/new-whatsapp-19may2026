import { Injectable, Logger, HttpException, HttpStatus, Inject } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { getEnv } from "@repo/config";
import axios from "axios";
import * as crypto from "crypto";
import { InjectQueue } from "@nestjs/bull";
import { type Queue } from "bull";
import { WhatsAppAccountStatus, ConversationStatus, MessageDirection, MessageType, MessageStatus, MessageSender } from "@repo/database";

const META_API_VERSION = "v19.0";

@Injectable()
export class WhatsAppService {
  private readonly logger = new Logger(WhatsAppService.name);
  private readonly algorithm = "aes-256-cbc";
  private readonly key = Buffer.from(getEnv().ENCRYPTION_KEY || "0".repeat(64), "hex");
  private readonly ivSize = 16;

  constructor(@Inject(PrismaService) private prisma: PrismaService, @InjectQueue("whatsapp") private whatsappQueue: Queue
  ) {}

  private graphUrl(path: string): string {
    return `https://graph.facebook.com/${META_API_VERSION}/${path}`;
  }

  encrypt(text: string): string {
    const iv = crypto.randomBytes(this.ivSize);
    const cipher = crypto.createCipheriv(this.algorithm, this.key, iv);
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return iv.toString("hex") + ":" + encrypted.toString("hex");
  }

  decrypt(text: string): string {
    const textParts = text.split(":");
    const iv = Buffer.from(textParts.shift()!, "hex");
    const encryptedText = Buffer.from(textParts.join(":"), "hex");
    const decipher = crypto.createDecipheriv(this.algorithm, this.key, iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
  }

  async verifyWebhook(verifyToken: string, challenge: string): Promise<string> {
    if (verifyToken === getEnv().META_VERIFY_TOKEN) {
      return challenge;
    }
    throw new HttpException("FORBIDDEN", HttpStatus.FORBIDDEN);
  }

  validateSignature(signature: string, rawBody: Buffer | string): boolean {
    if (!signature) return false;
    const [algo, sig] = signature.split("=");
    if (algo !== "sha256") return false;
    const hmac = crypto.createHmac("sha256", getEnv().META_APP_SECRET);
    const digest = hmac.update(rawBody).digest("hex");
    try {
      return crypto.timingSafeEqual(Buffer.from(sig, "hex"), Buffer.from(digest, "hex"));
    } catch {
      return false;
    }
  }

  async handleWebhook(tenantId: string, payload: any): Promise<void> {
    await this.whatsappQueue.add("webhook", {
      tenantId,
      payload,
    }, {
      jobId: `webhook-${Date.now()}-${crypto.randomInt(1000)}`,
    });
  }

  async connect(tenantId: string, code: string, wabaId: string, phoneNumberId: string): Promise<any> {
    const appId = getEnv().META_APP_ID;
    const appSecret = getEnv().META_APP_SECRET;
    const systemUserToken = getEnv().META_SYSTEM_USER_TOKEN;

    // Step 1: Exchange code for Business Integration System User token
    const tokenRes = await axios.get(this.graphUrl("oauth/access_token"), {
      params: { client_id: appId, client_secret: appSecret, code }
    });
    const accessToken = tokenRes.data.access_token;

    // Step 2: Fetch phone number info
    const phoneRes = await axios.get(this.graphUrl(phoneNumberId), {
      params: {
        fields: "display_phone_number,verified_name,quality_rating,platform_type,throughput,status",
      },
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    const { display_phone_number, verified_name, quality_rating } = phoneRes.data;

    // Step 3: Register phone number (CRITICAL — often missed)
    try {
      await axios.post(this.graphUrl(`${phoneNumberId}/register`), {
        messaging_product: "whatsapp",
        pin: "000000",
      }, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      this.logger.log(`Phone number ${phoneNumberId} registered successfully`);
    } catch (regErr: any) {
      this.logger.warn(`Phone registration warning (may already be registered): ${regErr.response?.data?.error?.message || regErr.message}`);
    }

    // Step 4: Subscribe WABA to webhooks using SYSTEM USER TOKEN (not tenant token)
    await axios.post(this.graphUrl(`${wabaId}/subscribed_apps`), {}, {
      headers: { Authorization: `Bearer ${systemUserToken}` }
    });

    // Step 5: Upsert WhatsAppAccount (find by wabaId, not by id)
    let account = await this.prisma.whatsAppAccount.findFirst({
      where: { wabaId, tenantId },
    });

    if (account) {
      account = await this.prisma.whatsAppAccount.update({
        where: { id: account.id },
        data: {
          accessToken: this.encrypt(accessToken),
          status: WhatsAppAccountStatus.ACTIVE,
          businessName: verified_name,
        },
      });
    } else {
      account = await this.prisma.whatsAppAccount.create({
        data: {
          tenantId,
          wabaId,
          accessToken: this.encrypt(accessToken),
          status: WhatsAppAccountStatus.ACTIVE,
          businessName: verified_name,
        },
      });
    }

    // Step 6: Upsert WhatsAppNumber
    const number = await this.prisma.whatsAppNumber.upsert({
      where: { phoneNumberId },
      update: {
        status: WhatsAppAccountStatus.ACTIVE,
        verifiedName: verified_name,
        qualityRating: quality_rating === "GREEN" ? "GREEN" : quality_rating === "YELLOW" ? "YELLOW" : quality_rating === "RED" ? "RED" : "UNKNOWN",
      },
      create: {
        tenantId,
        accountId: account.id,
        phoneNumberId,
        displayPhone: display_phone_number,
        verifiedName: verified_name,
        qualityRating: quality_rating === "GREEN" ? "GREEN" : quality_rating === "YELLOW" ? "YELLOW" : quality_rating === "RED" ? "RED" : "UNKNOWN",
        status: WhatsAppAccountStatus.ACTIVE,
      },
    });

    this.logger.log(`WhatsApp connected: tenant=${tenantId}, waba=${wabaId}, phone=${display_phone_number}`);
    return number;
  }

  async listNumbers(tenantId: string) {
    return this.prisma.whatsAppNumber.findMany({
      where: { tenantId },
      include: { account: true },
    });
  }

  async disconnect(tenantId: string, id: string) {
    return this.prisma.whatsAppNumber.update({
      where: { id, tenantId },
      data: { status: WhatsAppAccountStatus.DISCONNECTED }
    });
  }

  async getHealth(tenantId: string, id: string) {
    const number = await this.prisma.whatsAppNumber.findUnique({
      where: { id, tenantId },
      include: { account: true },
    });
    if (!number) throw new Error("Number not found");

    const token = this.decrypt(number.account.accessToken);
    const res = await axios.get(this.graphUrl(number.phoneNumberId), {
      params: {
        fields: "quality_rating,display_phone_number,verified_name,platform_type,throughput,status",
      },
      headers: { Authorization: `Bearer ${token}` }
    });

    return {
      qualityRating: res.data.quality_rating,
      status: res.data.status,
      verifiedName: res.data.verified_name,
      throughput: res.data.throughput,
    };
  }

  async sendMessage(params: {
    numberId: string;
    to: string;
    type: MessageType;
    body?: string;
    mediaUrl?: string;
  }) {
    const number = await this.prisma.whatsAppNumber.findUnique({
      where: { id: params.numberId },
      include: { account: true },
    });
    if (!number) throw new Error("WhatsApp number not found");

    const token = this.decrypt(number.account.accessToken);
    const url = this.graphUrl(`${number.phoneNumberId}/messages`);

    const payload: any = {
      messaging_product: "whatsapp",
      to: params.to,
      type: params.type.toLowerCase(),
    };

    if (params.type === MessageType.TEXT) {
      payload.text = { body: params.body };
    }

    try {
      const res = await axios.post(url, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const contact = await this.prisma.contact.upsert({
        where: {
          tenantId_phone: {
            tenantId: number.tenantId,
            phone: params.to,
          }
        },
        update: {},
        create: {
          tenantId: number.tenantId,
          phone: params.to,
          name: params.to,
        }
      });

      let conversation = await this.prisma.conversation.findFirst({
        where: {
          tenantId: number.tenantId,
          numberId: number.id,
          contactId: contact.id,
        }
      });

      if (!conversation) {
        conversation = await this.prisma.conversation.create({
          data: {
            tenantId: number.tenantId,
            numberId: number.id,
            contactId: contact.id,
            status: ConversationStatus.OPEN,
          }
        });
      }

      const isInsideCsw = conversation.cswExpiresAt ? new Date() < conversation.cswExpiresAt : false;
      const messageCategory = params.type === MessageType.TEMPLATE ? "MARKETING" : (isInsideCsw ? "SERVICE" : "UTILITY");
      const messageCost = isInsideCsw ? 0.00 : 0.05;

      await this.prisma.message.create({
        data: {
          tenantId: number.tenantId,
          conversationId: conversation.id,
          numberId: number.id,
          whatsappId: res.data.messages?.[0]?.id,
          direction: MessageDirection.OUTBOUND,
          senderType: MessageSender.AGENT,
          type: params.type,
          body: params.body,
          mediaUrl: params.mediaUrl,
          status: MessageStatus.SENT,
          isInsideCsw,
          messageCategory,
          messageCost,
        }
      });

      await this.prisma.conversation.update({
        where: { id: conversation.id },
        data: { lastMessageAt: new Date() }
      });

      return res.data;
    } catch (e: any) {
      this.logger.error(`Meta API Error: ${JSON.stringify(e.response?.data || e.message)}`);
      throw e;
    }
  }
}
