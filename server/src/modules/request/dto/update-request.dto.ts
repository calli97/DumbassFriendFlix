import { IsEnum, IsInt, IsOptional, IsString, Min, ValidateIf } from "class-validator";
import { RequestStatus } from "../enums/request-status.enum";

export class UpdateRequestDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEnum(RequestStatus)
  status?: RequestStatus;

  @ValidateIf((o: UpdateRequestDto) => o.comment !== null)
  @IsOptional()
  @IsString()
  comment?: string | null;

  @ValidateIf((o: UpdateRequestDto) => o.recommendedById !== null)
  @IsOptional()
  @IsInt()
  @Min(1)
  recommendedById?: number | null;

  @ValidateIf((o: UpdateRequestDto) => o.mediaId !== null)
  @IsOptional()
  @IsInt()
  @Min(1)
  mediaId?: number | null;
}
