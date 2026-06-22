import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private pgPool!: any;

  constructor() {
    // Strip Prisma-specific and SSL params — pg Pool handles these directly
    const connStr = (process.env.DATABASE_URL ?? '')
      .replace(/[&?]sslmode=[^&]*/g, '')
      .replace(/[&?]pgbouncer=[^&]*/g, '');
    const pool = new Pool({
      connectionString: connStr,
      ssl: { rejectUnauthorized: false },
      max: 5,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    });
    const adapter = new PrismaPg(pool);
    super({
      adapter,
      log: [
        { emit: 'stdout', level: 'error' },
        { emit: 'stdout', level: 'warn' },
      ],
    } as any);
    this.pgPool = pool;
  }

  async onModuleInit() {
    await this.$connect();
    this.logger.log('Database connected');
  }

  async onModuleDestroy() {
    await this.$disconnect();
    await this.pgPool?.end();
    this.logger.log('Database disconnected');
  }
}
