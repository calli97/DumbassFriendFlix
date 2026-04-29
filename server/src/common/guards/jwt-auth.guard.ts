import { Injectable, ExecutionContext, UnauthorizedException, Logger } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  private readonly logger = new Logger(JwtAuthGuard.name);

  handleRequest<T>(err: any, user: T, info: any, context: ExecutionContext): T {
    if (err || !user) {
      const req = context.switchToHttp().getRequest();
      this.logger.warn(
        `Auth failed — ${req.method} ${req.path} — ${info?.message ?? err?.message ?? 'no token'}`,
      );
      throw err ?? new UnauthorizedException();
    }
    return user;
  }
}
