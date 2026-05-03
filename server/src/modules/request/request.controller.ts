import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
  DefaultValuePipe,
} from "@nestjs/common";
import { RequestService } from "./request.service";
import { CreateRequestDto } from "./dto/create-request.dto";
import { CreateRequestAdminDto } from "./dto/create-request-admin.dto";
import { UpdateRequestDto } from "./dto/update-request.dto";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { AuthenticatedUser } from "../auth/interfaces/jwt-payload.interface";
import { RoleName } from "../users/enums/role-name.enum";
import { Request } from "./entities/request.entity";

@Controller("requests")
export class RequestController {
  constructor(private readonly requestService: RequestService) {}

  // ── User endpoints ────────────────────────────────────────────────────────

  @Get()
  @UseGuards(JwtAuthGuard)
  findAll(
    @Query("page", new DefaultValuePipe(1), ParseIntPipe) page: number,
  ): Promise<{ data: Request[]; total: number; page: number; limit: number }> {
    return this.requestService.findAll(page);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  create(
    @Body() dto: CreateRequestDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<Request> {
    return this.requestService.create(dto, user.sub);
  }

  // ── Admin endpoints ───────────────────────────────────────────────────────

  @Post("admin")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleName.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  createAsAdmin(@Body() dto: CreateRequestAdminDto): Promise<Request> {
    return this.requestService.createAsAdmin(dto);
  }

  @Patch(":id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleName.ADMIN)
  update(
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: UpdateRequestDto,
  ): Promise<Request> {
    return this.requestService.update(id, dto);
  }

  @Delete(":id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleName.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param("id", ParseIntPipe) id: number): Promise<void> {
    return this.requestService.remove(id);
  }
}
