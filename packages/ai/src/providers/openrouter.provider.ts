import { OpenAIProvider } from "./openai.provider";

export class OpenRouterProvider extends OpenAIProvider {
  override name = "OpenRouter";
  private orBaseUrl = "https://openrouter.ai/api/v1";

  // OpenRouter is OpenAI-compatible but uses a different base URL
  constructor() {
    super();
    (this as any).baseUrl = this.orBaseUrl;
  }
}
