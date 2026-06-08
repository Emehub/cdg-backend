import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class BranchesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.branch.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        code: true,
        zone: true,
        address: true,
      },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string) {
    const branch = await this.prisma.branch.findUnique({
      where: { id },
      include: {
        staff: {
          where: { isActive: true },
          select: { id: true, fullName: true, role: true, staffCode: true },
        },
      },
    });
    if (!branch) throw new NotFoundException(`Branch ${id} not found`);
    return branch;
  }

  async create(dto: {
    name: string;
    code: string;
    zone: string;
    address?: string;
  }) {
    const existing = await this.prisma.branch.findUnique({
      where: { code: dto.code },
    });
    if (existing) {
      throw new ConflictException(`Branch code ${dto.code} already exists`);
    }

    return this.prisma.branch.create({ data: dto });
  }

  async update(
    id: string,
    dto: { name?: string; zone?: string; address?: string; isActive?: boolean },
  ) {
    await this.assertExists(id);
    return this.prisma.branch.update({ where: { id }, data: dto });
  }

  private async assertExists(id: string) {
    const branch = await this.prisma.branch.findUnique({ where: { id } });
    if (!branch) throw new NotFoundException(`Branch ${id} not found`);
    return branch;
  }
}
