import { AIProvider } from "./base.provider";
import { AIRequestParams, AIResponse, AIModel } from "../types";
import axios from "axios";

export class OpenAIProvider extends AIProvider {
  name = "OpenAI";
  private baseUrl = "https://api.openai.com/v1";

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
      usage: {
        promptTokens: response.data.usage.prompt_tokens,
        completionTokens: response.data.usage.completion_tokens,
        totalTokens: response.data.usage.total_tokens,
      },
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

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split("\n");

      for (const line of lines) {
        if (line.startsWith("data: ")) {
          const data = line.slice(6);
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
      await axios.get(`${this.baseUrl}/models`, {
        headers: { Authorization: `Bearer ${apiKey}` },
      });
      return true;
    } catch (e) {
      return false;
    }
  }

  async listModels(apiKey: string): Promise<AIModel[]> {
    const response = await axios.get(`${this.baseUrl}/models`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    return response.data.data.map((m: any) => ({
      id: m.id,
      name: m.id,
      provider: "openai",
    }));
  }

  async generateEmbeddings(text: string, apiKey: string, model: string = "text-embedding-3-small"): Promise<number[]> {
    const response = await axios.post(
      `${this.baseUrl}/embeddings`,
      {
        input: text,
        model: model,
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
      }
    );

    return response.data.data[0].embedding;
  }
}
