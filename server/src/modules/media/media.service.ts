import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { unlink } from 'fs/promises';
import { existsSync } from 'fs';
import { Media } from './entities/media.entity';
import { SubtitleTrack } from './subtitle-extractor';

@Injectable()
export class MediaService {
  constructor(
    @InjectRepository(Media)
    private readonly mediaRepository: Repository<Media>,
  ) {}

  async createFromTus(title: string, filePath: string, originalName: string, mimeType: string): Promise<Media> {
    const record = this.mediaRepository.create({ title, path: filePath, originalName, mimeType });
    return this.mediaRepository.save(record);
  }

  findAll(): Promise<Media[]> {
    return this.mediaRepository.find({ order: { createdAt: 'DESC' } });
  }

  async findOne(id: number): Promise<Media> {
    const media = await this.mediaRepository.findOne({ where: { id } });
    if (!media) throw new NotFoundException(`Media with id "${id}" not found`);
    return media;
  }

  async updateSubtitleTracks(id: number, tracks: SubtitleTrack[]): Promise<void> {
    await this.mediaRepository.update(id, { subtitleTracks: tracks });
  }

  async remove(id: number): Promise<void> {
    const media = await this.findOne(id);
    await this.mediaRepository.delete(id);

    // Delete the video file and the tus .info sidecar
    for (const filePath of [media.path, `${media.path}.info`]) {
      if (existsSync(filePath)) unlink(filePath).catch(() => undefined);
    }

    // Delete extracted subtitle .vtt files
    for (const track of media.subtitleTracks ?? []) {
      if (existsSync(track.vttPath)) unlink(track.vttPath).catch(() => undefined);
    }
  }
}
