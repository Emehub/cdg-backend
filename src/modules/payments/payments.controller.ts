import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  Headers,
  UseGuards,
  HttpCode,
  HttpStatus,
  RawBodyRequest,
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import { PaymentsService } from './payments.service';
import { PaystackService } from './paystack.service';
import { ConfirmPaymentDto } from './dto/confirm-payment.dto';
import { InitializePaymentDto } from './dto/initialize-payment.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { StaffRole } from '../../common/enums/staff-role.enum';

@Controller('payments')
export class PaymentsController {
  constructor(
    private readonly paymentsService: PaymentsService,
    private readonly paystackService: PaystackService,
  ) {}

  // ── CASH: manual confirmation ──────────────────────────────────────────
  @Post(':parcelId/confirm')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(StaffRole.TERMINAL_STAFF, StaffRole.BRANCH_MANAGER, StaffRole.FINANCE_ADMIN, StaffRole.IT_ADMIN)
  @HttpCode(HttpStatus.OK)
  confirm(
    @Param('parcelId') parcelId: string,
    @Body() dto: ConfirmPaymentDto,
    @Headers('idempotency-key') idempotencyKey: string,
    @CurrentUser() user: any,
  ) {
    return this.paymentsService.confirm(parcelId, dto, idempotencyKey, user.id);
  }

  // ── Paystack: initialize MoMo or Card charge ───────────────────────────
  @Post(':parcelId/initialize')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(StaffRole.TERMINAL_STAFF, StaffRole.BRANCH_MANAGER, StaffRole.FINANCE_ADMIN, StaffRole.IT_ADMIN)
  @HttpCode(HttpStatus.OK)
  initialize(
    @Param('parcelId') parcelId: string,
    @Body() dto: InitializePaymentDto,
    @CurrentUser() user: any,
  ) {
    return this.paymentsService.initializePaystackPayment(parcelId, dto, user.id);
  }

  // ── Paystack: verify + confirm on success ──────────────────────────────
  @Get(':parcelId/verify/:reference')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(StaffRole.TERMINAL_STAFF, StaffRole.BRANCH_MANAGER, StaffRole.FINANCE_ADMIN, StaffRole.IT_ADMIN)
  verify(
    @Param('parcelId') parcelId: string,
    @Param('reference') reference: string,
    @CurrentUser() user: any,
  ) {
    return this.paymentsService.verifyAndConfirmPaystackPayment(
      parcelId,
      reference,
      user.id,
    );
  }

  // ── Paystack webhook (no auth — Paystack signs it) ────────────────────
  @Post('webhook/paystack')
  @HttpCode(HttpStatus.OK)
  async handleWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('x-paystack-signature') signature: string,
  ) {
    const rawBody = req.rawBody?.toString() ?? JSON.stringify(req.body);

    if (!this.paystackService.verifyWebhookSignature(rawBody, signature)) {
      return { received: false };
    }

    const event = req.body as { event: string; data: any };

    if (event.event === 'charge.success') {
      const { reference, metadata } = event.data;
      const { parcelId, staffId } = metadata ?? {};

      if (parcelId && staffId) {
        try {
          await this.paymentsService.verifyAndConfirmPaystackPayment(
            parcelId,
            reference,
            staffId,
          );
        } catch {
          // Already confirmed — safe to ignore
        }
      }
    }

    return { received: true };
  }
}
