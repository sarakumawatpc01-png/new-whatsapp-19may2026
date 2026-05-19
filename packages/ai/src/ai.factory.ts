import { OpenAIProvider } from "./providers/openai.provider";
import { GenericOpenAIProvider } from "./providers/generic-openai.provider";
import { AnthropicProvider } from "./providers/anthropic.provider";
import { GoogleProvider } from "./providers/google.provider";
import { AIProvider } from "./providers/base.provider";

export class AIFactory {
  private static providers: Record<string, AIProvider> = {
    OPENAI: new OpenAIProvider(),
    OPENROUTER: new GenericOpenAIProvider("OpenRouter", "https://openrouter.ai/api/v1", "openrouter"),
    ANTHROPIC: new AnthropicProvider(),
    GOOGLE: new GoogleProvider(),
    GROQ: new GenericOpenAIProvider("Groq", "https://api.groq.com/openai/v1", "groq"),
    DEEPSEEK: new GenericOpenAIProvider("DeepSeek", "https://api.deepseek.com", "deepseek"),
    QWEN: new GenericOpenAIProvider("Qwen", "https://dashscope.aliyuncs.com/compatible-mode/v1", "qwen"),
    OLLAMA: new GenericOpenAIProvider("Ollama", "http://localhost:11434/v1", "ollama"),
  };

  static getProvider(name: string): AIProvider {
    const provider = this.providers[name.toUpperCase()];
    if (!provider) {
      throw new Error(`Provider ${name} not supported`);
    }
    return provider;
  }

  static getAvailableProviders(): string[] {
    return Object.keys(this.providers);
  }
}
