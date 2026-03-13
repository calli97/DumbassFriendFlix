import { RoleName } from '../../users/enums/role-name.enum';

/**
 * Shape of the data encoded inside the JWT token.
 * This is the single source of truth for what goes into the token.
 * To add or remove fields from the token, edit this interface and
 * update AuthService.login() accordingly.
 */
export interface JwtPayload {
  /** User UUID — mapped to the standard JWT "subject" claim */
  sub: string;
  email: string;
  username: string;
  /** Role names at the time the token was issued */
  roles: RoleName[];
}

/**
 * Shape of request.user after the JWT strategy validates a token.
 * Mirrors JwtPayload but is the runtime type used in guards and decorators.
 */
export interface AuthenticatedUser {
  sub: string;
  email: string;
  username: string;
  roles: RoleName[];
}
