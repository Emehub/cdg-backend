import { SetMetadata } from '@nestjs/common';
import { StaffRole } from '../enums/staff-role.enum';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: StaffRole[]) => SetMetadata(ROLES_KEY, roles);
