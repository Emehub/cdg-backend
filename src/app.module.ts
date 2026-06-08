import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BullModule } from '@nestjs/bull';
import { PrismaModule } from './database/prisma.module';
import { StorageModule } from './storage/storage.module';
import { AuthModule } from './modules/auth/auth.module';
import { ParcelsModule } from './modules/parcels/parcels.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { ReceiptsModule } from './modules/receipts/receipts.module';
import { SmsModule } from './modules/sms/sms.module';
import { StaffModule } from './modules/staff/staff.module';
import { BranchesModule } from './modules/branches/branches.module';
import { AdminModule } from './modules/admin/admin.module';
import { RevenueModule } from './modules/revenue/revenue.module';
import { FeeRulesModule } from './modules/fee-rules/fee-rules.module';
import { ReconciliationModule } from './modules/reconciliation/reconciliation.module';
import { TrackingModule } from './modules/tracking/tracking.module';
import { AuditModule } from './modules/audit/audit.module';
import appConfig from './config/app.config';
import databaseConfig from './config/database.config';
import smsConfig from './config/sms.config';
import storageConfig from './config/storage.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, databaseConfig, smsConfig, storageConfig],
    }),

    // BullMQ — Redis-backed async job queues (SMS dispatch, nightly reconciliation)
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const host = config.get<string>('REDIS_HOST') ?? 'localhost';
        const port = config.get<number>('REDIS_PORT') ?? 6379;
        const password = config.get<string>('REDIS_PASSWORD');
        const isUpstash = host.includes('upstash.io');
        return {
          redis: {
            host,
            port,
            password,
            ...(isUpstash && { tls: {} }),
          },
        };
      },
    }),

    PrismaModule,
    StorageModule,

    // Business modules
    AuthModule,
    StaffModule,
    BranchesModule,
    FeeRulesModule,
    ParcelsModule,
    SmsModule,
    PaymentsModule,
    ReceiptsModule,
    RevenueModule,
    ReconciliationModule,
    AdminModule,
    TrackingModule,
    AuditModule,
  ],
})
export class AppModule {}
