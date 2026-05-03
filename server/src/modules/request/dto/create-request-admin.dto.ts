import { IsEnum, IsInt, IsOptional, IsString, Min } from "class-validator";
import { RequestStatus } from "../enums/request-status.enum";

export class CreateRequestAdminDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsEnum(RequestStatus)
  status?: RequestStatus;

  @IsOptional()
  @IsString()
  comment?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  recommendedById?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  mediaId?: number;
}
