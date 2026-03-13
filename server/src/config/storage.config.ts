import { extname } from 'path';
import { diskStorage } from 'multer';
import { BadRequestException } from '@nestjs/common';
import { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface';

export const ALLOWED_VIDEO_EXTENSIONS = ['.mp4', '.mkv', '.avi'];

/**
 * Builds the Multer disk-storage options for video uploads.
 * @param storePath  Absolute path to the upload directory (validated at startup).
 */
export function buildMulterOptions(storePath: string): MulterOptions {
  return {
    storage: diskStorage({
      destination: storePath,
      filename: (_req, file, cb) => {
        const timestamp = Date.now();
        const random = Math.round(Math.random() * 1e9);
        const ext = extname(file.originalname).toLowerCase();
        cb(null, `${timestamp}-${random}${ext}`);
      },
    }),
    fileFilter: (_req, file, cb) => {
      const ext = extname(file.originalname).toLowerCase();
      if (!ALLOWED_VIDEO_EXTENSIONS.includes(ext)) {
        return cb(
          new BadRequestException(
            `File type not supported. Allowed extensions: ${ALLOWED_VIDEO_EXTENSIONS.join(', ')}`,
          ),
          false,
        );
      }
      cb(null, true);
    },
  };
}
