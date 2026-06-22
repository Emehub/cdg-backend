import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';

export interface AuditEvent {
  action: string;
  entityType: string;
  entityId: string;
  staffId?: string;
  branchId?: string;
  ipAddress?: string;
  metadata?: Record<string, unknown>;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly prisma: PrismaService) {}

  async log(event: AuditEvent): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          action: event.action,
          entityType: event.entityType,
          entityId: event.entityId,
          staffId: event.staffId,
          branchId: event.branchId,
          ipAddress: event.ipAddress,
          metadata: (event.metadata ?? {}) as Prisma.InputJsonValue,
        },
      });
    } catch (err: any) {
      // Audit logging must never crash the main flow
      this.logger.error(`Failed to write audit log: ${err.message}`, {
        event,
      });
    }
  }

  async getLogs(filters: {
    staffId?: string;
    branchId?: string;
    entityType?: string;
    action?: string;
    fromDate?: string;
    toDate?: string;
    page?: number;
    limit?: number;
  }) {
    const page = filters.page ?? 1;
    const limit = Math.min(filters.limit ?? 50, 200);

    const where: any = {};
    if (filters.staffId) where.staffId = filters.staffId;
    if (filters.branchId) where.branchId = filters.branchId;
    if (filters.entityType) where.entityType = filters.entityType;
    if (filters.action) where.action = { contains: filters.action, mode: 'insensitive' };
    if (filters.fromDate || filters.toDate) {
      where.createdAt = {};
      if (filters.fromDate) where.createdAt.gte = new Date(filters.fromDate);
      if (filters.toDate) where.createdAt.lte = new Date(filters.toDate);
    }

    const [logs, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          staff: { select: { fullName: true, staffCode: true } },
        },
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return { logs, total, page, limit };
  }
}
