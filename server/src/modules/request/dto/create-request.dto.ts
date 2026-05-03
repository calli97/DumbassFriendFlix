import { IsOptional, IsString } from "class-validator";

export class CreateRequestDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  comment?: string;
}
