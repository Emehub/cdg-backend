import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../database/prisma.service';
import { CreateStaffDto } from './dto/create-staff.dto';

const SALT_ROUNDS = 12;
const MAX_FAILED_ATTEMPTS = 5;

@Injectable()
export class StaffService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.staff.findMany({
      where: { isActive: true },
      select: {
        id: true,
        staffCode: true,
        fullName: true,
        role: true,
        branchId: true,
        terminalNumber: true,
        isLocked: true,
        createdAt: true,
        branch: { select: { name: true, code: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    return this.prisma.staff.findUnique({
      where: { id },
      include: { branch: { select: { name: true, code: true, zone: true } } },
    });
  }

  async findByUsername(username: string) {
    return this.prisma.staff.findUnique({ where: { username } });
  }

  async create(dto: CreateStaffDto) {
    const existing = await this.prisma.staff.findUnique({
      where: { username: dto.username },
    });
    if (existing) throw new ConflictException('Username already exists');

    const passwordHash = await bcrypt.hash(dto.password, SALT_ROUNDS);

    return this.prisma.staff.create({
      data: {
        staffCode: dto.staffCode,
        username: dto.username,
        passwordHash,
        fullName: dto.fullName,
        role: dto.role,
        branchId: dto.branchId,
        terminalNumber: dto.terminalNumber,
      },
      select: {
        id: true,
        staffCode: true,
        fullName: true,
        role: true,
        branchId: true,
      },
    });
  }

  async lock(id: string) {
    const staff = await this.assertExists(id);
    return this.prisma.staff.update({
      where: { id },
      data: { isLocked: true },
      select: { id: true, fullName: true, isLocked: true },
    });
  }

  async unlock(id: string) {
    await this.assertExists(id);
    return this.prisma.staff.update({
      where: { id },
      data: { isLocked: false, failedLoginCount: 0 },
      select: { id: true, fullName: true, isLocked: true },
    });
  }

  async incrementFailedLogins(id: string) {
    const staff = await this.prisma.staff.update({
      where: { id },
      data: { failedLoginCount: { increment: 1 } },
      select: { id: true, failedLoginCount: true },
    });

    if (staff.failedLoginCount >= MAX_FAILED_ATTEMPTS) {
      await this.prisma.staff.update({
        where: { id },
        data: { isLocked: true },
      });
    }

    return staff;
  }

  async update(
    id: string,
    dto: { fullName?: string; role?: string; branchId?: string; terminalNumber?: string },
  ) {
    await this.assertExists(id);
    return this.prisma.staff.update({
      where: { id },
      data: dto as any,
      select: {
        id: true,
        staffCode: true,
        fullName: true,
        role: true,
        branchId: true,
        terminalNumber: true,
        isLocked: true,
        branch: { select: { name: true, code: true } },
      },
    });
  }

  async deactivate(id: string) {
    await this.assertExists(id);
    return this.prisma.staff.update({
      where: { id },
      data: { isActive: false },
      select: { id: true, fullName: true, isActive: true },
    });
  }

  async resetFailedLogins(id: string) {
    return this.prisma.staff.update({
      where: { id },
      data: { failedLoginCount: 0 },
    });
  }

  private async assertExists(id: string) {
    const staff = await this.prisma.staff.findUnique({ where: { id } });
    if (!staff) throw new NotFoundException(`Staff ${id} not found`);
    return staff;
  }
}
