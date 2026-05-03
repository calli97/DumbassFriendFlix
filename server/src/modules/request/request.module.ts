import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Request } from "./entities/request.entity";
import { RequestService } from "./request.service";
import { RequestController } from "./request.controller";

@Module({
  imports: [TypeOrmModule.forFeature([Request])],
  controllers: [RequestController],
  providers: [RequestService],
})
export class RequestModule {}
