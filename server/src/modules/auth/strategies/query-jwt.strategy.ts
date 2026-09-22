import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { ConfigService } from "@nestjs/config";
import { Request } from "express";
import {
  JwtPayload,
  AuthenticatedUser,
} from "../interfaces/jwt-payload.interface";
import { UsersService } from "../../users/users.service";

/**
 * JWT strategy that accepts the token from the Authorization header OR
 * a `?token=` query parameter. Used for endpoints where the browser
 * cannot set custom headers (e.g. <video src="...">).
 */
@Injectable()
export class QueryJwtStrategy extends PassportStrategy(Strategy, "query-jwt") {
  constructor(
    configService: ConfigService,
    private readonly usersService: UsersService,
  ) {
    const secret = configService.get<string>("JWT_SECRET");
    if (!secret)
      throw new Error("JWT_SECRET environment variable is not defined");

    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        ExtractJwt.fromAuthHeaderAsBearerToken(),
        (req: Request) => (req.query?.token as string) ?? null,
      ]),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  async validate(payload: JwtPayload): Promise<AuthenticatedUser> {
    if (!payload.sub || !payload.roles) {
      throw new UnauthorizedException("Invalid token payload");
    }
    // Reject tokens of users that were deleted after the token was issued
    if (!(await this.usersService.isActive(payload.sub))) {
      throw new UnauthorizedException("User no longer exists");
    }
    return {
      sub: payload.sub,
      email: payload.email,
      username: payload.username,
      roles: payload.roles,
    };
  }
}
