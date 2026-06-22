import {
  Injectable,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { StaffService } from '../staff/staff.service';
import { JwtPayload } from './strategies/jwt.strategy';

const MAX_FAILED_ATTEMPTS = 5;

@Injectable()
export class AuthService {
  constructor(
    private readonly staffService: StaffService,
    private readonly jwtService: JwtService,
  ) {}

  async login(username: string, password: string) {
    const staff = await this.staffService.findByUsername(username);

    if (!staff) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (staff.isLocked) {
      throw new ForbiddenException(
        'Account is locked. Contact your branch manager to unlock.',
      );
    }

    const passwordValid = await bcrypt.compare(password, staff.passwordHash);

    if (!passwordValid) {
      await this.staffService.incrementFailedLogins(staff.id);

      const updatedStaff = await this.staffService.findOne(staff.id);
      const remaining = MAX_FAILED_ATTEMPTS - (updatedStaff?.failedLoginCount ?? 0);

      if (remaining <= 0) {
        throw new ForbiddenException(
          'Account locked after 5 failed attempts. Contact your branch manager.',
        );
      }

      throw new UnauthorizedException(
        `Invalid credentials. ${remaining} attempt(s) remaining before lockout.`,
      );
    }

    await this.staffService.resetFailedLogins(staff.id);

    const payload: JwtPayload = {
      sub: staff.id,
      staffCode: staff.staffCode,
      role: staff.role,
      branchId: staff.branchId,
    };

    return {
      accessToken: this.jwtService.sign(payload),
      staff: {
        id: staff.id,
        staffCode: staff.staffCode,
        fullName: staff.fullName,
        role: staff.role,
        branchId: staff.branchId,
        terminalNumber: staff.terminalNumber,
      },
    };
  }

  async logout() {
    // JWT is stateless — client discards token.
    // For server-side invalidation, add a token denylist (Redis SET) here.
    return { message: 'Logged out successfully' };
  }
}
