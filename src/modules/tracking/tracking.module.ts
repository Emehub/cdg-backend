import { Module } from '@nestjs/common';
import { TrackingController } from './tracking.controller';
import { TrackingService } from './tracking.service';
import { SmsModule } from '../sms/sms.module';
import { ParcelsModule } from '../parcels/parcels.module';

@Module({
  imports: [SmsModule, ParcelsModule],
  controllers: [TrackingController],
  providers: [TrackingService],
  exports: [TrackingService],
})
export class TrackingModule {}
