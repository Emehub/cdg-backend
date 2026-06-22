import { Injectable, BadRequestException } from '@nestjs/common';
import { ParcelStatus } from '../../common/enums/parcel-status.enum';

const VALID_TRANSITIONS: Record<ParcelStatus, ParcelStatus | null> = {
  // Acceptance workflow (enforced by this service)
  [ParcelStatus.PENDING_SUBMISSION]: ParcelStatus.SUBMITTED,
  [ParcelStatus.SUBMITTED]: ParcelStatus.SMS_SENT,   // normal path (SMS succeeds)
  // Note: SUBMITTED → PAYMENT_CONFIRMED is also allowed when SMS is pending (checked in payments.service)
  [ParcelStatus.SMS_SENT]: ParcelStatus.PAYMENT_CONFIRMED,
  [ParcelStatus.SMS_FAILED]: ParcelStatus.PAYMENT_CONFIRMED,
  [ParcelStatus.PAYMENT_CONFIRMED]: ParcelStatus.RECEIPT_GENERATED,
  [ParcelStatus.RECEIPT_GENERATED]: ParcelStatus.ACTIVE,
  // Tracking workflow (handled by tracking module after acceptance)
  [ParcelStatus.ACTIVE]: ParcelStatus.IN_TRANSIT,
  [ParcelStatus.IN_TRANSIT]: ParcelStatus.ARRIVED,
  [ParcelStatus.ARRIVED]: ParcelStatus.DELIVERED,
  // Terminal states
  [ParcelStatus.DELIVERED]: null,
  [ParcelStatus.FAILED_DELIVERY]: null,
  [ParcelStatus.RETURNED]: null,
};

@Injectable()
export class ParcelStateMachine {
  advance(current: ParcelStatus): ParcelStatus {
    const next = VALID_TRANSITIONS[current];
    if (!next) {
      throw new BadRequestException(
        `Cannot advance from status: ${current}. Parcel is already ACTIVE or in a terminal state.`,
      );
    }
    return next;
  }

  assertCanTransitionTo(current: ParcelStatus, target: ParcelStatus): void {
    const next = VALID_TRANSITIONS[current];
    if (next !== target) {
      throw new BadRequestException(
        `Invalid state transition: ${current} → ${target}. Expected: ${current} → ${next}.`,
      );
    }
  }
}
