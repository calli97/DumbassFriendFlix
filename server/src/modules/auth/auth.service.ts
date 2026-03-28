import { Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcrypt";

import { UsersService } from "../users/users.service";
import { RoleName } from "../users/enums/role-name.enum";
import { User } from "../users/entities/user.entity";
import { RegisterDto } from "./dto/register.dto";
import { LoginDto } from "./dto/login.dto";
import { JwtPayload } from "./interfaces/jwt-payload.interface";

export interface LoginResponse {
  access_token: string;
  user: User;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  // Self-registration always assigns the USER role
  register(registerDto: RegisterDto): Promise<User> {
    return this.usersService.create({
      ...registerDto,
      roles: [RoleName.USER],
    });
  }

  async login(loginDto: LoginDto): Promise<LoginResponse> {
    const user = await this.usersService.findByUsername(loginDto.username);

    // Use a generic message to avoid leaking whether the email exists
    if (!user) {
      throw new UnauthorizedException("Invalid credentials");
    }

    const passwordMatch = await bcrypt.compare(
      loginDto.password,
      user.password,
    );
    if (!passwordMatch) {
      throw new UnauthorizedException("Invalid credentials");
    }
    console.log("ROLES: ", user.roles);
    // Build the JWT payload — see jwt-payload.interface.ts for field definitions
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      username: user.username,
      roles: user.roles.map((r) => r.name),
    };

    return {
      access_token: this.jwtService.sign(payload),
      // password is excluded from the response via @Exclude() on the entity
      user,
    };
  }

  getMe(userId: number): Promise<User> {
    return this.usersService.findOne(userId);
  }
}
