import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { TrackingService } from './tracking.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { StaffRole } from '../../common/enums/staff-role.enum';

@Controller('tracking')
export class TrackingController {
  constructor(private readonly trackingService: TrackingService) {}

  // ── Public endpoints (no auth — recipient self-service) ──────────────────

  @Get(':trackingId')
  lookup(@Param('trackingId') trackingId: string) {
    return this.trackingService.lookup(trackingId);
  }

  @Post(':trackingId/verify-otp')
  @HttpCode(HttpStatus.OK)
  verifyOtp(
    @Param('trackingId') trackingId: string,
    @Body() dto: { otp: string },
  ) {
    return this.trackingService.verifyOtp(trackingId, dto.otp);
  }

  @Post(':trackingId/resend-otp')
  @HttpCode(HttpStatus.OK)
  resendOtp(@Param('trackingId') trackingId: string) {
    return this.trackingService.resendOtp(trackingId);
  }

  // ── Staff-only endpoints ─────────────────────────────────────────────────

  @Post(':trackingId/dispatch')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(StaffRole.TERMINAL_STAFF, StaffRole.BRANCH_MANAGER)
  @HttpCode(HttpStatus.OK)
  dispatch(
    @Param('trackingId') trackingId: string,
    @CurrentUser() user: any,
  ) {
    return this.trackingService.dispatch(trackingId, user.id);
  }

  @Post(':trackingId/arrived')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(StaffRole.TERMINAL_STAFF, StaffRole.BRANCH_MANAGER)
  @HttpCode(HttpStatus.OK)
  markArrived(
    @Param('trackingId') trackingId: string,
    @CurrentUser() user: any,
  ) {
    return this.trackingService.markArrived(trackingId, user.id);
  }

  @Post(':trackingId/handover')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(StaffRole.TERMINAL_STAFF, StaffRole.BRANCH_MANAGER)
  @HttpCode(HttpStatus.OK)
  recordHandover(
    @Param('trackingId') trackingId: string,
    @Body()
    dto: {
      conditionOk: boolean;
      conditionNotes?: string;
      receivedByName: string;
      idType?: string;
      idNumber?: string;
    },
    @CurrentUser() user: any,
  ) {
    return this.trackingService.recordHandover(trackingId, dto, user.id);
  }

  @Post(':trackingId/failed-delivery')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(StaffRole.TERMINAL_STAFF, StaffRole.BRANCH_MANAGER)
  @HttpCode(HttpStatus.OK)
  markFailed(
    @Param('trackingId') trackingId: string,
    @Body() dto: { reason: string; attemptedAt?: string },
    @CurrentUser() user: any,
  ) {
    return this.trackingService.markFailed(trackingId, dto, user.id);
  }

  @Post(':trackingId/returned')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(StaffRole.TERMINAL_STAFF, StaffRole.BRANCH_MANAGER)
  @HttpCode(HttpStatus.OK)
  markReturned(
    @Param('trackingId') trackingId: string,
    @CurrentUser() user: any,
  ) {
    return this.trackingService.markReturned(trackingId, user.id);
  }
}
