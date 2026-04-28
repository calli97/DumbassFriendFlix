import { IsString, IsNotEmpty, MaxLength } from "class-validator";

export class CreateMovieCaptureDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  url: string;
}
