import { IsString, IsOptional, MaxLength, IsUrl } from 'class-validator';

export class UpdateMediaDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  title?: string;

  @IsOptional()
  @IsUrl()
  @MaxLength(255)
  imdbLink?: string | null;
}
