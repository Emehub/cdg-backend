import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { FeeRulesService } from '../fee-rules/fee-rules.service';
import { ParcelStateMachine } from '../parcels/parcel-state-machine.service';
import { ConfirmPaymentDto } from './dto/confirm-payment.dto';
import { InitializePaymentDto } from './dto/initialize-payment.dto';
import { PaystackService } from './paystack.service';
import { ParcelStatus } from '../../common/enums/parcel-status.enum';
import { PaymentMethod } from '../../common/enums/payment-method.enum';

@Injectable()
export class PaymentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly feeRulesService: FeeRulesService,
    private readonly stateMachine: ParcelStateMachine,
    private readonly paystack: PaystackService,
  ) {}

  // ── CASH payments — still use manual confirm ────────────────────────────
  async confirm(
    parcelId: string,
    dto: ConfirmPaymentDto,
    idempotencyKey: string,
    staffId: string,
  ) {
    if (!idempotencyKey) {
      throw new BadRequestException('Idempotency-Key header is required');
    }

    const existingPayment = await this.prisma.payment.findUnique({
      where: { idempotencyKey },
    });
    if (existingPayment) {
      throw new ConflictException('Duplicate payment request rejected.');
    }

    const parcel = await this.prisma.parcel.findUnique({
      where: { id: parcelId },
      include: {
        destinationBranch: { select: { zone: true, name: true } },
        submittedByStaff: { select: { branchId: true } },
      },
    });
    if (!parcel) throw new NotFoundException(`Parcel ${parcelId} not found`);

    const allowedStatuses = [ParcelStatus.SUBMITTED, ParcelStatus.SMS_SENT, ParcelStatus.SMS_FAILED];
    if (!allowedStatuses.includes(parcel.status as ParcelStatus)) {
      throw new BadRequestException(
        `Cannot confirm payment. Parcel status is ${parcel.status}.`,
      );
    }

    const { valid, minFee } = await this.feeRulesService.validateFee(
      parcel.parcelType,
      parcel.destinationBranch.zone,
      dto.amountPaid,
    );
    if (!valid) {
      throw new BadRequestException(
        `Amount GHS ${dto.amountPaid} is below minimum GHS ${minFee}.`,
      );
    }

    if (dto.paymentMethod !== PaymentMethod.CASH && !dto.paymentReference?.trim()) {
      throw new BadRequestException('Payment reference required for MoMo/Card.');
    }

    return this.writeConfirmedPayment({
      parcelId,
      staffId,
      branchId: parcel.submittedByStaff?.branchId ?? '',
      paymentMethod: dto.paymentMethod,
      amountPaid: dto.amountPaid,
      amountCharged: Number(parcel.proposedFee),
      paymentReference: dto.paymentReference,
      idempotencyKey,
      parcelType: parcel.parcelType,
      destination: parcel.destinationBranch.name,
    });
  }

  // ── Paystack: initialize MoMo or Card charge ───────────────────────────
  async initializePaystackPayment(
    parcelId: string,
    dto: InitializePaymentDto,
    staffId: string,
  ) {
    const parcel = await this.prisma.parcel.findUnique({
      where: { id: parcelId },
      include: {
        destinationBranch: { select: { zone: true, name: true } },
        submittedByStaff: { select: { branchId: true } },
      },
    });
    if (!parcel) throw new NotFoundException(`Parcel ${parcelId} not found`);

    const allowedStatuses = [ParcelStatus.SUBMITTED, ParcelStatus.SMS_SENT, ParcelStatus.SMS_FAILED];
    if (!allowedStatuses.includes(parcel.status as ParcelStatus)) {
      throw new BadRequestException(
        `Cannot initialize payment. Parcel status is ${parcel.status}.`,
      );
    }

    // Validate fee before charging the customer
    const { valid, minFee } = await this.feeRulesService.validateFee(
      parcel.parcelType,
      parcel.destinationBranch.zone,
      dto.amountPaid,
    );
    if (!valid) {
      throw new BadRequestException(
        `Amount GHS ${dto.amountPaid} is below minimum GHS ${minFee}.`,
      );
    }

    const reference = this.paystack.generateReference('CDG-PAY');
    const metadata = {
      parcelId,
      staffId,
      destination: parcel.destinationBranch.name,
    };

    if (dto.paymentMethod === PaymentMethod.MOMO) {
      const result = await this.paystack.initializeMomoCharge({
        phone: dto.phone,
        network: dto.network,
        amountGhs: dto.amountPaid,
        reference,
        metadata,
      });

      if (result.status === 'failed') {
        throw new BadRequestException(
          `Paystack MoMo charge failed: ${result.message}`,
        );
      }

      return { reference: result.reference, status: result.status, message: result.message };
    }

    // CARD
    const email =
      dto.email ?? `${parcel.senderPhone.replace(/^0/, '233')}@cdglogistics.noreply`;
    const result = await this.paystack.initializeCardTransaction({
      email,
      amountGhs: dto.amountPaid,
      reference,
      metadata,
    });

    if (result.status === 'failed') {
      throw new BadRequestException(
        `Paystack card initialization failed: ${result.message}`,
      );
    }

    return {
      reference: result.reference,
      status: result.status,
      authorizationUrl: result.authorizationUrl,
      message: result.message,
    };
  }

  // ── Paystack: verify transaction and write confirmed payment ───────────
  async verifyAndConfirmPaystackPayment(
    parcelId: string,
    reference: string,
    staffId: string,
  ) {
    // Check for duplicate (same Paystack reference already confirmed)
    const existing = await this.prisma.payment.findUnique({
      where: { paystackReference: reference },
    });
    if (existing) {
      throw new ConflictException('This Paystack transaction is already recorded.');
    }

    const parcel = await this.prisma.parcel.findUnique({
      where: { id: parcelId },
      include: {
        destinationBranch: { select: { zone: true, name: true } },
        submittedByStaff: { select: { branchId: true } },
      },
    });
    if (!parcel) throw new NotFoundException(`Parcel ${parcelId} not found`);

    if (parcel.status === ParcelStatus.PAYMENT_CONFIRMED) {
      throw new ConflictException('Payment already confirmed for this parcel.');
    }

    const verify = await this.paystack.verifyTransaction(reference);

    if (verify.status !== 'success') {
      return {
        verified: false,
        status: verify.status,
        message: `Payment ${verify.status}. Awaiting customer confirmation.`,
      };
    }

    // Validate the amount Paystack reports against fee rules
    const { valid, minFee } = await this.feeRulesService.validateFee(
      parcel.parcelType,
      parcel.destinationBranch.zone,
      verify.amountPaid,
    );
    if (!valid) {
      throw new BadRequestException(
        `Paystack reported GHS ${verify.amountPaid} but minimum is GHS ${minFee}.`,
      );
    }

    // Determine payment method from the reference prefix (set during initialize)
    // We infer MOMO or CARD from the Paystack gateway response
    const paymentMethod = verify.gatewayResponse.toLowerCase().includes('mobile')
      ? PaymentMethod.MOMO
      : PaymentMethod.CARD;

    await this.writeConfirmedPayment({
      parcelId,
      staffId,
      branchId: parcel.submittedByStaff?.branchId ?? '',
      paymentMethod,
      amountPaid: verify.amountPaid,
      amountCharged: Number(parcel.proposedFee),
      paymentReference: reference,
      paystackReference: reference,
      idempotencyKey: reference,
      parcelType: parcel.parcelType,
      destination: parcel.destinationBranch.name,
    });

    return { verified: true, status: 'success', message: 'Payment confirmed via Paystack.' };
  }

  // ── Shared DB write ─────────────────────────────────────────────────────
  private async writeConfirmedPayment(params: {
    parcelId: string;
    staffId: string;
    branchId: string;
    paymentMethod: string;
    amountPaid: number;
    amountCharged: number;
    paymentReference?: string;
    paystackReference?: string;
    idempotencyKey: string;
    parcelType: string;
    destination: string;
  }) {
    const now = new Date();

    const { payment } = await this.prisma.$transaction(async (tx) => {
      const payment = await tx.payment.create({
        data: {
          parcelId: params.parcelId,
          paymentMethod: params.paymentMethod as PaymentMethod,
          amountPaid: params.amountPaid,
          paymentReference: params.paymentReference,
          paystackReference: params.paystackReference,
          idempotencyKey: params.idempotencyKey,
          confirmedByStaffId: params.staffId,
        },
      });
      await tx.parcel.update({
        where: { id: params.parcelId },
        data: { status: ParcelStatus.PAYMENT_CONFIRMED },
      });
      await tx.revenueEntry.create({
        data: {
          parcelId: params.parcelId,
          branchId: params.branchId,
          staffId: params.staffId,
          transactionDate: now,
          transactionTime: now,
          amountCharged: params.amountCharged,
          amountPaid: params.amountPaid,
          paymentMethod: params.paymentMethod as PaymentMethod,
          paymentReference: params.paymentReference,
          parcelType: params.parcelType as any,
          destination: params.destination,
        },
      });
      return { payment };
    });

    return {
      payment,
      parcelId: params.parcelId,
      status: ParcelStatus.PAYMENT_CONFIRMED,
      message: 'Payment confirmed. Proceed to generate receipt.',
    };
  }
}
