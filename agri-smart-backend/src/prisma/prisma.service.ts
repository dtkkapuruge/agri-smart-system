import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

/**
 * PrismaService handles the connection to the PostgreSQL database.
 * It extends PrismaClient to provide database access throughout the application.
 */
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  
  /**
   * Connect to the database when the module is initialized.
   */
  async onModuleInit() {
    await this.$connect();
  }

  /**
   * Disconnect from the database when the application is shut down.
   */
  async onModuleDestroy() {
    await this.$disconnect();
  }
}
