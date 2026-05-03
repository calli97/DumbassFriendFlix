import { IsEnum, IsOptional, IsString } from "class-validator";
import { RequestStatus } from "../enums/request-status.enum";

export class CreateRequestDto {
  @IsOptional()
  @IsEnum(RequestStatus)
  status?: RequestStatus;

  @IsOptional()
  @IsString()
  comment?: string;
}
