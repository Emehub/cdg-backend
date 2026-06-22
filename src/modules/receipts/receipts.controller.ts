import {
  Controller,
  Post,
  Get,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ReceiptsService } from './receipts.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { StaffRole } from '../../common/enums/staff-role.enum';

@Controller('receipts')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ReceiptsController {
  constructor(private readonly receiptsService: ReceiptsService) {}

  @Post(':parcelId/generate')
  @Roles(StaffRole.TERMINAL_STAFF, StaffRole.BRANCH_MANAGER, StaffRole.FINANCE_ADMIN, StaffRole.IT_ADMIN)
  @HttpCode(HttpStatus.CREATED)
  generate(@Param('parcelId') parcelId: string, @CurrentUser() user: any) {
    return this.receiptsService.generate(parcelId, user.id);
  }

  @Get(':parcelId/reprint')
  @Roles(
    StaffRole.TERMINAL_STAFF,
    StaffRole.BRANCH_MANAGER,
    StaffRole.FINANCE_ADMIN,
  )
  reprint(@Param('parcelId') parcelId: string) {
    return this.receiptsService.reprint(parcelId);
  }
}
