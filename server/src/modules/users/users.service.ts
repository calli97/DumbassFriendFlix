import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import * as bcrypt from 'bcrypt';

import { User } from './entities/user.entity';
import { Role } from './entities/role.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { RoleName } from './enums/role-name.enum';

const BCRYPT_SALT_ROUNDS = 10;

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,

    @InjectRepository(Role)
    private readonly rolesRepository: Repository<Role>,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    const { username, email, password, roles: roleNames } = createUserDto;

    // Guard against duplicate username or email
    const exists = await this.usersRepository.findOne({
      where: [{ username }, { email }],
    });
    if (exists) {
      throw new ConflictException('Username or email already in use');
    }

    // Resolve requested roles, fall back to USER if none provided
    const resolvedRoles = await this.resolveRoles(
      roleNames ?? [RoleName.USER],
    );

    const hashedPassword = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);

    const user = this.usersRepository.create({
      username,
      email,
      password: hashedPassword,
      roles: resolvedRoles,
    });

    return this.usersRepository.save(user);
  }

  findAll(): Promise<User[]> {
    return this.usersRepository.find();
  }

  async findOne(id: number): Promise<User> {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`User with id "${id}" not found`);
    }
    return user;
  }

  async update(id: number, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.findOne(id);

    const { password, roles: roleNames, username, email } = updateUserDto;

    // Check uniqueness only if the values are actually changing
    if (username && username !== user.username) {
      const taken = await this.usersRepository.findOne({ where: { username } });
      if (taken) throw new ConflictException('Username already in use');
    }

    if (email && email !== user.email) {
      const taken = await this.usersRepository.findOne({ where: { email } });
      if (taken) throw new ConflictException('Email already in use');
    }

    if (username) user.username = username;
    if (email) user.email = email;

    if (password) {
      user.password = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);
    }

    if (roleNames) {
      user.roles = await this.resolveRoles(roleNames);
    }

    return this.usersRepository.save(user);
  }

  async remove(id: number): Promise<void> {
    const user = await this.findOne(id);
    await this.usersRepository.remove(user);
  }

  // Used by AuthService to look up a user for login — password is in memory but
  // excluded from HTTP responses by @Exclude() + ClassSerializerInterceptor
  findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { email } });
  }

  // Resolves role names to Role entities, throwing if any name is invalid
  private async resolveRoles(roleNames: RoleName[]): Promise<Role[]> {
    if (!roleNames.length) {
      throw new BadRequestException('At least one role must be provided');
    }

    const roles = await this.rolesRepository.findBy({ name: In(roleNames) });

    if (roles.length !== roleNames.length) {
      const found = roles.map((r) => r.name);
      const missing = roleNames.filter((n) => !found.includes(n));
      throw new NotFoundException(`Roles not found: ${missing.join(', ')}`);
    }

    return roles;
  }
}
