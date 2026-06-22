import {
  Controller,
  Post,
  Get,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ParcelsService } from './parcels.service';
import { CreateParcelDto } from './dto/create-parcel.dto';
import { UpdateParcelDraftDto } from './dto/update-parcel-draft.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { StaffRole } from '../../common/enums/staff-role.enum';
import { ParcelStatus } from '../../common/enums/parcel-status.enum';

@Controller('parcels')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ParcelsController {
  constructor(private readonly parcelsService: ParcelsService) {}

  @Post()
  @Roles(StaffRole.TERMINAL_STAFF, StaffRole.BRANCH_MANAGER, StaffRole.FINANCE_ADMIN, StaffRole.IT_ADMIN)
  create(@Body() dto: CreateParcelDto, @CurrentUser() user: any) {
    return this.parcelsService.create(dto, user.id);
  }

  @Patch(':id/draft')
  @Roles(StaffRole.TERMINAL_STAFF, StaffRole.BRANCH_MANAGER, StaffRole.FINANCE_ADMIN, StaffRole.IT_ADMIN)
  autosave(@Param('id') id: string, @Body() dto: UpdateParcelDraftDto) {
    return this.parcelsService.autosaveDraft(id, dto);
  }

  @Post(':id/submit')
  @Roles(StaffRole.TERMINAL_STAFF, StaffRole.BRANCH_MANAGER, StaffRole.FINANCE_ADMIN, StaffRole.IT_ADMIN)
  @HttpCode(HttpStatus.OK)
  submit(@Param('id') id: string, @CurrentUser() user: any) {
    return this.parcelsService.submit(id, user.id);
  }

  @Get()
  findAll(
    @CurrentUser() user: any,
    @Query('status') status?: ParcelStatus,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.parcelsService.findAll({
      branchId: user.branchId,
      status,
      page,
      limit,
    });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.parcelsService.findOne(id);
  }
}
