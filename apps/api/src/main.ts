import "reflect-metadata";
import { NestFactory } from '@nestjs/core'
import { AppModule } from "./app.module"
import { ValidationPipe, Logger } from '@nestjs/common'
import { AllExceptionsFilter } from "./filters/all-exceptions.filter"

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { rawBody: true })

  app.use((req, res, next) => {
    res.setHeader("X-Frame-Options", "DENY");
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Referrer-Policy", "no-referrer");
    res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
    res.setHeader("Content-Security-Policy", "default-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'");
    next();
  });
  
  app.enableCors({
    origin: [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:3002',
      process.env.NEXT_PUBLIC_WEB_URL,
      process.env.NEXT_PUBLIC_ADMIN_URL,
    ].filter(Boolean) as string[],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })

  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    transform: true,
    forbidNonWhitelisted: true,
  }))

  app.useGlobalFilters(new AllExceptionsFilter())

  app.setGlobalPrefix('api')

  const port = process.env.PORT || 3001
  await app.listen(port)
  const logger = new Logger('Bootstrap')
  logger.log(`API running on http://localhost:${port}`)
}
bootstrap()
 
