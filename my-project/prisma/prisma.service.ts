import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  constructor() {
    // This creates the direct connection pipe to Postgres
    const pool = new Pool({
      connectionString: "postgresql://postgres:552003@localhost:5432/laqta?schema=public",
    });

    const adapter = new PrismaPg(pool);

    // This satisfies the new Prisma 7 requirements
    super({ adapter });
  }

  async onModuleInit() {
    try {
      await this.$connect();
      console.log('✅ DATABASE CONNECTED VIA ADAPTER');
    } catch (error) {
      console.error('❌ CONNECTION ERROR:', error);
    }
  }
}