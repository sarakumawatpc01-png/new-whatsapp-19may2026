import { Injectable, HttpException, HttpStatus, Inject } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import PDFDocument from "pdfkit";

@Injectable()
export class InvoicesService {
  constructor(@Inject(PrismaService) private prisma: PrismaService) {}

  async findAll(tenantId: string, query: any) {
    const { page = 1, limit = 10 } = query;
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.prisma.invoice.findMany({
        where: { tenantId },
        orderBy: { createdAt: "desc" },
        skip,
        take: Number(limit),
      }),
      this.prisma.invoice.count({ where: { tenantId } }),
    ]);

    return {
      items,
      meta: {
        total,
        page: Number(page),
        limit: Number(limit),
        hasMore: total > skip + items.length,
      },
    };
  }

  async findOne(tenantId: string, id: string) {
    return this.prisma.invoice.findFirst({
      where: { id, tenantId },
    });
  }

  async generatePdf(tenantId: string, id: string): Promise<Buffer> {
    const invoice = await this.findOne(tenantId, id);
    if (!invoice) throw new HttpException("Invoice not found", HttpStatus.NOT_FOUND);

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50 });
      const buffers: any[] = [];
      doc.on("data", (chunk) => buffers.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(buffers)));
      doc.on("error", reject);

      // Header
      doc.fontSize(20).text("INVOICE", { align: "right" });
      doc.fontSize(10).text(`Number: ${invoice.invoiceNumber}`, { align: "right" });
      doc.text(`Date: ${invoice.createdAt.toLocaleDateString()}`, { align: "right" });
      doc.moveDown();

      // Platform Info
      doc.fontSize(12).font("Helvetica-Bold").text("WhatsApp SaaS Platform");
      doc.fontSize(10).font("Helvetica").text("123 SaaS Street");
      doc.text("Tech City, 10001");
      doc.moveDown();

      // Bill To
      doc.fontSize(12).font("Helvetica-Bold").text("Bill To:");
      doc.fontSize(10).font("Helvetica").text(`Tenant ID: ${tenantId}`);
      doc.moveDown();

      // Table Header
      const tableTop = 250;
      doc.font("Helvetica-Bold");
      doc.text("Description", 50, tableTop);
      doc.text("Amount", 400, tableTop, { align: "right" });
      doc.moveTo(50, tableTop + 15).lineTo(550, tableTop + 15).stroke();

      // Table Items
      let y = tableTop + 25;
      doc.font("Helvetica");
      const lineItems = ((invoice as any).lineItems as any[]) || [];
      lineItems.forEach((item: any) => {
        doc.text(item.description, 50, y);
        doc.text((Number(item.amount) / 100).toFixed(2), 400, y, { align: "right" });
        y += 20;
      });

      // Total
      doc.moveTo(50, y).lineTo(550, y).stroke();
      doc.font("Helvetica-Bold").text("Total", 300, y + 10);
      doc.text(`${(Number(invoice.total) / 100).toFixed(2)} ${invoice.currency}`, 400, y + 10, { align: "right" });

      doc.end();
    });
  }
}
