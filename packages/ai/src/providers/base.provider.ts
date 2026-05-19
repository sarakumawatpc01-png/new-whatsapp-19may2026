import { AIRequestParams, AIResponse, AIModel } from "../types";

export abstract class AIProvider {
  abstract name: string;
  abstract sendMessage(params: AIRequestParams, apiKey: string): Promise<AIResponse>;
  abstract streamMessage(params: AIRequestParams, apiKey: string): AsyncIterableIterator<string>;
  abstract validateKey(apiKey: string): Promise<boolean>;
  abstract listModels(apiKey: string): Promise<AIModel[]>;
  abstract generateEmbeddings(text: string, apiKey: string, model?: string): Promise<number[]>;
}
