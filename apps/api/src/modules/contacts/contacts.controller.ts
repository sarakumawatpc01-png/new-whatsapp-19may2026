import { 
  Controller, 
  Get, 
  Post, 
  Patch, 
  Delete, 
  Body, 
  Param, 
  Query, 
  UseGuards 
, Inject} from "@nestjs/common";
import { ContactsService } from "./contacts.service";
import { JwtAuthGuard } from "../auth/guards";
import { CurrentUser, CurrentTenant } from "../auth/decorators";

@Controller("contacts")
@UseGuards(JwtAuthGuard)
export class ContactsController {
  constructor(@Inject(ContactsService) private contactsService: ContactsService) {}

  @Get()
  async findAll(@CurrentTenant() tenant: any, @Query() query: any) {
    const data = await this.contactsService.findAll(tenant.id, query);
    return { success: true, data };
  }

  @Get(":id")
  async findOne(@CurrentTenant() tenant: any, @Param("id") id: string) {
    const data = await this.contactsService.findOne(tenant.id, id);
    return { success: true, data };
  }

  @Post()
  async create(@CurrentTenant() tenant: any, @Body() body: any) {
    const data = await this.contactsService.create(tenant.id, body);
    return { success: true, data };
  }

  @Patch(":id")
  async update(@CurrentTenant() tenant: any, @Param("id") id: string, @Body() body: any) {
    const data = await this.contactsService.update(tenant.id, id, body);
    return { success: true, data };
  }

  @Delete(":id")
  async delete(@CurrentTenant() tenant: any, @Param("id") id: string) {
    await this.contactsService.delete(tenant.id, id);
    return { success: true };
  }

  @Post("bulk/delete")
  async bulkDelete(@CurrentTenant() tenant: any, @Body("ids") ids: string[]) {
    await this.contactsService.bulkDelete(tenant.id, ids);
    return { success: true };
  }

  @Post("bulk/update")
  async bulkUpdate(@CurrentTenant() tenant: any, @Body() body: { ids: string[], data: any }) {
    await this.contactsService.bulkUpdate(tenant.id, body.ids, body.data);
    return { success: true };
  }

  @Post("bulk/tag")
  async bulkTag(
    @CurrentTenant() tenant: any, 
    @Body() body: { ids: string[], tagIds: string[], action: "add" | "remove" }
  ) {
    await this.contactsService.bulkTag(tenant.id, body.ids, body.tagIds, body.action);
    return { success: true };
  }

  @Get(":id/timeline")
  async getTimeline(@CurrentTenant() tenant: any, @Param("id") id: string) {
    const data = await this.contactsService.getTimeline(tenant.id, id);
    return { success: true, data };
  }

  @Post(":id/notes")
  async addNote(
    @CurrentTenant() tenant: any, 
    @CurrentUser() user: any,
    @Param("id") id: string, 
    @Body("content") content: string
  ) {
    const data = await this.contactsService.addNote(tenant.id, id, content, user.sub || user.id);
    return { success: true, data };
  }

  @Post("import")
  async importContacts(@CurrentTenant() tenant: any, @Body() body: any) {
    const contacts = body?.contacts;
    if (!Array.isArray(contacts) || contacts.length === 0) {
      return { success: false, error: "No contacts provided. Expecting { contacts: [...] }" };
    }

    let imported = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (const c of contacts) {
      if (!c.phone) {
        skipped++;
        errors.push(`Skipped contact: missing phone number`);
        continue;
      }

      try {
        await this.contactsService.create(tenant.id, {
          name: c.name || c.phone,
          phone: c.phone,
          email: c.email || undefined,
          tags: c.tags || undefined,
        });
        imported++;
      } catch (e: any) {
        if (e.code === "P2002") {
          skipped++;
        } else {
          skipped++;
          errors.push(`Failed to import ${c.phone}: ${e.message}`);
        }
      }
    }

    return { success: true, data: { imported, skipped, total: contacts.length, errors: errors.slice(0, 10) } };
  }

  @Get("export")
  async exportContacts(@CurrentTenant() tenant: any) {
    const { items } = await this.contactsService.findAll(tenant.id, { page: 1, limit: 100000 });

    // Build CSV content
    const headers = ["name", "phone", "email", "optedOut", "leadScore", "createdAt"];
    const csvRows = [headers.join(",")];

    for (const contact of items) {
      const row = [
        `"${(contact.name || "").replace(/"/g, '""')}"`,
        `"${contact.phone || ""}"`,
        `"${contact.email || ""}"`,
        String(contact.optedOut || false),
        String(contact.leadScore || 0),
        `"${contact.createdAt?.toISOString() || ""}"`,
      ];
      csvRows.push(row.join(","));
    }

    const csvContent = csvRows.join("\n");

    return {
      success: true,
      data: {
        csv: csvContent,
        filename: `contacts-export-${new Date().toISOString().split("T")[0]}.csv`,
        totalRecords: items.length,
      },
    };
  }
}
