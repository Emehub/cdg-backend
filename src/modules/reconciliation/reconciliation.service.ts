import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class ReconciliationService {
  private readonly logger = new Logger(ReconciliationService.name);

  constructor(private readonly prisma: PrismaService) {}

  async run(branchId: string, date: string) {
    const branch = await this.prisma.branch.findUnique({ where: { id: branchId } });
    if (!branch) throw new NotFoundException(`Branch ${branchId} not found`);

    const targetDate = new Date(date);
    const dayStart = new Date(targetDate);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(targetDate);
    dayEnd.setHours(23, 59, 59, 999);

    // Count receipts generated on this date from this branch
    const receiptsCount = await this.prisma.receipt.count({
      where: {
        generatedByStaff: { branchId },
        createdAt: { gte: dayStart, lte: dayEnd },
      },
    });

    // Aggregate revenue entries for this branch on this date (INSERT-only, never raw update)
    const revenueAgg = await this.prisma.revenueEntry.aggregate({
      where: {
        branchId,
        voided: false,
        createdAt: { gte: dayStart, lte: dayEnd },
      },
      _sum: { amountPaid: true },
      _count: { id: true },
    });

    // Break down by payment method
    const [cashAgg, momoAgg, cardAgg] = await Promise.all([
      this.prisma.revenueEntry.aggregate({
        where: { branchId, paymentMethod: 'CASH', voided: false, createdAt: { gte: dayStart, lte: dayEnd } },
        _sum: { amountPaid: true },
      }),
      this.prisma.revenueEntry.aggregate({
        where: { branchId, paymentMethod: 'MOMO', voided: false, createdAt: { gte: dayStart, lte: dayEnd } },
        _sum: { amountPaid: true },
      }),
      this.prisma.revenueEntry.aggregate({
        where: { branchId, paymentMethod: 'CARD', voided: false, createdAt: { gte: dayStart, lte: dayEnd } },
        _sum: { amountPaid: true },
      }),
    ]);

    const revenueCount = revenueAgg._count.id;
    const totalRevenue = Number(revenueAgg._sum.amountPaid ?? 0);
    const cashTotal = Number(cashAgg._sum.amountPaid ?? 0);
    const momoTotal = Number(momoAgg._sum.amountPaid ?? 0);
    const cardTotal = Number(cardAgg._sum.amountPaid ?? 0);

    // CRITICAL: mismatch between receipts printed and revenue entries = fraud flag
    const hasDiscrepancy = receiptsCount !== revenueCount;

    if (hasDiscrepancy) {
      this.logger.warn(
        `DISCREPANCY DETECTED — Branch: ${branch.name} | Date: ${date} | ` +
          `Receipts: ${receiptsCount} | Revenue entries: ${revenueCount}`,
      );
    }

    // Upsert into daily_reconciliation_summaries — idempotent
    const summary = await this.prisma.dailyReconciliationSummary.upsert({
      where: {
        branchId_date: {
          branchId,
          date: targetDate,
        },
      },
      create: {
        branchId,
        date: targetDate,
        totalReceipts: receiptsCount,
        totalRevenue,
        cashTotal,
        momoTotal,
        cardTotal,
        hasDiscrepancy,
      },
      update: {
        totalReceipts: receiptsCount,
        totalRevenue,
        cashTotal,
        momoTotal,
        cardTotal,
        hasDiscrepancy,
        computedAt: new Date(),
      },
    });

    return summary;
  }

  async getSummary(branchId: string, date: string) {
    // Always read from pre-computed table — NEVER compute on-the-fly from raw tables in production
    const summary = await this.prisma.dailyReconciliationSummary.findUnique({
      where: {
        branchId_date: {
          branchId,
          date: new Date(date),
        },
      },
      include: { branch: { select: { name: true, code: true } } },
    });

    if (!summary) {
      return {
        message: `No reconciliation summary for branch ${branchId} on ${date}. Run reconciliation first.`,
        branchId,
        date,
        computed: false,
      };
    }

    return summary;
  }

  async runNightlyForAllBranches(date?: string) {
    const targetDate = date ?? new Date().toISOString().split('T')[0];
    const branches = await this.prisma.branch.findMany({
      where: { isActive: true },
      select: { id: true, name: true },
    });

    this.logger.log(
      `Nightly reconciliation started for ${branches.length} branches on ${targetDate}`,
    );

    const results = await Promise.allSettled(
      branches.map((b) => this.run(b.id, targetDate)),
    );

    const succeeded = results.filter((r) => r.status === 'fulfilled').length;
    const failed = results.filter((r) => r.status === 'rejected').length;

    this.logger.log(
      `Nightly reconciliation complete: ${succeeded} succeeded, ${failed} failed`,
    );

    return { date: targetDate, succeeded, failed, total: branches.length };
  }

  async getDiscrepancies(fromDate: string, toDate: string) {
    return this.prisma.dailyReconciliationSummary.findMany({
      where: {
        hasDiscrepancy: true,
        date: {
          gte: new Date(fromDate),
          lte: new Date(toDate),
        },
      },
      include: { branch: { select: { name: true, code: true } } },
      orderBy: { date: 'desc' },
    });
  }
}
