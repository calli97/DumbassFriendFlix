import { IsString, IsNotEmpty, MaxLength } from 'class-validator';

export class UploadMediaDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title: string;
}
