import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  constructor() {
    const connectionString = process.env.DATABASE_URL;

    console.log('DATABASE_URL exists?', !!connectionString);
    console.log(
      'DATABASE_URL host snippet:',
      connectionString?.split('@')?.[1]?.split('/')?.[0],
    );

    if (!connectionString) throw new Error('DATABASE_URL is missing');

    const pool = new Pool({ connectionString });
    const adapter = new PrismaPg(pool);
    super({ adapter });
  }

  async onModuleInit() {
    await this.$connect();
    console.log('✅ DATABASE CONNECTED VIA ADAPTER');
  }
}
