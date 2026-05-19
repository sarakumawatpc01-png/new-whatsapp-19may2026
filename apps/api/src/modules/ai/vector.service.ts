import { Injectable, Logger, Inject } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { getEnv } from "@repo/config";
import OpenAI from "openai";

@Injectable()
export class VectorService {
  private readonly logger = new Logger(VectorService.name);
  private openai: OpenAI;

  constructor(@Inject(PrismaService) private prisma: PrismaService) {
    this.openai = new OpenAI({
      apiKey: getEnv().OPENAI_API_KEY,
    });
  }

  async generateEmbedding(text: string): Promise<number[]> {
    try {
      const response = await this.openai.embeddings.create({
        model: "text-embedding-3-small",
        input: text.replace(/\n/g, " "),
      });
      return response.data[0].embedding;
    } catch (e) {
      this.logger.error("Failed to generate embedding", e);
      throw e;
    }
  }

  async createChunks(documentId: string, tenantId: string, text: string) {
    // Simple recursive character splitting
    const chunkSize = 1000;
    const chunkOverlap = 100;
    const chunks: string[] = [];
    
    let start = 0;
    while (start < text.length) {
      const end = start + chunkSize;
      chunks.push(text.slice(start, end));
      start += chunkSize - chunkOverlap;
    }

    for (const content of chunks) {
      const embedding = await this.generateEmbedding(content);
      
      // Use raw SQL to insert vector
      await this.prisma.$executeRaw`
        INSERT INTO "AIDocumentChunk" (id, "documentId", "tenantId", content, embedding, "createdAt")
        VALUES (
          gen_random_uuid(), 
          ${documentId}, 
          ${tenantId}, 
          ${content}, 
          ${embedding}::vector, 
          NOW()
        )
      `;
    }
  }

  async search(tenantId: string, query: string, limit = 5): Promise<any[]> {
    const embedding = await this.generateEmbedding(query);
    const vectorString = `[${embedding.join(",")}]`;

    // Semantic search using cosine similarity (<=>)
    const results: any[] = await this.prisma.$queryRaw`
      SELECT 
        id, 
        content, 
        "documentId", 
        1 - (embedding <=> ${vectorString}::vector) as similarity
      FROM "AIDocumentChunk"
      WHERE "tenantId" = ${tenantId}
      ORDER BY similarity DESC
      LIMIT ${limit}
    `;

    return results;
  }

  async deleteByDocument(documentId: string) {
    await this.prisma.aIDocumentChunk.deleteMany({
      where: { documentId }
    });
  }
}
