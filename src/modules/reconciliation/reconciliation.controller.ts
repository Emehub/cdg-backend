import {
  Controller,
  Get,
  Post,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ReconciliationService } from './reconciliation.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { StaffRole } from '../../common/enums/staff-role.enum';

@Controller('reconciliation')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(StaffRole.BRANCH_MANAGER, StaffRole.FINANCE_ADMIN, StaffRole.IT_ADMIN)
export class ReconciliationController {
  constructor(private readonly reconciliationService: ReconciliationService) {}

  @Get('summary')
  getSummary(
    @Query('branchId') branchId: string,
    @Query('date') date: string,
  ) {
    return this.reconciliationService.getSummary(branchId, date);
  }

  @Post('run')
  @HttpCode(HttpStatus.OK)
  runOnDemand(
    @Query('branchId') branchId: string,
    @Query('date') date: string,
  ) {
    return this.reconciliationService.run(branchId, date);
  }

  @Get('discrepancies')
  getDiscrepancies(
    @Query('from') fromDate: string,
    @Query('to') toDate: string,
  ) {
    return this.reconciliationService.getDiscrepancies(fromDate, toDate);
  }
}
