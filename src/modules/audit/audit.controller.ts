import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AuditService } from './audit.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { StaffRole } from '../../common/enums/staff-role.enum';

@Controller('audit')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(StaffRole.FINANCE_ADMIN, StaffRole.IT_ADMIN)
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  getLogs(
    @Query('staffId') staffId?: string,
    @Query('branchId') branchId?: string,
    @Query('entityType') entityType?: string,
    @Query('action') action?: string,
    @Query('from') fromDate?: string,
    @Query('to') toDate?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.auditService.getLogs({
      staffId, branchId, entityType, action, fromDate, toDate, page, limit,
    });
  }
}
