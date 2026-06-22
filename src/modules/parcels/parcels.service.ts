import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { PrismaService } from '../../database/prisma.service';
import { ParcelStateMachine } from './parcel-state-machine.service';
import { FeeRulesService } from '../fee-rules/fee-rules.service';
import { CreateParcelDto } from './dto/create-parcel.dto';
import { UpdateParcelDraftDto } from './dto/update-parcel-draft.dto';
import { ParcelStatus } from '../../common/enums/parcel-status.enum';
import { SMS_QUEUE } from '../../jobs/processors/sms.processor';

@Injectable()
export class ParcelsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly stateMachine: ParcelStateMachine,
    private readonly feeRulesService: FeeRulesService,
    @InjectQueue(SMS_QUEUE) private readonly smsQueue: Queue,
  ) {}

  async create(dto: CreateParcelDto, staffId: string) {
    const branch = await this.prisma.branch.findUnique({
      where: { id: dto.destinationBranchId },
    });
    if (!branch) throw new NotFoundException('Destination branch not found');

    return this.prisma.parcel.create({
      data: {
        senderFullName: dto.senderFullName,
        senderPhone: dto.senderPhone,
        receiverFullName: dto.receiverFullName,
        receiverPhone: dto.receiverPhone,
        destinationBranchId: dto.destinationBranchId,
        parcelType: dto.parcelType,
        description: dto.description,
        proposedFee: dto.proposedFee,
        status: ParcelStatus.PENDING_SUBMISSION,
      },
      include: { destinationBranch: { select: { name: true, zone: true } } },
    });
  }

  async autosaveDraft(id: string, dto: UpdateParcelDraftDto) {
    const parcel = await this.assertExists(id);

    if (parcel.status !== ParcelStatus.PENDING_SUBMISSION) {
      throw new ForbiddenException('Cannot edit a parcel that has already been submitted');
    }

    return this.prisma.parcel.update({
      where: { id },
      data: {
        senderFullName: dto.senderFullName,
        senderPhone: dto.senderPhone,
        receiverFullName: dto.receiverFullName,
        receiverPhone: dto.receiverPhone,
        destinationBranchId: dto.destinationBranchId,
        parcelType: dto.parcelType,
        description: dto.description,
        proposedFee: dto.proposedFee,
      },
    });
  }

  async submit(id: string, staffId: string) {
    const parcel = await this.assertExists(id);

    // If already past PENDING_SUBMISSION, return current state (idempotent submit)
    if (parcel.status !== ParcelStatus.PENDING_SUBMISSION) {
      return this.findOne(id);
    }

    // Server-side field validation — never trust client only
    this.assertAllFieldsPresent(parcel);

    this.stateMachine.assertCanTransitionTo(
      parcel.status as ParcelStatus,
      ParcelStatus.SUBMITTED,
    );

    const submitted = await this.prisma.parcel.update({
      where: { id },
      data: {
        status: ParcelStatus.SUBMITTED,
        submittedByStaffId: staffId,
        submittedAt: new Date(),
      },
      include: {
        destinationBranch: { select: { name: true, zone: true } },
        submittedByStaff: { select: { fullName: true, staffCode: true } },
      },
    });

    // Dispatch SMS asynchronously — must NOT block this response
    await this.smsQueue.add('send-submission-warning', {
      parcelId: id,
      phone: parcel.senderPhone,
      description: parcel.description,
      destination: submitted.destinationBranch.name,
    });

    return submitted;
  }

  async findOne(id: string) {
    const parcel = await this.prisma.parcel.findUnique({
      where: { id },
      include: {
        destinationBranch: { select: { name: true, code: true, zone: true } },
        submittedByStaff: { select: { fullName: true, staffCode: true } },
        payment: true,
        receipt: { select: { id: true, trackingId: true, receiptNumber: true, pdfStorageKey: true, createdAt: true } },
      },
    });
    if (!parcel) throw new NotFoundException(`Parcel ${id} not found`);
    return parcel;
  }

  async findAll(filters: {
    branchId?: string;
    staffId?: string;
    status?: ParcelStatus;
    page?: number;
    limit?: number;
  }) {
    const page = filters.page ?? 1;
    const limit = Math.min(filters.limit ?? 20, 100);
    const skip = (page - 1) * limit;

    const where: any = {};
    if (filters.status) where.status = filters.status;

    // Scope to branch if provided (staff see their branch's outbound parcels)
    if (filters.branchId) {
      where.submittedByStaff = { branchId: filters.branchId };
    }
    if (filters.staffId) {
      where.submittedByStaffId = filters.staffId;
    }

    const [parcels, total] = await Promise.all([
      this.prisma.parcel.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          destinationBranch: { select: { name: true, code: true } },
          submittedByStaff: { select: { fullName: true, staffCode: true } },
        },
      }),
      this.prisma.parcel.count({ where }),
    ]);

    return { parcels, total, page, limit };
  }

  private async assertExists(id: string) {
    const parcel = await this.prisma.parcel.findUnique({ where: { id } });
    if (!parcel) throw new NotFoundException(`Parcel ${id} not found`);
    return parcel;
  }

  private assertAllFieldsPresent(parcel: any) {
    const required: { field: string; label: string }[] = [
      { field: 'senderFullName', label: 'Sender full name' },
      { field: 'senderPhone', label: 'Sender phone' },
      { field: 'receiverFullName', label: 'Receiver full name' },
      { field: 'receiverPhone', label: 'Receiver phone' },
      { field: 'destinationBranchId', label: 'Destination' },
      { field: 'parcelType', label: 'Parcel type' },
      { field: 'description', label: 'Description' },
      { field: 'proposedFee', label: 'Proposed fee' },
    ];

    const missing = required
      .filter(({ field }) => !parcel[field])
      .map(({ label }) => label);

    if (missing.length > 0) {
      throw new BadRequestException(`Missing required fields: ${missing.join(', ')}`);
    }

    if (parcel.senderFullName.length < 3) {
      throw new BadRequestException('Sender name must be at least 3 characters');
    }
    if (parcel.description.length < 5) {
      throw new BadRequestException('Description must be at least 5 characters');
    }
  }
}
