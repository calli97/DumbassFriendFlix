import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { MediaService } from './media.service';
import { UploadMediaDto } from './dto/upload-media.dto';
import { Media } from './entities/media.entity';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { RoleName } from '../users/enums/role-name.enum';
import { buildMulterOptions } from '../../config/storage.config';

// STORE_PATH is guaranteed to be set and valid — validated in main.ts before bootstrap
const multerOptions = buildMulterOptions(process.env.STORE_PATH!);

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(RoleName.ADMIN)
@Controller('media')
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Post('upload')
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(FileInterceptor('file', multerOptions))
  async upload(
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: UploadMediaDto,
  ): Promise<Media> {
    if (!file) throw new BadRequestException('A video file is required');
    return this.mediaService.create(dto.title, file);
  }

  @Get()
  findAll(): Promise<Media[]> {
    return this.mediaService.findAll();
  }
}
