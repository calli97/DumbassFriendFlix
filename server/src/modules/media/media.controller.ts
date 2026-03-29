import {
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Body,
  Headers,
  HttpCode,
  HttpStatus,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  NotFoundException,
  ParseIntPipe,
  Res,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { memoryStorage } from "multer";
import { Response } from "express";
import { createReadStream, existsSync, statSync } from "fs";
import { MediaService } from "./media.service";
import { Media } from "./entities/media.entity";
import { SubTrack } from "./entities/sub-track.entity";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { QueryJwtAuthGuard } from "../../common/guards/query-jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import { RoleName } from "../users/enums/role-name.enum";

@Controller("media")
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  // ── Admin-only endpoints ──────────────────────────────────────────────────

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleName.ADMIN)
  findAll(): Promise<Media[]> {
    return this.mediaService.findAll();
  }

  @Delete(":id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleName.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param("id", ParseIntPipe) id: number): Promise<void> {
    return this.mediaService.remove(id);
  }

  @Post(":id/subtracks")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleName.ADMIN)
  @UseInterceptors(FileInterceptor("file", { storage: memoryStorage() }))
  addSubTrack(
    @Param("id", ParseIntPipe) id: number,
    @Body("name") name: string,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<SubTrack> {
    return this.mediaService.createSubTrack(id, name, file);
  }

  @Delete(":id/subtracks/:trackId")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleName.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  removeSubTrack(
    @Param("id", ParseIntPipe) id: number,
    @Param("trackId", ParseIntPipe) trackId: number,
  ): Promise<void> {
    return this.mediaService.removeSubTrack(id, trackId);
  }

  // ── Authenticated-user endpoints ──────────────────────────────────────────

  @Get("list")
  @UseGuards(JwtAuthGuard)
  findAllForUsers(): Promise<Media[]> {
    return this.mediaService.findAll();
  }

  @Get(":id")
  @UseGuards(JwtAuthGuard)
  findOne(@Param("id", ParseIntPipe) id: number): Promise<Media> {
    return this.mediaService.findOne(id);
  }

  /**
   * Streams a subtitle file for a given subtrack.
   * Uses QueryJwtAuthGuard so <track src="...?token=..."> works without custom headers.
   */
  @Get(":id/subtracks/:trackId/stream")
  @UseGuards(QueryJwtAuthGuard)
  async streamSubTrack(
    @Param("id", ParseIntPipe) id: number,
    @Param("trackId", ParseIntPipe) trackId: number,
    @Res() res: Response,
  ): Promise<void> {
    const track = await this.mediaService.findSubTrack(id, trackId);
    if (!existsSync(track.path)) throw new NotFoundException("Subtitle file not found on disk");

    const ext = track.path.split(".").pop()?.toLowerCase();
    const contentType =
      ext === "vtt" ? "text/vtt" :
      ext === "srt" || ext === "ass" ? "text/plain" :
      "application/octet-stream";

    res.setHeader("Content-Type", `${contentType}; charset=utf-8`);
    createReadStream(track.path).pipe(res);
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
}
