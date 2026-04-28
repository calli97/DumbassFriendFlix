import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany,
} from "typeorm";
import { MovieCapture } from "./movie-capture.entity";

@Entity("media")
export class Media {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: "varchar", length: 255 })
  title: string;

  /** Absolute path on disk where the file was saved */
  @Column({ type: "varchar", length: 1000 })
  path: string;

  @Column({ name: "original_name", type: "varchar", length: 255 })
  originalName: string;

  @Column({ name: "mime_type", type: "varchar", length: 100 })
  mimeType: string;

  @Column({ name: "imdb_link", type: "varchar", length: 255, nullable: true })
  imdbLink: string | null;

  @Column({ name: "storage_type", type: "varchar", length: 10, default: "local" })
  storageType: "local" | "minio";

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @OneToMany(() => MovieCapture, (capture) => capture.media)
  captures: MovieCapture[];
}
