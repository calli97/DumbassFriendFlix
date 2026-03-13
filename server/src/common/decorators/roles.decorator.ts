import { SetMetadata } from '@nestjs/common';
import { RoleName } from '../../modules/users/enums/role-name.enum';

export const ROLES_KEY = 'roles';

/** Attach required roles to a controller or route handler */
export const Roles = (...roles: RoleName[]) => SetMetadata(ROLES_KEY, roles);
