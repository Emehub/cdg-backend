import { Processor, Process } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { SmsService } from '../../modules/sms/sms.service';
import { PrismaService } from '../../database/prisma.service';
import { ParcelStatus } from '../../common/enums/parcel-status.enum';

export const SMS_QUEUE = 'sms';

interface SmsJobData {
  parcelId: string;
  phone: string;
  description: string;
  destination: string;
}

@Processor(SMS_QUEUE)
export class SmsProcessor {
  private readonly logger = new Logger(SmsProcessor.name);

  constructor(
    private readonly smsService: SmsService,
    private readonly prisma: PrismaService,
  ) {}

  @Process('send-submission-warning')
  async handleSubmissionWarning(job: Job<SmsJobData>) {
    const { parcelId, phone, description, destination } = job.data;
    this.logger.log(`SMS job started for parcel ${parcelId} → ${phone}`);

    const result = await this.smsService.sendParcelSubmissionWarning({
      phone,
      parcelDescription: description,
      destination,
    });

    // Log the SMS attempt
    await this.prisma.smsLog.create({
      data: {
        parcelId,
        phone,
        message: this.smsService.buildSmsTemplate(description, destination),
        provider: result.provider,
        status: result.success ? 'SENT' : 'FAILED',
        reference: result.reference,
      },
    });

    // Update parcel SMS status — failure does NOT block the workflow
    await this.prisma.parcel.update({
      where: { id: parcelId },
      data: {
        status: result.success ? ParcelStatus.SMS_SENT : ParcelStatus.SMS_FAILED,
        smsStatus: result.success ? 'SENT' : 'FAILED',
        smsSentAt: result.success ? new Date() : undefined,
      },
    });

    if (!result.success) {
      this.logger.warn(`SMS failed for parcel ${parcelId} — workflow continues`);
    } else {
      this.logger.log(`SMS sent for parcel ${parcelId} via ${result.provider}`);
    }
  }
}
