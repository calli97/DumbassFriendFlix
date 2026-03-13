import * as dotenv from 'dotenv';
dotenv.config(); // Load .env before any module initialization

import * as fs from 'fs';
import * as path from 'path';
import { NestFactory, Reflector } from '@nestjs/core';
import { ValidationPipe, ClassSerializerInterceptor } from '@nestjs/common';
import { AppModule } from './app.module';

function validateStoragePath(): void {
  const storePath = process.env.STORE_PATH;

  if (!storePath) {
    console.error('[Bootstrap] STORE_PATH is not defined in environment variables.');
    console.error('[Bootstrap] Add STORE_PATH=/absolute/path/to/storage to your .env file.');
    process.exit(1);
  }

  const resolved = path.resolve(storePath);

  if (!fs.existsSync(resolved)) {
    console.error(`[Bootstrap] Storage directory does not exist: "${resolved}"`);
    console.error('[Bootstrap] Create the directory or update STORE_PATH in your .env file.');
    process.exit(1);
  }

  if (!fs.statSync(resolved).isDirectory()) {
    console.error(`[Bootstrap] STORE_PATH exists but is not a directory: "${resolved}"`);
    process.exit(1);
  }

  console.log(`[Bootstrap] Storage directory validated: "${resolved}"`);
}

async function bootstrap(): Promise<void> {
  // Fail fast — do not start the server if the storage path is misconfigured
  validateStoragePath();

  const app = await NestFactory.create(AppModule);

  // Global route prefix
  app.setGlobalPrefix('api/v1');

  // Validate and strip unknown properties from incoming requests
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Serialize responses using class-transformer decorators (e.g. @Exclude)
  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  console.log(`[Bootstrap] Server running on http://localhost:${port}/api/v1`);
}

bootstrap();
