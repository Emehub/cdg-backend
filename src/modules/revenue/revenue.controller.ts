import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { RevenueService } from './revenue.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { StaffRole } from '../../common/enums/staff-role.enum';

@Controller('revenue')
@UseGuards(JwtAuthGuard, RolesGuard)
export class RevenueController {
  constructor(private readonly revenueService: RevenueService) {}

  @Get()
  @Roles(StaffRole.BRANCH_MANAGER, StaffRole.FINANCE_ADMIN, StaffRole.IT_ADMIN)
  findAll(
    @Query('branchId') branchId?: string,
    @Query('staffId') staffId?: string,
    @Query('from') fromDate?: string,
    @Query('to') toDate?: string,
    @Query('voided') voided?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.revenueService.findAll({
      branchId,
      staffId,
      fromDate,
      toDate,
      voided: voided !== undefined ? voided === 'true' : undefined,
      page,
      limit,
    });
  }

  // Step 1 of void — maker raises the request
  @Post(':id/void-request')
  @Roles(StaffRole.BRANCH_MANAGER, StaffRole.FINANCE_ADMIN)
  @HttpCode(HttpStatus.OK)
  requestVoid(
    @Param('id') id: string,
    @Body() dto: { reason: string },
    @CurrentUser() user: any,
  ) {
    return this.revenueService.requestVoid(id, dto, user.id);
  }

  // Step 2 of void — checker (different person) approves
  @Post(':id/void-approve')
  @Roles(StaffRole.BRANCH_MANAGER, StaffRole.FINANCE_ADMIN, StaffRole.IT_ADMIN)
  @HttpCode(HttpStatus.OK)
  approveVoid(@Param('id') id: string, @CurrentUser() user: any) {
    return this.revenueService.approveVoid(id, user.id);
  }
}
