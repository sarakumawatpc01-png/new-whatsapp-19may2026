import { AIProvider } from "./base.provider";
import { AIRequestParams, AIResponse, AIModel } from "../types";
import axios from "axios";

export class GenericOpenAIProvider extends AIProvider {
  constructor(
    public name: string,
    private baseUrl: string,
    private providerId: string
  ) {
    super();
  }

  async sendMessage(params: AIRequestParams, apiKey: string): Promise<AIResponse> {
    const response = await axios.post(
      `${this.baseUrl}/chat/completions`,
      {
        model: params.model,
        messages: params.messages,
        max_tokens: params.maxTokens,
        temperature: params.temperature,
        stream: false,
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
      }
    );

    return {
      content: response.data.choices[0].message.content,
      usage: response.data.usage ? {
        promptTokens: response.data.usage.prompt_tokens,
        completionTokens: response.data.usage.completion_tokens,
        totalTokens: response.data.usage.total_tokens,
      } : undefined,
    };
  }

  async *streamMessage(params: AIRequestParams, apiKey: string): AsyncIterableIterator<string> {
    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: params.model,
        messages: params.messages,
        max_tokens: params.maxTokens,
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
          if (data === "[DONE]") return;
          try {
            const json = JSON.parse(data);
            const text = json.choices[0].delta?.content || "";
            if (text) yield text;
          } catch (e) {
            // Ignore parse errors for incomplete chunks
          }
        }
      }
    }
  }

  async validateKey(apiKey: string): Promise<boolean> {
    try {
      // Small test call
      await axios.post(`${this.baseUrl}/chat/completions`, {
        model: "gpt-3.5-turbo", // placeholder
        messages: [{ role: "user", content: "hi" }],
        max_tokens: 1
      }, {
        headers: { Authorization: `Bearer ${apiKey}` },
      });
      return true;
    } catch (e) {
      return false;
    }
  }

  async listModels(apiKey: string): Promise<AIModel[]> {
    try {
      const response = await axios.get(`${this.baseUrl}/models`, {
        headers: { Authorization: `Bearer ${apiKey}` },
      });
      return response.data.data.map((m: any) => ({
        id: m.id,
        name: m.id,
        provider: this.providerId,
      }));
    } catch (e) {
      return [];
    }
  }

  async generateEmbeddings(text: string, apiKey: string, model?: string): Promise<number[]> {
    throw new Error("Embeddings not supported by this GenericOpenAIProvider implementation");
  }
}
