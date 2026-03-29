import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany,
} from "typeorm";
import { SubTrack } from "./sub-track.entity";

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

  @OneToMany(() => SubTrack, (subTrack) => subTrack.media, {
    cascade: true,
    eager: true,
  })
  subTracks: SubTrack[];

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;
}
