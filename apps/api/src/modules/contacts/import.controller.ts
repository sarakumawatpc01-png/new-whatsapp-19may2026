import { Controller, Post, UseInterceptors, UploadedFile, Body, UseGuards , Inject} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { ContactsService } from "./contacts.service";
import { JwtAuthGuard } from "../auth/guards";
import { CurrentTenant } from "../auth/decorators";
import { parse } from "csv-parse/sync";

@Controller("contacts/import")
@UseGuards(JwtAuthGuard)
export class ContactsImportController {
  constructor(@Inject(ContactsService) private contactsService: ContactsService) {}

  @Post()
  @UseInterceptors(FileInterceptor("file"))
  async importContacts(
    @CurrentTenant() tenant: any,
    @UploadedFile() file: any,
    @Body("mapping") mappingJson: string
  ) {
    const mapping = JSON.parse(mappingJson);
    const content = file.buffer.toString();
    const records: any[] = parse(content, { columns: true, skip_empty_lines: true });

    let imported = 0;
    let skipped = 0;
    let errors = 0;

    for (const record of records) {
      try {
        const phoneNumber = record[mapping.phoneNumber];
        if (!phoneNumber) {
          skipped++;
          continue;
        }

        const data: any = {
          phoneNumber,
          name: record[mapping.name],
          email: record[mapping.email],
          company: record[mapping.company],
          jobTitle: record[mapping.jobTitle],
        };

        // Custom fields mapping
        if (mapping.customFields) {
          data.customFields = {};
          for (const [csvKey, dbKey] of Object.entries(mapping.customFields)) {
            data.customFields[dbKey as string] = record[csvKey];
          }
        }

        await this.contactsService.create(tenant.id, data);
        imported++;
      } catch (e) {
        errors++;
      }
    }

    return { success: true, data: { imported, skipped, errors } };
  }
}
