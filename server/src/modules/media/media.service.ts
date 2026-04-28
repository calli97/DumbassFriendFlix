import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { unlink } from "fs/promises";
import { existsSync } from "fs";
import { Media } from "./entities/media.entity";
import { MovieCapture } from "./entities/movie-capture.entity";

@Injectable()
export class MediaService {
  constructor(
    @InjectRepository(Media)
    private readonly mediaRepository: Repository<Media>,
    @InjectRepository(MovieCapture)
    private readonly captureRepository: Repository<MovieCapture>,
  ) {}

  async createFromTus(
    title: string,
    filePath: string,
    originalName: string,
    mimeType: string,
    storageType: "local" | "minio" = "local",
  ): Promise<Media> {
    const record = this.mediaRepository.create({
      title,
      path: filePath,
      originalName,
      mimeType,
      storageType,
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

  async update(id: number, data: { title?: string; imdbLink?: string | null }): Promise<Media> {
    const media = await this.findOne(id);
    Object.assign(media, data);
    return this.mediaRepository.save(media);
  }

  async remove(id: number): Promise<void> {
    const media = await this.findOne(id);

    await this.mediaRepository.delete(id);

    for (const filePath of [media.path, `${media.path}.info`]) {
      if (existsSync(filePath)) unlink(filePath).catch(() => undefined);
    }
  }

  findCaptures(mediaId: number): Promise<MovieCapture[]> {
    return this.captureRepository.find({ where: { mediaId }, order: { id: "ASC" } });
  }

  async addCapture(mediaId: number, url: string): Promise<MovieCapture> {
    await this.findOne(mediaId);
    const capture = this.captureRepository.create({ mediaId, url });
    return this.captureRepository.save(capture);
  }

  async removeCapture(mediaId: number, captureId: number): Promise<void> {
    const capture = await this.captureRepository.findOne({ where: { id: captureId, mediaId } });
    if (!capture) throw new NotFoundException(`Capture ${captureId} not found`);
    await this.captureRepository.delete(captureId);
  }
}
