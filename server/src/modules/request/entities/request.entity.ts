import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToOne,
  JoinColumn,
} from "typeorm";
import { Media } from "../../media/entities/media.entity";
import { User } from "../../users/entities/user.entity";
import { RequestStatus } from "../enums/request-status.enum";

@Entity("requests")
export class Request {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    type: "varchar",
    length: 20,
    default: RequestStatus.PENDING,
  })
  status: RequestStatus;

  @Column({ type: "text", nullable: true })
  comment: string | null;

  @OneToOne(() => Media, { nullable: true, eager: false })
  @JoinColumn({ name: "media_id" })
  mediaLinked: Media | null;

  @OneToOne(() => User, { nullable: true, eager: false })
  @JoinColumn({ name: "recommended_by_id" })
  recommendedBy: User | null;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;
}
