import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { ParcelStatus } from '../../common/enums/parcel-status.enum';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  async getDashboardKpis() {
    const today = new Date();
    const dayStart = new Date(today);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(today);
    dayEnd.setHours(23, 59, 59, 999);

    const [
      parcelsToday,
      revenueToday,
      voidedToday,
      discrepanciesOpen,
      pendingParcels,
      activeStaff,
    ] = await Promise.all([
      this.prisma.parcel.count({
        where: { createdAt: { gte: dayStart, lte: dayEnd } },
      }),
      this.prisma.revenueEntry.aggregate({
        where: { voided: false, createdAt: { gte: dayStart, lte: dayEnd } },
        _sum: { amountPaid: true },
      }),
      this.prisma.revenueEntry.count({
        where: { voided: true, createdAt: { gte: dayStart, lte: dayEnd } },
      }),
      this.prisma.dailyReconciliationSummary.count({
        where: { hasDiscrepancy: true },
      }),
      this.prisma.parcel.count({
        where: {
          status: {
            notIn: [
              ParcelStatus.ACTIVE,
              ParcelStatus.IN_TRANSIT,
              ParcelStatus.ARRIVED,
              ParcelStatus.DELIVERED,
            ],
          },
          createdAt: { gte: dayStart },
        },
      }),
      this.prisma.staff.count({ where: { isActive: true, isLocked: false } }),
    ]);

    return {
      parcelsToday,
      revenueToday: Number(revenueToday._sum.amountPaid ?? 0),
      voidedToday,
      discrepanciesOpen,
      pendingParcels,
      activeStaff,
      generatedAt: new Date(),
    };
  }

  async getTransactions(filters: {
    branchId?: string;
    staffId?: string;
    status?: string;
    fromDate?: string;
    toDate?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const page = filters.page ?? 1;
    const limit = Math.min(filters.limit ?? 25, 100);
    const skip = (page - 1) * limit;

    const where: any = {};
    if (filters.status) where.status = filters.status;
    if (filters.fromDate || filters.toDate) {
      where.createdAt = {};
      if (filters.fromDate) where.createdAt.gte = new Date(filters.fromDate);
      if (filters.toDate) where.createdAt.lte = new Date(filters.toDate);
    }
    if (filters.branchId) {
      where.submittedByStaff = { branchId: filters.branchId };
    }
    if (filters.staffId) where.submittedByStaffId = filters.staffId;
    if (filters.search) {
      where.OR = [
        { trackingId: { contains: filters.search, mode: 'insensitive' } },
        { senderFullName: { contains: filters.search, mode: 'insensitive' } },
        { senderPhone: { contains: filters.search } },
        { receiverFullName: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const [parcels, total] = await Promise.all([
      this.prisma.parcel.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          destinationBranch: { select: { name: true, code: true } },
          submittedByStaff: {
            select: {
              fullName: true,
              staffCode: true,
              branch: { select: { name: true } },
            },
          },
          payment: { select: { paymentMethod: true, amountPaid: true } },
          receipt: { select: { trackingId: true, receiptNumber: true } },
        },
      }),
      this.prisma.parcel.count({ where }),
    ]);

    return { parcels, total, page, limit };
  }

  async getRevenueReport(filters: {
    branchId?: string;
    fromDate: string;
    toDate: string;
    groupBy?: 'branch' | 'staff' | 'paymentMethod' | 'parcelType' | 'destination';
  }) {
    // Always read from daily_reconciliation_summaries, not raw tables
    if (filters.groupBy === 'branch' || !filters.groupBy) {
      const summaries = await this.prisma.dailyReconciliationSummary.findMany({
        where: {
          ...(filters.branchId ? { branchId: filters.branchId } : {}),
          date: {
            gte: new Date(filters.fromDate),
            lte: new Date(filters.toDate),
          },
        },
        include: { branch: { select: { name: true, code: true } } },
        orderBy: [{ date: 'desc' }, { branchId: 'asc' }],
      });

      const totals = summaries.reduce(
        (acc, s) => ({
          totalRevenue: acc.totalRevenue + Number(s.totalRevenue),
          cashTotal: acc.cashTotal + Number(s.cashTotal),
          momoTotal: acc.momoTotal + Number(s.momoTotal),
          cardTotal: acc.cardTotal + Number(s.cardTotal),
          totalReceipts: acc.totalReceipts + s.totalReceipts,
        }),
        { totalRevenue: 0, cashTotal: 0, momoTotal: 0, cardTotal: 0, totalReceipts: 0 },
      );

      return { summaries, totals, filters };
    }

    // For other groupings, query revenue_entries directly (used for detailed breakdown)
    const groupField = {
      staff: 'staff_id',
      paymentMethod: 'payment_method',
      parcelType: 'parcel_type',
      destination: 'destination',
    }[filters.groupBy];

    const entries = await this.prisma.revenueEntry.groupBy({
      by: [filters.groupBy as any],
      where: {
        voided: false,
        ...(filters.branchId ? { branchId: filters.branchId } : {}),
        transactionDate: {
          gte: new Date(filters.fromDate),
          lte: new Date(filters.toDate),
        },
      },
      _sum: { amountPaid: true },
      _count: { id: true },
      orderBy: { _sum: { amountPaid: 'desc' } },
    });

    return { entries, filters };
  }

  async getDiscrepancyReport(filters: {
    fromDate?: string;
    toDate?: string;
    branchId?: string;
  }) {
    const where: any = { hasDiscrepancy: true };
    if (filters.branchId) where.branchId = filters.branchId;
    if (filters.fromDate || filters.toDate) {
      where.date = {};
      if (filters.fromDate) where.date.gte = new Date(filters.fromDate);
      if (filters.toDate) where.date.lte = new Date(filters.toDate);
    }

    const discrepancies = await this.prisma.dailyReconciliationSummary.findMany({
      where,
      include: { branch: { select: { name: true, code: true } } },
      orderBy: { date: 'desc' },
    });

    return {
      discrepancies,
      total: discrepancies.length,
      message:
        discrepancies.length > 0
          ? `${discrepancies.length} discrepancy(ies) found. Investigate immediately.`
          : 'No discrepancies found for the selected period.',
    };
  }

  async getStaffPerformance(filters: {
    branchId?: string;
    fromDate: string;
    toDate: string;
  }) {
    return this.prisma.revenueEntry.groupBy({
      by: ['staffId'],
      where: {
        voided: false,
        ...(filters.branchId ? { branchId: filters.branchId } : {}),
        transactionDate: {
          gte: new Date(filters.fromDate),
          lte: new Date(filters.toDate),
        },
      },
      _sum: { amountPaid: true },
      _count: { id: true },
      orderBy: { _sum: { amountPaid: 'desc' } },
    });
  }
}
