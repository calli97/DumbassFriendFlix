import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';
import { SubtitleTrack } from '../subtitle-extractor';

@Entity('media')
export class Media {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  /** Absolute path on disk where the file was saved */
  @Column({ type: 'varchar', length: 1000 })
  path: string;

  @Column({ name: 'original_name', type: 'varchar', length: 255 })
  originalName: string;

  @Column({ name: 'mime_type', type: 'varchar', length: 100 })
  mimeType: string;

  @Column({ name: 'subtitle_tracks', type: 'json', nullable: true })
  subtitleTracks: SubtitleTrack[] | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
