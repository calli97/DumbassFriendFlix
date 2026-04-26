import { IsString, IsNotEmpty, MaxLength } from 'class-validator';

export class CreateMultipartDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  originalName: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  mimeType: string;
}
