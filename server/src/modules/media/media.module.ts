import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { MediaController } from "./media.controller";
import { MediaService } from "./media.service";
import { MinioService } from "./minio.service";
import { Media } from "./entities/media.entity";
import { MovieCapture } from "./entities/movie-capture.entity";

@Module({
  imports: [TypeOrmModule.forFeature([Media, MovieCapture])],
  controllers: [MediaController],
  providers: [MediaService, MinioService],
  exports: [MediaService],
})
export class MediaModule {}
