import { Controller, Get, Post, Patch, Param, Body, UseGuards } from '@nestjs/common';
import { StaffService } from './staff.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { StaffRole } from '../../common/enums/staff-role.enum';

@Controller('staff')
@UseGuards(JwtAuthGuard, RolesGuard)
export class StaffController {
  constructor(private readonly staffService: StaffService) {}

  @Get()
  findAll() {
    return this.staffService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.staffService.findOne(id);
  }

  @Post()
  @Roles(StaffRole.IT_ADMIN)
  create(@Body() dto: any) {
    return this.staffService.create(dto);
  }

  @Patch(':id')
  @Roles(StaffRole.IT_ADMIN, StaffRole.BRANCH_MANAGER)
  update(
    @Param('id') id: string,
    @Body() dto: { fullName?: string; role?: string; branchId?: string; terminalNumber?: string },
  ) {
    return this.staffService.update(id, dto);
  }

  @Patch(':id/lock')
  @Roles(StaffRole.IT_ADMIN, StaffRole.BRANCH_MANAGER)
  lock(@Param('id') id: string) {
    return this.staffService.lock(id);
  }

  @Patch(':id/unlock')
  @Roles(StaffRole.IT_ADMIN, StaffRole.BRANCH_MANAGER)
  unlock(@Param('id') id: string) {
    return this.staffService.unlock(id);
  }

  @Patch(':id/deactivate')
  @Roles(StaffRole.IT_ADMIN)
  deactivate(@Param('id') id: string) {
    return this.staffService.deactivate(id);
  }
}
