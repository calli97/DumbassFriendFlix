import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Request } from "./entities/request.entity";
import { CreateRequestDto } from "./dto/create-request.dto";
import { CreateRequestAdminDto } from "./dto/create-request-admin.dto";
import { UpdateRequestDto } from "./dto/update-request.dto";
import { User } from "../users/entities/user.entity";
import { Media } from "../media/entities/media.entity";
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
      relations: { recommendedBy: true, mediaLinked: true },
    }) as Promise<Request>;
  }

  async createAsAdmin(dto: CreateRequestAdminDto): Promise<Request> {
    const request = new Request();
    request.status = dto.status ?? RequestStatus.PENDING;
    request.comment = dto.comment ?? null;
    request.mediaLinked = dto.mediaId != null ? ({ id: dto.mediaId } as Media) : null;
    request.recommendedBy = dto.recommendedById != null ? ({ id: dto.recommendedById } as User) : null;

    const saved = await this.requestRepository.save(request);

    return this.requestRepository.findOne({
      where: { id: saved.id },
      relations: { recommendedBy: true, mediaLinked: true },
    }) as Promise<Request>;
  }

  async update(id: number, dto: UpdateRequestDto): Promise<Request> {
    const request = await this.requestRepository.findOne({ where: { id } });

    if (!request) {
      throw new NotFoundException(`Request with id ${id} not found`);
    }

    if (dto.status !== undefined) request.status = dto.status;
    if (dto.comment !== undefined) request.comment = dto.comment;
    if (dto.mediaId !== undefined) {
      request.mediaLinked = dto.mediaId !== null ? ({ id: dto.mediaId } as Media) : null;
    }
    if (dto.recommendedById !== undefined) {
      request.recommendedBy = dto.recommendedById !== null ? ({ id: dto.recommendedById } as User) : null;
    }

    const saved = await this.requestRepository.save(request);

    return this.requestRepository.findOne({
      where: { id: saved.id },
      relations: { recommendedBy: true, mediaLinked: true },
    }) as Promise<Request>;
  }

  async remove(id: number): Promise<void> {
    const request = await this.requestRepository.findOne({ where: { id } });

    if (!request) {
      throw new NotFoundException(`Request with id ${id} not found`);
    }

    await this.requestRepository.remove(request);
  }
}
