import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { Media } from "./media.entity";

@Entity("sub_tracks")
export class SubTrack {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: "varchar", length: 255 })
  name: string;

  @Column({ type: "varchar", length: 1000 })
  path: string;

  @ManyToOne(() => Media, (media) => media.subTracks, { onDelete: "CASCADE" })
  @JoinColumn({ name: "media_id" })
  media: Media;

  @Column({ name: "media_id" })
  mediaId: number;
}
