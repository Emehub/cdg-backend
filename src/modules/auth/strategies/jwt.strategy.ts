import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { StaffService } from '../../staff/staff.service';

export interface JwtPayload {
  sub: string;
  staffCode: string;
  role: string;
  branchId: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    config: ConfigService,
    private readonly staffService: StaffService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get<string>('app.jwtSecret'),
    });
  }

  async validate(payload: JwtPayload) {
    const staff = await this.staffService.findOne(payload.sub);
    if (!staff || !staff.isActive || staff.isLocked) {
      throw new UnauthorizedException('Account is inactive or locked');
    }
    return staff;
  }
}
