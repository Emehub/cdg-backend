import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { SmsService } from './sms.service';
import { ArkeselProvider } from './providers/arkesel.provider';
import { SmsProcessor, SMS_QUEUE } from '../../jobs/processors/sms.processor';

@Module({
  imports: [BullModule.registerQueue({ name: SMS_QUEUE })],
  providers: [SmsService, ArkeselProvider, SmsProcessor],
  exports: [SmsService],
})
export class SmsModule {}
