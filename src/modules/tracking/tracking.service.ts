import {
  Injectable,
  NotFoundException,
  BadRequestException,
  GoneException,
  Logger,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../database/prisma.service';
import { SmsService } from '../sms/sms.service';
import { ParcelStateMachine } from '../parcels/parcel-state-machine.service';
import { ParcelStatus } from '../../common/enums/parcel-status.enum';

const OTP_TTL_MINUTES = 30;
const OTP_SALT_ROUNDS = 10;

@Injectable()
export class TrackingService {
  private readonly logger = new Logger(TrackingService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly smsService: SmsService,
    private readonly stateMachine: ParcelStateMachine,
  ) {}

  // Public — no auth required (recipient self-service)
  async lookup(trackingId: string) {
    const parcel = await this.prisma.parcel.findFirst({
      where: { trackingId },
      select: {
        trackingId: true,
        status: true,
        senderFullName: true,
        receiverFullName: true,
        receiverPhone: true,
        parcelType: true,
        description: true,
        createdAt: true,
        submittedAt: true,
        smsSentAt: true,
        destinationBranch: { select: { name: true, code: true } },
        payment: { select: { paymentMethod: true, createdAt: true } },
        receipt: { select: { receiptNumber: true, createdAt: true } },
      },
    });

    if (!parcel) {
      throw new NotFoundException(
        `Tracking ID ${trackingId} not found. Check the ID and try again.`,
      );
    }

    return {
      ...parcel,
      timeline: this.buildTimeline(parcel),
    };
  }

  async dispatch(trackingId: string, staffId: string) {
    const parcel = await this.assertByTrackingId(trackingId);
    this.stateMachine.assertCanTransitionTo(
      parcel.status as ParcelStatus,
      ParcelStatus.IN_TRANSIT,
    );

    return this.prisma.parcel.update({
      where: { id: parcel.id },
      data: { status: ParcelStatus.IN_TRANSIT },
      select: { trackingId: true, status: true },
    });
  }

  async markArrived(trackingId: string, staffId: string) {
    const parcel = await this.assertByTrackingId(trackingId);
    this.stateMachine.assertCanTransitionTo(
      parcel.status as ParcelStatus,
      ParcelStatus.ARRIVED,
    );

    const updated = await this.prisma.parcel.update({
      where: { id: parcel.id },
      data: { status: ParcelStatus.ARRIVED },
      include: { destinationBranch: true },
    });

    // Generate and send OTP to receiver on arrival
    await this.issueOtp(parcel.id, parcel.receiverPhone);

    this.logger.log(`Parcel ${trackingId} arrived. OTP sent to ${parcel.receiverPhone}`);
    return { trackingId, status: ParcelStatus.ARRIVED, otpSent: true };
  }

  async verifyOtp(trackingId: string, otp: string) {
    const parcel = await this.assertByTrackingId(trackingId);

    if (parcel.status !== ParcelStatus.ARRIVED) {
      throw new BadRequestException(
        `OTP verification only valid when parcel status is ARRIVED. Current: ${parcel.status}`,
      );
    }

    const validOtp = await this.prisma.parcelOtp.findFirst({
      where: {
        parcelId: parcel.id,
        used: false,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!validOtp) {
      throw new GoneException(
        'OTP has expired or already been used. Request a new OTP.',
      );
    }

    const isValid = await bcrypt.compare(otp, validOtp.otpHash);
    if (!isValid) {
      throw new BadRequestException('Invalid OTP. Check the code and try again.');
    }

    // Mark OTP as used
    await this.prisma.parcelOtp.update({
      where: { id: validOtp.id },
      data: { used: true },
    });

    return { verified: true, trackingId, message: 'OTP verified. Proceed to handover.' };
  }

  async resendOtp(trackingId: string) {
    const parcel = await this.assertByTrackingId(trackingId);

    if (parcel.status !== ParcelStatus.ARRIVED) {
      throw new BadRequestException(
        'Can only resend OTP when parcel has arrived at destination branch.',
      );
    }

    await this.issueOtp(parcel.id, parcel.receiverPhone);
    return { message: `New OTP sent to ${parcel.receiverPhone.slice(0, 4)}****` };
  }

  async recordHandover(
    trackingId: string,
    dto: {
      conditionOk: boolean;
      conditionNotes?: string;
      receivedByName: string;
      idType?: string;
      idNumber?: string;
    },
    staffId: string,
  ) {
    const parcel = await this.assertByTrackingId(trackingId);

    if (parcel.status !== ParcelStatus.ARRIVED) {
      throw new BadRequestException(
        `Handover can only be recorded when parcel is ARRIVED. Current: ${parcel.status}`,
      );
    }

    if (!dto.conditionOk) {
      this.logger.warn(
        `Parcel ${trackingId} handed over with condition flag: ${dto.conditionNotes}`,
      );
    }

    // Advance to DELIVERED on handover completion
    const updated = await this.prisma.parcel.update({
      where: { id: parcel.id },
      data: { status: ParcelStatus.DELIVERED },
      select: { trackingId: true, status: true },
    });

    this.logger.log(
      `Parcel ${trackingId} delivered to ${dto.receivedByName} — condition OK: ${dto.conditionOk}`,
    );

    return {
      ...updated,
      handover: {
        receivedByName: dto.receivedByName,
        conditionOk: dto.conditionOk,
        conditionNotes: dto.conditionNotes,
        completedAt: new Date(),
      },
    };
  }

  async markDelivered(trackingId: string, staffId: string) {
    const parcel = await this.assertByTrackingId(trackingId);
    this.stateMachine.assertCanTransitionTo(
      parcel.status as ParcelStatus,
      ParcelStatus.DELIVERED,
    );

    return this.prisma.parcel.update({
      where: { id: parcel.id },
      data: { status: ParcelStatus.DELIVERED },
      select: { trackingId: true, status: true },
    });
  }

  async markFailed(
    trackingId: string,
    dto: { reason: string; attemptedAt?: string },
    staffId: string,
  ) {
    const parcel = await this.assertByTrackingId(trackingId);

    const allowedForFailure = [
      ParcelStatus.IN_TRANSIT,
      ParcelStatus.ARRIVED,
    ];

    if (!allowedForFailure.includes(parcel.status as ParcelStatus)) {
      throw new BadRequestException(
        `Cannot mark delivery failed from status: ${parcel.status}`,
      );
    }

    if (!dto.reason?.trim()) {
      throw new BadRequestException('A reason is required when marking delivery as failed.');
    }

    const updated = await this.prisma.parcel.update({
      where: { id: parcel.id },
      data: { status: ParcelStatus.FAILED_DELIVERY },
      select: { trackingId: true, status: true },
    });

    this.logger.warn(`Parcel ${trackingId} marked as FAILED_DELIVERY: ${dto.reason}`);
    return { ...updated, reason: dto.reason };
  }

  async markReturned(trackingId: string, staffId: string) {
    const parcel = await this.assertByTrackingId(trackingId);

    if (parcel.status !== ParcelStatus.FAILED_DELIVERY) {
      throw new BadRequestException(
        `Parcel must be in FAILED_DELIVERY status before it can be marked RETURNED.`,
      );
    }

    return this.prisma.parcel.update({
      where: { id: parcel.id },
      data: { status: ParcelStatus.RETURNED },
      select: { trackingId: true, status: true },
    });
  }

  // ─── Private helpers ─────────────────────────────────────────────────────

  private async assertByTrackingId(trackingId: string) {
    const parcel = await this.prisma.parcel.findFirst({
      where: { trackingId },
    });
    if (!parcel) {
      throw new NotFoundException(`Tracking ID ${trackingId} not found.`);
    }
    return parcel;
  }

  private async issueOtp(parcelId: string, receiverPhone: string): Promise<string> {
    // Invalidate any previous unused OTPs for this parcel
    await this.prisma.parcelOtp.updateMany({
      where: { parcelId, used: false },
      data: { used: true },
    });

    const otp = this.generateOtp();
    this.logger.debug(`[DEV] OTP for parcel ${parcelId}: ${otp}`);
    const otpHash = await bcrypt.hash(otp, OTP_SALT_ROUNDS);
    const expiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000);

    await this.prisma.parcelOtp.create({
      data: { parcelId, otpHash, expiresAt },
    });

    // Send OTP via SMS asynchronously
    await this.smsService.sendOtp({ phone: receiverPhone, otp });

    return otp;
  }

  private generateOtp(): string {
    return String(Math.floor(100000 + Math.random() * 900000));
  }

  private buildTimeline(parcel: any) {
    const statuses = [
      { status: ParcelStatus.PENDING_SUBMISSION, label: 'Parcel submitted', field: 'createdAt' },
      { status: ParcelStatus.SUBMITTED, label: 'Details confirmed', field: 'submittedAt' },
      { status: ParcelStatus.SMS_SENT, label: 'SMS notification sent', field: 'smsSentAt' },
      { status: ParcelStatus.PAYMENT_CONFIRMED, label: 'Payment confirmed', field: null },
      { status: ParcelStatus.ACTIVE, label: 'Accepted into system', field: null },
      { status: ParcelStatus.IN_TRANSIT, label: 'In transit', field: null },
      { status: ParcelStatus.ARRIVED, label: 'Arrived at destination', field: null },
      { status: ParcelStatus.DELIVERED, label: 'Delivered to recipient', field: null },
    ];

    const statusOrder = statuses.map((s) => s.status);
    const currentIndex = statusOrder.indexOf(parcel.status);

    return statuses.map((s, i) => ({
      ...s,
      done: i < currentIndex,
      current: i === currentIndex,
      pending: i > currentIndex,
      timestamp: s.field ? parcel[s.field] ?? null : null,
    }));
  }
}
