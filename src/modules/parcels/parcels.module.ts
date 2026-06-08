import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { ParcelsController } from './parcels.controller';
import { ParcelsService } from './parcels.service';
import { ParcelStateMachine } from './parcel-state-machine.service';
import { FeeRulesModule } from '../fee-rules/fee-rules.module';
import { SMS_QUEUE } from '../../jobs/processors/sms.processor';

@Module({
  imports: [
    FeeRulesModule,
    BullModule.registerQueue({ name: SMS_QUEUE }),
  ],
  controllers: [ParcelsController],
  providers: [ParcelsService, ParcelStateMachine],
  exports: [ParcelsService, ParcelStateMachine],
})
export class ParcelsModule {}
