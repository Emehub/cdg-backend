import {
  Controller,
  Post,
  Get,
  Param,
  Res,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
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

  @Get(':parcelId/pdf')
  @Roles(StaffRole.TERMINAL_STAFF, StaffRole.BRANCH_MANAGER, StaffRole.FINANCE_ADMIN, StaffRole.IT_ADMIN)
  async streamPdf(@Param('parcelId') parcelId: string, @Res() res: Response) {
    const pdfBuffer = await this.receiptsService.reprintPdf(parcelId);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'inline; filename="receipt.pdf"',
      'Content-Length': pdfBuffer.length,
    });
    res.end(pdfBuffer);
  }
}
