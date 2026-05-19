import { PrismaModule } from "../../prisma/prisma.module";
import { Module } from "@nestjs/common";
import { ContactsController } from "./contacts.controller";
import { ContactsImportController } from "./import.controller";
import { ContactsService } from "./contacts.service";
import { TagsController } from "./tags.controller";
import { TagsService } from "./tags.service";
import { PipelineController } from "./pipeline.controller";
import { PipelineService } from "./pipeline.service";

@Module({
  imports: [PrismaModule],
  controllers: [ContactsController, ContactsImportController, TagsController, PipelineController],
  providers: [ContactsService, TagsService, PipelineService],
  exports: [ContactsService],
})
export class ContactsModule {}
