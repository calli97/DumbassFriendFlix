import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from "typeorm";
import { Media } from "./media.entity";

@Entity("movie_capture")
export class MovieCapture {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: "varchar", length: 2000 })
  url: string;

  @Column({ name: "media_id" })
  mediaId: number;

  @ManyToOne(() => Media, (media) => media.captures, { onDelete: "CASCADE" })
  @JoinColumn({ name: "media_id" })
  media: Media;
}
