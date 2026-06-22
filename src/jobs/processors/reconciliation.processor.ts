import { Processor, Process } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { ReconciliationService } from '../../modules/reconciliation/reconciliation.service';

export const RECONCILIATION_QUEUE = 'reconciliation';

@Processor(RECONCILIATION_QUEUE)
export class ReconciliationProcessor {
  private readonly logger = new Logger(ReconciliationProcessor.name);

  constructor(private readonly reconciliationService: ReconciliationService) {}

  @Process('nightly-run')
  async handleNightlyRun(job: Job<{ date: string }>) {
    const date = job.data.date ?? new Date().toISOString().split('T')[0];
    this.logger.log(`Nightly reconciliation job started for ${date}`);

    const result = await this.reconciliationService.runNightlyForAllBranches(date);

    this.logger.log(
      `Nightly reconciliation done: ${result.succeeded}/${result.total} branches OK`,
    );

    return result;
  }
}
