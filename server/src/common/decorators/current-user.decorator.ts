import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { AuthenticatedUser } from '../../modules/auth/interfaces/jwt-payload.interface';

/**
 * Extracts the authenticated user from the request object.
 * Populated by JwtStrategy.validate() after a valid token is verified.
 *
 * Usage: @CurrentUser() user: AuthenticatedUser
 */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthenticatedUser => {
    const request = ctx.switchToHttp().getRequest<{ user: AuthenticatedUser }>();
    return request.user;
  },
);
