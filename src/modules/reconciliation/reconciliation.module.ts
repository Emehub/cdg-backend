import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { ReconciliationController } from './reconciliation.controller';
import { ReconciliationService } from './reconciliation.service';
import {
  ReconciliationProcessor,
  RECONCILIATION_QUEUE,
} from '../../jobs/processors/reconciliation.processor';

@Module({
  imports: [BullModule.registerQueue({ name: RECONCILIATION_QUEUE })],
  controllers: [ReconciliationController],
  providers: [ReconciliationService, ReconciliationProcessor],
  exports: [ReconciliationService],
})
export class ReconciliationModule {}
