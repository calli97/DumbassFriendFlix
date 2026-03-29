import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { MediaController } from "./media.controller";
import { MediaService } from "./media.service";
import { Media } from "./entities/media.entity";
import { SubTrack } from "./entities/sub-track.entity";

@Module({
  imports: [TypeOrmModule.forFeature([Media, SubTrack])],
  controllers: [MediaController],
  providers: [MediaService],
  exports: [MediaService],
})
export class MediaModule {}
