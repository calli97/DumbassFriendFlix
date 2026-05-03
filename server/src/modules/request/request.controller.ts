import { Controller, Post, Body, UseGuards, HttpCode, HttpStatus } from "@nestjs/common";
import { RequestService } from "./request.service";
import { CreateRequestDto } from "./dto/create-request.dto";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { AuthenticatedUser } from "../auth/interfaces/jwt-payload.interface";
import { Request } from "./entities/request.entity";

@Controller("requests")
export class RequestController {
  constructor(private readonly requestService: RequestService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  create(
    @Body() dto: CreateRequestDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<Request> {
    return this.requestService.create(dto, user.sub);
  }
}
