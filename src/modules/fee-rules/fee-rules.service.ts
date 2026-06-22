import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class FeeRulesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.feeRule.findMany({
      where: { effectiveTo: null },
      orderBy: [{ parcelType: 'asc' }, { destinationZone: 'asc' }],
    });
  }

  async lookup(parcelType: string, destinationZone: string) {
    const rule = await this.prisma.feeRule.findFirst({
      where: {
        parcelType: parcelType as any,
        destinationZone,
        effectiveTo: null,
      },
    });
    if (!rule) {
      throw new NotFoundException(
        `No active fee rule for ${parcelType} → ${destinationZone}`,
      );
    }
    return rule;
  }

  async validateFee(
    parcelType: string,
    destinationZone: string,
    proposedFee: number,
  ): Promise<{ valid: boolean; minFee: number; rule: any }> {
    const rule = await this.lookup(parcelType, destinationZone);
    const minFee = Number(rule.minFee);
    return { valid: proposedFee >= minFee, minFee, rule };
  }

  async create(dto: any) {
    return this.prisma.feeRule.create({ data: dto });
  }
}
