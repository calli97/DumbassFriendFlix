import {
  Controller,
  Delete,
  Get,
  Patch,
  Post,
  Body,
  Param,
  Query,
  Headers,
  HttpCode,
  HttpStatus,
  UseGuards,
  NotFoundException,
  BadRequestException,
  ParseIntPipe,
  Res,
} from "@nestjs/common";
import { randomUUID } from "crypto";
import { UpdateMediaDto } from "./dto/update-media.dto";
import { CreateMultipartDto } from "./dto/create-multipart.dto";
import { CompleteMultipartDto } from "./dto/complete-multipart.dto";
import { AbortMultipartDto } from "./dto/abort-multipart.dto";
import { Response } from "express";
import { createReadStream, existsSync, statSync } from "fs";
import { MediaService } from "./media.service";
import { MinioService } from "./minio.service";
import { Media } from "./entities/media.entity";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { QueryJwtAuthGuard } from "../../common/guards/query-jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import { RoleName } from "../users/enums/role-name.enum";

@Controller("media")
export class MediaController {
  constructor(
    private readonly mediaService: MediaService,
    private readonly minioService: MinioService,
  ) {}

  // ── Admin-only endpoints ──────────────────────────────────────────────────

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleName.ADMIN)
  findAll(): Promise<Media[]> {
    return this.mediaService.findAll();
  }

  @Patch(":id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleName.ADMIN)
  update(
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: UpdateMediaDto,
  ): Promise<Media> {
    return this.mediaService.update(id, dto);
  }

  @Delete(":id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleName.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param("id", ParseIntPipe) id: number): Promise<void> {
    return this.mediaService.remove(id);
  }

  // ── Authenticated-user endpoints ──────────────────────────────────────────

  @Get("list")
  @UseGuards(JwtAuthGuard)
  findAllForUsers(): Promise<Media[]> {
    return this.mediaService.findAll();
  }

  @Get("minio-endpoint")
  @UseGuards(JwtAuthGuard)
  getMinioEndpoint(): { endpoint: string } {
    return { endpoint: process.env.MINIO_HOST! };
  }

  @Get("upload/sign-part")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleName.ADMIN)
  async signPart(
    @Query("key") key: string,
    @Query("uploadId") uploadId: string,
    @Query("partNumber") partNumber: string,
  ): Promise<{ url: string }> {
    const url = await this.minioService.presignPartUrl(key, uploadId, parseInt(partNumber, 10));
    return { url };
  }

  @Post("upload/create-multipart")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleName.ADMIN)
  async createMultipart(@Body() dto: CreateMultipartDto): Promise<{ uploadId: string; key: string }> {
    const key = randomUUID();
    const uploadId = await this.minioService.createMultipartUpload(key, dto.mimeType);
    return { uploadId, key };
  }

  @Post("upload/complete-multipart")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleName.ADMIN)
  async completeMultipart(@Body() dto: CompleteMultipartDto): Promise<Media> {
    await this.minioService.completeMultipartUpload(dto.key, dto.uploadId);
    return this.mediaService.createFromTus(dto.title, dto.key, dto.originalName, dto.mimeType, "minio");
  }

  @Post("upload/abort-multipart")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleName.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  async abortMultipart(@Body() dto: AbortMultipartDto): Promise<void> {
    await this.minioService.abortMultipartUpload(dto.key, dto.uploadId);
  }

  @Get(":id")
  @UseGuards(JwtAuthGuard)
  findOne(@Param("id", ParseIntPipe) id: number): Promise<Media> {
    return this.mediaService.findOne(id);
  }

  /**
   * Streams a video file with HTTP Range support for seeking.
   * Uses QueryJwtAuthGuard so the browser can authenticate via
   * ?token= query param (HTML5 <video> cannot send custom headers).
   */
  @Get(":id/stream")
  @UseGuards(QueryJwtAuthGuard)
  async stream(
    @Param("id", ParseIntPipe) id: number,
    @Headers("range") range: string | undefined,
    @Res() res: Response,
  ): Promise<void> {
    const media = await this.mediaService.findOne(id);

    if (media.storageType === "minio") {
      const size = await this.minioService.getObjectSize(media.path);

      if (range) {
        const [startStr, endStr] = range.replace(/bytes=/, "").split("-");
        const start = parseInt(startStr, 10);
        const end = endStr ? parseInt(endStr, 10) : size - 1;
        const chunkSize = end - start + 1;

        res.writeHead(206, {
          "Content-Range": `bytes ${start}-${end}/${size}`,
          "Accept-Ranges": "bytes",
          "Content-Length": chunkSize,
          "Content-Type": media.mimeType,
        });

        const stream = await this.minioService.getPartialObject(media.path, start, chunkSize);
        stream.pipe(res);
      } else {
        res.writeHead(200, {
          "Content-Length": size,
          "Content-Type": media.mimeType,
          "Accept-Ranges": "bytes",
        });

        const stream = await this.minioService.getObject(media.path);
        stream.pipe(res);
      }

      return;
    }

    if (!existsSync(media.path)) {
      throw new NotFoundException("File not found on disk");
    }

    const { size } = statSync(media.path);

    if (range) {
      const [startStr, endStr] = range.replace(/bytes=/, "").split("-");
      const start = parseInt(startStr, 10);
      const end = endStr ? parseInt(endStr, 10) : size - 1;
      const chunkSize = end - start + 1;

      res.writeHead(206, {
        "Content-Range": `bytes ${start}-${end}/${size}`,
        "Accept-Ranges": "bytes",
        "Content-Length": chunkSize,
        "Content-Type": media.mimeType,
      });

      createReadStream(media.path, { start, end }).pipe(res);
    } else {
      res.writeHead(200, {
        "Content-Length": size,
        "Content-Type": media.mimeType,
        "Accept-Ranges": "bytes",
      });

      createReadStream(media.path).pipe(res);
    }
  }

  @Get(":id/presign-stream")
  @UseGuards(QueryJwtAuthGuard)
  async presignStream(@Param("id", ParseIntPipe) id: number): Promise<{ url: string }> {
    const media = await this.mediaService.findOne(id);
    if (media.storageType !== "minio") {
      throw new BadRequestException("presign-stream is only available for MinIO media");
    }
    const url = await this.minioService.presignGetUrl(media.path, 3600);
    return { url };
  }
}
