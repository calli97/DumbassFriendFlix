import * as dotenv from 'dotenv';
dotenv.config(); // Load .env before any module initialization

import * as fs from 'fs';
import * as path from 'path';
import { verify as jwtVerify } from 'jsonwebtoken';
import { Server as TusServer } from '@tus/server';
import { FileStore } from '@tus/file-store';
import { NestFactory, Reflector } from '@nestjs/core';
import { ValidationPipe, ClassSerializerInterceptor } from '@nestjs/common';
import { AppModule } from './app.module';
import { MediaService } from './modules/media/media.service';
import { RoleName } from './modules/users/enums/role-name.enum';

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

function mountTusServer(app: any): void {
  const storePath = process.env.STORE_PATH!;
  const jwtSecret = process.env.JWT_SECRET!;
  const mediaService = app.get(MediaService);
  const TUS_PATH = '/api/v1/media/tus';

  const tusServer = new TusServer({
    path: TUS_PATH,
    datastore: new FileStore({ directory: storePath }),
    exposedHeaders: ['X-Media-Id'],

    // req is a web-standard Request (ServerRequest extends Request), so use req.headers.get()
    onUploadCreate: async (req, upload) => {
      const auth = req.headers.get('authorization');
      const token = auth?.startsWith('Bearer ') ? auth.slice(7) : null;
      if (!token) throw { status_code: 401, body: 'Unauthorized' };

      let payload: any;
      try {
        payload = jwtVerify(token, jwtSecret);
      } catch {
        throw { status_code: 401, body: 'Unauthorized' };
      }

      const roles: string[] = payload.roles ?? [];
      if (!roles.includes(RoleName.ADMIN)) throw { status_code: 403, body: 'Forbidden' };

      if (!upload.metadata?.title?.trim()) {
        throw { status_code: 400, body: 'metadata.title is required' };
      }

      return {};
    },

    onUploadFinish: async (_req, upload) => {
      const title = upload.metadata?.title ?? upload.id;
      const originalName = upload.metadata?.filename ?? upload.id;
      const mimeType = upload.metadata?.filetype ?? 'video/mp4';
      const filePath = path.join(storePath, upload.id);

      const media = await mediaService.createFromTus(title, filePath, originalName, mimeType);

      return { headers: { 'X-Media-Id': String(media.id) } };
    },
  });

  // Mount directly on the raw Express instance to preserve req.url (needed by @tus/server path matching)
  const expressApp = app.getHttpAdapter().getInstance();
  expressApp.all(`${TUS_PATH}`, tusServer.handle.bind(tusServer));
  expressApp.all(`${TUS_PATH}/*`, tusServer.handle.bind(tusServer));

  console.log(`[Bootstrap] Tus upload endpoint: ${TUS_PATH}`);
}

async function bootstrap(): Promise<void> {
  // Fail fast — do not start the server if the storage path is misconfigured
  validateStoragePath();

  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: '*',
    // Expose tus protocol headers and the custom media-id header to the browser
    exposedHeaders: [
      'X-Media-Id',
      'Location',
      'Upload-Offset',
      'Upload-Length',
      'Tus-Resumable',
      'Tus-Version',
      'Tus-Max-Size',
      'Tus-Extension',
    ],
  });

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

  mountTusServer(app);

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  console.log(`[Bootstrap] Server running on http://localhost:${port}/api/v1`);
}

bootstrap();
