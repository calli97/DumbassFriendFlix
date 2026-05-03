import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Request } from "./entities/request.entity";
import { CreateRequestDto } from "./dto/create-request.dto";
import { User } from "../users/entities/user.entity";
import { RequestStatus } from "./enums/request-status.enum";

@Injectable()
export class RequestService {
  constructor(
    @InjectRepository(Request)
    private readonly requestRepository: Repository<Request>,
  ) {}

  async create(dto: CreateRequestDto, userId: number): Promise<Request> {
    const request = new Request();
    request.status = dto.status ?? RequestStatus.PENDING;
    request.comment = dto.comment ?? null;
    request.mediaLinked = null;
    request.recommendedBy = { id: userId } as User;

    const saved = await this.requestRepository.save(request);

    return this.requestRepository.findOne({
      where: { id: saved.id },
      relations: { recommendedBy: true },
    }) as Promise<Request>;
  }
}
