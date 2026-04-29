import * as dotenv from 'dotenv';
dotenv.config(); // Load .env before any module initialization

import * as fs from 'fs';
import * as path from 'path';
import { verify as jwtVerify } from 'jsonwebtoken';
import { Server as TusServer } from '@tus/server';
import { FileStore } from '@tus/file-store';
import { NestFactory, Reflector, HttpAdapterHost } from '@nestjs/core';
import { ValidationPipe, ClassSerializerInterceptor, Logger } from '@nestjs/common';
import { Logger as PinoLogger } from 'nestjs-pino';
import { AppModule } from './app.module';
import { MediaService } from './modules/media/media.service';
import { MinioService } from './modules/media/minio.service';
import { RoleName } from './modules/users/enums/role-name.enum';
import { LoggingExceptionFilter } from './common/filters/logging-exception.filter';

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
}

function mountTusServer(app: any): void {
  const logger = new Logger('TUS');
  const storePath = process.env.STORE_PATH!;
  const jwtSecret = process.env.JWT_SECRET!;
  const mediaService = app.get(MediaService);
  const minioService = app.get(MinioService);
  const TUS_PATH = '/api/v1/media/tus';

  const tusServer = new TusServer({
    path: TUS_PATH,
    datastore: new FileStore({ directory: storePath }),
    exposedHeaders: ['X-Media-Id'],

    // req is a web-standard Request (ServerRequest extends Request), so use req.headers.get()
    onUploadCreate: async (req, upload) => {
      const auth = req.headers.get('authorization');
      const token = auth?.startsWith('Bearer ') ? auth.slice(7) : null;
      if (!token) {
        logger.warn('Upload rejected: missing token');
        throw { status_code: 401, body: 'Unauthorized' };
      }

      let payload: any;
      try {
        payload = jwtVerify(token, jwtSecret);
      } catch {
        logger.warn('Upload rejected: invalid token');
        throw { status_code: 401, body: 'Unauthorized' };
      }

      const roles: string[] = payload.roles ?? [];
      if (!roles.includes(RoleName.ADMIN)) {
        logger.warn(`Upload rejected: insufficient role — userId=${payload.sub}`);
        throw { status_code: 403, body: 'Forbidden' };
      }

      if (!upload.metadata?.title?.trim()) {
        throw { status_code: 400, body: 'metadata.title is required' };
      }

      return {};
    },

    onUploadFinish: async (_req, upload) => {
      logger.log(`Upload finished — id=${upload.id}`);

      const title = upload.metadata?.title ?? upload.id;
      const originalName = upload.metadata?.filename ?? upload.id;
      const mimeType = upload.metadata?.filetype ?? 'video/mp4';
      const filePath = path.join(storePath, upload.id);
      const storageType = (upload.metadata?.storageType as 'local' | 'minio') ?? 'local';

      logger.log(`storageType=${storageType} filePath=${filePath}`);

      let mediaPath = filePath;

      if (storageType === 'minio') {
        const objectName = upload.id;
        logger.log(`Uploading to MinIO — objectName=${objectName}`);
        try {
          await minioService.uploadFile(objectName, filePath, mimeType);
          logger.log('MinIO upload OK');
        } catch (e) {
          logger.error(`MinIO upload FAILED: ${e}`);
          throw e;
        }

        await fs.promises.unlink(filePath);
        await fs.promises.unlink(`${filePath}.info`).catch(() => undefined);
        mediaPath = objectName;
        logger.log(`Local file removed: ${filePath}`);
      }

      const media = await mediaService.createFromTus(title, mediaPath, originalName, mimeType, storageType);
      logger.log(`Saved to DB — media.id=${media.id}`);

      return { headers: { 'X-Media-Id': String(media.id) } };
    },
  });

  // Mount directly on the raw Express instance to preserve req.url (needed by @tus/server path matching)
  const expressApp = app.getHttpAdapter().getInstance();
  expressApp.all(`${TUS_PATH}`, tusServer.handle.bind(tusServer));
  expressApp.all(`${TUS_PATH}/*`, tusServer.handle.bind(tusServer));

  logger.log(`TUS endpoint ready: ${TUS_PATH}`);
}

async function bootstrap(): Promise<void> {
  // Fail fast — do not start the server if the storage path is misconfigured
  validateStoragePath();

  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  app.useLogger(app.get(PinoLogger));

  app.enableCors({
    origin: '*',
    methods: ['GET', 'HEAD', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Authorization',
      'Content-Type',
      'Upload-Length',
      'Upload-Offset',
      'Upload-Metadata',
      'Upload-Defer-Length',
      'Upload-Concat',
      'Tus-Resumable',
      'X-Requested-With',
    ],
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

  app.setGlobalPrefix('api/v1');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));

  const { httpAdapter } = app.get(HttpAdapterHost);
  app.useGlobalFilters(new LoggingExceptionFilter(httpAdapter));

  mountTusServer(app);

  const port = process.env.PORT ?? 3000;
  await app.listen(port);

  const logger = new Logger('Bootstrap');
  logger.log(`Server running on http://localhost:${port}/api/v1`);
}

bootstrap();
