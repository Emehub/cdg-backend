import { Module } from '@nestjs/common';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { PaystackService } from './paystack.service';
import { FeeRulesModule } from '../fee-rules/fee-rules.module';
import { ParcelsModule } from '../parcels/parcels.module';

@Module({
  imports: [FeeRulesModule, ParcelsModule],
  controllers: [PaymentsController],
  providers: [PaymentsService, PaystackService],
  exports: [PaymentsService],
})
export class PaymentsModule {}
