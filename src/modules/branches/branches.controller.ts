import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { BranchesService } from './branches.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { StaffRole } from '../../common/enums/staff-role.enum';

@Controller('branches')
@UseGuards(JwtAuthGuard, RolesGuard)
export class BranchesController {
  constructor(private readonly branchesService: BranchesService) {}

  // All authenticated staff can read branches (feeds destination dropdown)
  @Get()
  findAll() {
    return this.branchesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.branchesService.findOne(id);
  }

  @Post()
  @Roles(StaffRole.IT_ADMIN)
  create(@Body() dto: { name: string; code: string; zone: string; address?: string }) {
    return this.branchesService.create(dto);
  }

  @Patch(':id')
  @Roles(StaffRole.IT_ADMIN, StaffRole.FINANCE_ADMIN)
  update(
    @Param('id') id: string,
    @Body() dto: { name?: string; zone?: string; address?: string; isActive?: boolean },
  ) {
    return this.branchesService.update(id, dto);
  }
}
