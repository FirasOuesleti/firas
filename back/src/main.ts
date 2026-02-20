import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import * as bodyParser from 'body-parser';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

function parseCorsOrigins(value: string): (string | RegExp)[] {
  return value
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .map((o) => {
      // Allow regex-style origins like: /https:\/\/.*\.example\.com/
      if (o.startsWith('/') && o.endsWith('/')) return new RegExp(o.slice(1, -1));
      return o;
    });
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { cors: false });

  app.setGlobalPrefix('api');

  // Security headers
  app.use(
    helmet({
      contentSecurityPolicy: false, // API; keep CSP at frontend
    }),
  );

  // Request size limits
  app.use(bodyParser.json({ limit: '1mb' }));
  app.use(bodyParser.urlencoded({ extended: true, limit: '1mb' }));

  // CORS
  const origins = parseCorsOrigins(process.env.CORS_ORIGINS ?? 'http://localhost:3000');
  app.enableCors({
    origin: origins,
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type'],
    maxAge: 86400,
  });

  // Strict validation
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      forbidUnknownValues: true,
    }),
  );

  // Swagger
  const swaggerCfg = new DocumentBuilder()
    .setTitle('Dashboard API')
    .setVersion('1.0.0')
    .build();
  const doc = SwaggerModule.createDocument(app, swaggerCfg);
  SwaggerModule.setup('api/docs', app, doc);

  const port = Number(process.env.PORT ?? 3001);
  await app.listen(port, '0.0.0.0');
}
bootstrap();
