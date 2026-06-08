import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class RevenueService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(filters: {
    branchId?: string;
    staffId?: string;
    fromDate?: string;
    toDate?: string;
    voided?: boolean;
    page?: number;
    limit?: number;
  }) {
    const page = filters.page ?? 1;
    const limit = Math.min(filters.limit ?? 20, 100);

    const where: any = {};
    if (filters.branchId) where.branchId = filters.branchId;
    if (filters.staffId) where.staffId = filters.staffId;
    if (filters.voided !== undefined) where.voided = filters.voided;
    if (filters.fromDate || filters.toDate) {
      where.transactionDate = {};
      if (filters.fromDate) where.transactionDate.gte = new Date(filters.fromDate);
      if (filters.toDate) where.transactionDate.lte = new Date(filters.toDate);
    }

    const [entries, total] = await Promise.all([
      this.prisma.revenueEntry.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          branch: { select: { name: true, code: true } },
          staff: { select: { fullName: true, staffCode: true } },
          parcel: { select: { trackingId: true } },
        },
      }),
      this.prisma.revenueEntry.count({ where }),
    ]);

    return { entries, total, page, limit };
  }

  async requestVoid(
    entryId: string,
    dto: { reason: string },
    requestedByStaffId: string,
  ) {
    const entry = await this.prisma.revenueEntry.findUnique({
      where: { id: entryId },
    });

    if (!entry) throw new NotFoundException(`Revenue entry ${entryId} not found`);
    if (entry.voided) {
      throw new ConflictException('This revenue entry is already voided.');
    }
    if (entry.voidRequestedById) {
      throw new ConflictException(
        'A void request is already pending for this entry. Awaiting approval.',
      );
    }
    if (!dto.reason?.trim()) {
      throw new BadRequestException('A written reason is required to request a void.');
    }

    // Mark as pending void — does NOT void yet, requires second approval
    return this.prisma.revenueEntry.update({
      where: { id: entryId },
      data: {
        voidRequestedById: requestedByStaffId,
        voidReason: dto.reason.trim(),
      },
      select: {
        id: true,
        voidReason: true,
        voidRequestedById: true,
        voided: true,
      },
    });
  }

  async approveVoid(
    entryId: string,
    approvedByStaffId: string,
  ) {
    const entry = await this.prisma.revenueEntry.findUnique({
      where: { id: entryId },
    });

    if (!entry) throw new NotFoundException(`Revenue entry ${entryId} not found`);
    if (entry.voided) {
      throw new ConflictException('This revenue entry is already voided.');
    }
    if (!entry.voidRequestedById) {
      throw new BadRequestException(
        'No void request found for this entry. A void must be requested before it can be approved.',
      );
    }

    // Maker-checker: approver cannot be the same person who requested the void
    if (entry.voidRequestedById === approvedByStaffId) {
      throw new ForbiddenException(
        'The approver cannot be the same person who requested the void. ' +
          'A different authorised staff member must approve.',
      );
    }

    const { voidedEntry, correctedEntry } = await this.prisma.$transaction(async (tx) => {
      const voidedEntry = await tx.revenueEntry.update({
        where: { id: entryId },
        data: { voided: true, voidApprovedById: approvedByStaffId },
      });
      const correctedEntry = await tx.revenueEntry.create({
        data: {
          parcelId: entry.parcelId,
          branchId: entry.branchId,
          staffId: entry.staffId,
          transactionDate: entry.transactionDate,
          transactionTime: entry.transactionTime,
          amountCharged: entry.amountCharged,
          amountPaid: entry.amountPaid,
          paymentMethod: entry.paymentMethod,
          paymentReference: entry.paymentReference,
          parcelType: entry.parcelType,
          destination: entry.destination,
          parentEntryId: entry.id,
        },
      });
      return { voidedEntry, correctedEntry };
    });

    return {
      voided: voidedEntry,
      replacement: correctedEntry,
      message: 'Void approved. Original entry voided. Corrected entry created.',
    };
  }
}
