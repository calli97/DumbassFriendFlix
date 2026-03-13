import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  Headers,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  NotFoundException,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { createReadStream, existsSync, statSync } from 'fs';
import { MediaService } from './media.service';
import { UploadMediaDto } from './dto/upload-media.dto';
import { Media } from './entities/media.entity';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { QueryJwtAuthGuard } from '../../common/guards/query-jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { RoleName } from '../users/enums/role-name.enum';
import { buildMulterOptions } from '../../config/storage.config';

const multerOptions = buildMulterOptions(process.env.STORE_PATH!);

@Controller('media')
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  // ── Admin-only endpoints ──────────────────────────────────────────────────

  @Post('upload')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleName.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(FileInterceptor('file', multerOptions))
  async upload(
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: UploadMediaDto,
  ): Promise<Media> {
    if (!file) throw new BadRequestException('A video file is required');
    return this.mediaService.create(dto.title, file);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleName.ADMIN)
  findAll(): Promise<Media[]> {
    return this.mediaService.findAll();
  }

  // ── Authenticated-user endpoints ──────────────────────────────────────────

  @Get('list')
  @UseGuards(JwtAuthGuard)
  findAllForUsers(): Promise<Media[]> {
    return this.mediaService.findAll();
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  findOne(@Param('id', ParseIntPipe) id: number): Promise<Media> {
    return this.mediaService.findOne(id);
  }

  /**
   * Streams a video file with HTTP Range support for seeking.
   * Uses QueryJwtAuthGuard so the browser can authenticate via
   * ?token= query param (HTML5 <video> cannot send custom headers).
   */
  @Get(':id/stream')
  @UseGuards(QueryJwtAuthGuard)
  async stream(
    @Param('id', ParseIntPipe) id: number,
    @Headers('range') range: string | undefined,
    @Res() res: Response,
  ): Promise<void> {
    const media = await this.mediaService.findOne(id);

    if (!existsSync(media.path)) {
      throw new NotFoundException('File not found on disk');
    }

    const { size } = statSync(media.path);

    if (range) {
      const [startStr, endStr] = range.replace(/bytes=/, '').split('-');
      const start = parseInt(startStr, 10);
      const end = endStr ? parseInt(endStr, 10) : size - 1;
      const chunkSize = end - start + 1;

      res.writeHead(206, {
        'Content-Range': `bytes ${start}-${end}/${size}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunkSize,
        'Content-Type': media.mimeType,
      });

      createReadStream(media.path, { start, end }).pipe(res);
    } else {
      res.writeHead(200, {
        'Content-Length': size,
        'Content-Type': media.mimeType,
        'Accept-Ranges': 'bytes',
      });

      createReadStream(media.path).pipe(res);
    }
  }
}
