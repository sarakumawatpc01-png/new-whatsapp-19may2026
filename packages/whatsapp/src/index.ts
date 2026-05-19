import axios from "axios";

const META_API_VERSION = "v19.0";

export interface SendMessageParams {
  phoneNumberId: string;
  accessToken: string;
  to: string;
  type: "text" | "image" | "video" | "audio" | "document" | "template" | "interactive" | "location";
  body?: string;
  mediaUrl?: string;
  templateName?: string;
  templateLanguage?: string;
  templateComponents?: any[];
}

export interface MessageResponse {
  messaging_product: string;
  contacts: { input: string; wa_id: string }[];
  messages: { id: string }[];
}

export class WhatsAppClient {
  private graphUrl(path: string): string {
    return `https://graph.facebook.com/${META_API_VERSION}/${path}`;
  }

  async sendTextMessage(phoneNumberId: string, token: string, to: string, body: string): Promise<MessageResponse> {
    const res = await axios.post(this.graphUrl(`${phoneNumberId}/messages`), {
      messaging_product: "whatsapp",
      to,
      type: "text",
      text: { body },
    }, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
  }

  async sendTemplateMessage(
    phoneNumberId: string, 
    token: string, 
    to: string, 
    templateName: string, 
    language: string, 
    components?: any[]
  ): Promise<MessageResponse> {
    const payload: any = {
      messaging_product: "whatsapp",
      to,
      type: "template",
      template: {
        name: templateName,
        language: { code: language },
      },
    };
    if (components) {
      payload.template.components = components;
    }
    const res = await axios.post(this.graphUrl(`${phoneNumberId}/messages`), payload, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
  }

  async sendMediaMessage(
    phoneNumberId: string, 
    token: string, 
    to: string, 
    type: "image" | "video" | "audio" | "document",
    mediaUrl: string,
    caption?: string
  ): Promise<MessageResponse> {
    const payload: any = {
      messaging_product: "whatsapp",
      to,
      type,
      [type]: { link: mediaUrl },
    };
    if (caption && (type === "image" || type === "document")) {
      payload[type].caption = caption;
    }
    const res = await axios.post(this.graphUrl(`${phoneNumberId}/messages`), payload, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
  }

  async markAsRead(phoneNumberId: string, token: string, messageId: string): Promise<void> {
    await axios.post(this.graphUrl(`${phoneNumberId}/messages`), {
      messaging_product: "whatsapp",
      status: "read",
      message_id: messageId,
    }, {
      headers: { Authorization: `Bearer ${token}` },
    });
  }

  async getPhoneNumberInfo(phoneNumberId: string, token: string): Promise<any> {
    const res = await axios.get(this.graphUrl(phoneNumberId), {
      params: { fields: "display_phone_number,verified_name,quality_rating,platform_type,throughput,status" },
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
  }

  async getBusinessProfile(phoneNumberId: string, token: string): Promise<any> {
    const res = await axios.get(this.graphUrl(`${phoneNumberId}/whatsapp_business_profile`), {
      params: { fields: "about,address,description,email,profile_picture_url,websites,vertical" },
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data?.data?.[0] || res.data;
  }

  async getMessageTemplates(wabaId: string, token: string): Promise<any[]> {
    const res = await axios.get(this.graphUrl(`${wabaId}/message_templates`), {
      params: { fields: "name,status,category,language,components" },
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data?.data || [];
  }

  async downloadMedia(mediaId: string, token: string): Promise<{ url: string; mime_type: string }> {
    const res = await axios.get(this.graphUrl(mediaId), {
      headers: { Authorization: `Bearer ${token}` },
    });
    return { url: res.data.url, mime_type: res.data.mime_type };
  }
}

// Default singleton export
export const metaClient = new WhatsAppClient();