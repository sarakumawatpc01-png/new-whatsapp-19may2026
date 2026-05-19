import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { getEnv } from "@repo/config";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const env = getEnv();
  await app.listen(3004);
  console.log('Worker is running and listening for jobs...');
}
bootstrap();
 
