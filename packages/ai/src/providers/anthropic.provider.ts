import { AIProvider } from "./base.provider";
import { AIRequestParams, AIResponse, AIModel } from "../types";
import axios from "axios";

export class AnthropicProvider extends AIProvider {
  name = "Anthropic";
  private baseUrl = "https://api.anthropic.com/v1";

  async sendMessage(params: AIRequestParams, apiKey: string): Promise<AIResponse> {
    const response = await axios.post(
      `${this.baseUrl}/messages`,
      {
        model: params.model,
        messages: params.messages.filter(m => m.role !== "system"),
        system: params.messages.find(m => m.role === "system")?.content,
        max_tokens: params.maxTokens || 1024,
        temperature: params.temperature,
      },
      {
        headers: {
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
          "Content-Type": "application/json",
        },
      }
    );

    return {
      content: response.data.content[0].text,
      usage: {
        promptTokens: response.data.usage.input_tokens,
        completionTokens: response.data.usage.output_tokens,
        totalTokens: response.data.usage.input_tokens + response.data.usage.output_tokens,
      },
    };
  }

  async *streamMessage(params: AIRequestParams, apiKey: string): AsyncIterableIterator<string> {
    const response = await fetch(`${this.baseUrl}/messages`, {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: params.model,
        messages: params.messages.filter(m => m.role !== "system"),
        system: params.messages.find(m => m.role === "system")?.content,
        max_tokens: params.maxTokens || 1024,
        temperature: params.temperature,
        stream: true,
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
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        if (line.startsWith("data: ")) {
          const data = line.slice(6).trim();
          try {
            const json = JSON.parse(data);
            if (json.type === "content_block_delta") {
              yield json.delta.text;
            }
          } catch (e) { }
        }
      }
    }
  }

  async validateKey(apiKey: string): Promise<boolean> {
    try {
      await this.sendMessage({
        model: "claude-3-haiku-20240307",
        messages: [{ role: "user", content: "hi" }],
        maxTokens: 1
      }, apiKey);
      return true;
    } catch (e) {
      return false;
    }
  }

  async listModels(apiKey: string): Promise<AIModel[]> {
    return [
      { id: "claude-3-5-sonnet-20240620", name: "Claude 3.5 Sonnet", provider: "anthropic" },
      { id: "claude-3-opus-20240229", name: "Claude 3 Opus", provider: "anthropic" },
      { id: "claude-3-sonnet-20240229", name: "Claude 3 Sonnet", provider: "anthropic" },
      { id: "claude-3-haiku-20240307", name: "Claude 3 Haiku", provider: "anthropic" },
    ];
  }

  async generateEmbeddings(text: string, apiKey: string, model?: string): Promise<number[]> {
    throw new Error("Embeddings not supported by Anthropic provider");
  }
}
