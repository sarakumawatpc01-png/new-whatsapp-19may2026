import { AIProvider } from "./base.provider";
import { AIRequestParams, AIResponse, AIModel } from "../types";
import axios from "axios";

export class GoogleProvider extends AIProvider {
  name = "Google";
  private baseUrl = "https://generativelanguage.googleapis.com/v1beta";

  async sendMessage(params: AIRequestParams, apiKey: string): Promise<AIResponse> {
    const response = await axios.post(
      `${this.baseUrl}/models/${params.model}:generateContent?key=${apiKey}`,
      {
        contents: params.messages.map(m => ({
          role: m.role === "assistant" ? "model" : "user",
          parts: [{ text: m.content }]
        })),
        generationConfig: {
          maxOutputTokens: params.maxTokens,
          temperature: params.temperature,
        }
      }
    );

    return {
      content: response.data.candidates[0].content.parts[0].text,
      usage: response.data.usageMetadata ? {
        promptTokens: response.data.usageMetadata.promptTokenCount,
        completionTokens: response.data.usageMetadata.candidatesTokenCount,
        totalTokens: response.data.usageMetadata.totalTokenCount,
      } : undefined,
    };
  }

  async *streamMessage(params: AIRequestParams, apiKey: string): AsyncIterableIterator<string> {
    const response = await fetch(`${this.baseUrl}/models/${params.model}:streamGenerateContent?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: params.messages.map(m => ({
          role: m.role === "assistant" ? "model" : "user",
          parts: [{ text: m.content }]
        })),
        generationConfig: {
          maxOutputTokens: params.maxTokens,
          temperature: params.temperature,
        }
      }),
    });

    if (!response.body) return;
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      // Google streams JSON objects in an array usually or separate chunks
      // This is a simplified version
      try {
        const chunks = buffer.split("\n");
        buffer = chunks.pop() || "";
        for (const chunk of chunks) {
          const json = JSON.parse(chunk.replace(/^,/, "").trim());
          const text = json.candidates[0].content.parts[0].text;
          if (text) yield text;
        }
      } catch (e) { }
    }
  }

  async validateKey(apiKey: string): Promise<boolean> {
    try {
      await axios.get(`${this.baseUrl}/models?key=${apiKey}`);
      return true;
    } catch (e) {
      return false;
    }
  }

  async listModels(apiKey: string): Promise<AIModel[]> {
    try {
      const response = await axios.get(`${this.baseUrl}/models?key=${apiKey}`);
      return response.data.models.map((m: any) => ({
        id: m.name.split("/").pop(),
        name: m.displayName,
        provider: "google",
      }));
    } catch (e) {
      return [
        { id: "gemini-1.5-pro", name: "Gemini 1.5 Pro", provider: "google" },
        { id: "gemini-1.5-flash", name: "Gemini 1.5 Flash", provider: "google" },
      ];
    }
  }

  async generateEmbeddings(text: string, apiKey: string, model?: string): Promise<number[]> {
    throw new Error("Embeddings not supported by this GoogleProvider implementation");
  }
}
