import { Process, Processor } from "@nestjs/bull";
import { Logger , Inject} from "@nestjs/common";
import type { Job } from "bull";
import { PrismaService } from "../../prisma/prisma.service";
import { VectorService } from "./vector.service";
import axios from "axios";

@Processor("ai")
export class AIProcessor {
  private readonly logger = new Logger(AIProcessor.name);

  constructor(@Inject(PrismaService) private prisma: PrismaService, @Inject(VectorService) private vector: VectorService) {}

  @Process("document_process")
  async handleDocumentProcess(job: Job<any>) {
    const { docId, tenantId } = job.data;
    this.logger.log(`Processing document: ${docId} for tenant: ${tenantId}`);

    try {
      const doc = await this.prisma.aIDocument.findUnique({
        where: { id: docId }
      });

      if (!doc) throw new Error("Document not found");

      // 1. Fetch content
      let text = "";
      if (doc.fileUrl.startsWith("http")) {
        const response = await axios.get(doc.fileUrl);
        text = typeof response.data === 'string' ? response.data : JSON.stringify(response.data);
      } else {
        // Handle local paths or raw content
        text = doc.content || "";
      }

      if (!text) throw new Error("No text content found in document");

      // 2. Clear old chunks
      await this.vector.deleteByDocument(docId);

      // 3. Create new chunks and embeddings
      await this.vector.createChunks(docId, tenantId, text);

      // 4. Update status
      await this.prisma.aIDocument.update({
        where: { id: docId },
        data: {
          processed: true,
          processedAt: new Date(),
          content: text.slice(0, 5000), // store preview
        }
      });

      this.logger.log(`Document ${docId} processed successfully with vector indexing.`);

    } catch (e: any) {
      this.logger.error(`Failed to process document ${docId}: ${e.message}`);
      throw e;
    }
  }
}
