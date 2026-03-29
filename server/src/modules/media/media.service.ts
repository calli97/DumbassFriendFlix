import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { unlink, writeFile } from "fs/promises";
import { existsSync } from "fs";
import * as path from "path";
import { Media } from "./entities/media.entity";
import { SubTrack } from "./entities/sub-track.entity";

function sanitizeFilename(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "");
}

@Injectable()
export class MediaService {
  constructor(
    @InjectRepository(Media)
    private readonly mediaRepository: Repository<Media>,
    @InjectRepository(SubTrack)
    private readonly subTrackRepository: Repository<SubTrack>,
  ) {}

  async createFromTus(
    title: string,
    filePath: string,
    originalName: string,
    mimeType: string,
  ): Promise<Media> {
    const record = this.mediaRepository.create({
      title,
      path: filePath,
      originalName,
      mimeType,
    });
    return this.mediaRepository.save(record);
  }

  findAll(): Promise<Media[]> {
    return this.mediaRepository.find({ order: { createdAt: "DESC" } });
  }

  async findOne(id: number): Promise<Media> {
    const media = await this.mediaRepository.findOne({ where: { id } });
    if (!media) throw new NotFoundException(`Media with id "${id}" not found`);
    return media;
  }

  async createSubTrack(
    mediaId: number,
    name: string,
    file: Express.Multer.File,
  ): Promise<SubTrack> {
    const media = await this.findOne(mediaId);
    const storePath = process.env.STORE_PATH!;
    const ext = path.extname(file.originalname);
    const filename = `${sanitizeFilename(media.title)}_${sanitizeFilename(name)}${ext}`;
    const filePath = path.join(storePath, filename);
    await writeFile(filePath, file.buffer);
    const track = this.subTrackRepository.create({ name, path: filePath, media });
    return this.subTrackRepository.save(track);
  }

  async findSubTrack(mediaId: number, trackId: number): Promise<SubTrack> {
    const track = await this.subTrackRepository.findOne({
      where: { id: trackId, mediaId },
    });
    if (!track) throw new NotFoundException(`SubTrack with id "${trackId}" not found`);
    return track;
  }

  async removeSubTrack(mediaId: number, trackId: number): Promise<void> {
    const track = await this.findSubTrack(mediaId, trackId);
    await this.subTrackRepository.delete(trackId);
    if (existsSync(track.path)) unlink(track.path).catch(() => undefined);
  }

  async remove(id: number): Promise<void> {
    const media = await this.findOne(id);

    // Collect subtrack file paths before deleting the DB record
    const subTrackPaths = media.subTracks.map((t) => t.path);

    await this.mediaRepository.delete(id);

    for (const filePath of [media.path, `${media.path}.info`]) {
      if (existsSync(filePath)) unlink(filePath).catch(() => undefined);
    }

    for (const filePath of subTrackPaths) {
      if (existsSync(filePath)) unlink(filePath).catch(() => undefined);
    }
  }
}
