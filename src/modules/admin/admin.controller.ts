import {
  Controller,
  Get,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { StaffRole } from '../../common/enums/staff-role.enum';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(StaffRole.BRANCH_MANAGER, StaffRole.FINANCE_ADMIN, StaffRole.IT_ADMIN)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('dashboard')
  getDashboard() {
    return this.adminService.getDashboardKpis();
  }

  @Get('transactions')
  getTransactions(
    @Query('branchId') branchId?: string,
    @Query('staffId') staffId?: string,
    @Query('status') status?: string,
    @Query('from') fromDate?: string,
    @Query('to') toDate?: string,
    @Query('search') search?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.adminService.getTransactions({
      branchId, staffId, status, fromDate, toDate, search, page, limit,
    });
  }

  @Get('reports/revenue')
  getRevenueReport(
    @Query('branchId') branchId?: string,
    @Query('from') fromDate: string = new Date().toISOString().split('T')[0],
    @Query('to') toDate: string = new Date().toISOString().split('T')[0],
    @Query('groupBy') groupBy?: 'branch' | 'staff' | 'paymentMethod' | 'parcelType' | 'destination',
  ) {
    return this.adminService.getRevenueReport({ branchId, fromDate, toDate, groupBy });
  }

  @Get('reports/discrepancy')
  getDiscrepancyReport(
    @Query('branchId') branchId?: string,
    @Query('from') fromDate?: string,
    @Query('to') toDate?: string,
  ) {
    return this.adminService.getDiscrepancyReport({ branchId, fromDate, toDate });
  }

  @Get('reports/staff-performance')
  getStaffPerformance(
    @Query('branchId') branchId?: string,
    @Query('from') fromDate: string = new Date().toISOString().split('T')[0],
    @Query('to') toDate: string = new Date().toISOString().split('T')[0],
  ) {
    return this.adminService.getStaffPerformance({ branchId, fromDate, toDate });
  }
}
