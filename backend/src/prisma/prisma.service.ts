import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    super({
      log: process.env.NODE_ENV === 'development' 
        ? ['query', 'error', 'warn'] 
        : ['error'],
    });
  }

  async onModuleInit() {
    try {
      // Check if DATABASE_URL is set
      if (!process.env.DATABASE_URL) {
        this.logger.error(
          '❌ DATABASE_URL environment variable is not set! ' +
          'Please set it in Vercel dashboard: Settings → Environment Variables'
        );
        throw new Error(
          'DATABASE_URL is required. ' +
          'Set it in Vercel: Settings → Environment Variables → Add DATABASE_URL'
        );
      }

      await this.$connect();
      this.logger.log('✅ Database connected successfully');
    } catch (error) {
      this.logger.error('❌ Failed to connect to database:', error);
      
      if (error instanceof Error && error.message.includes('DATABASE_URL')) {
        // Re-throw with helpful message
        throw error;
      }
      
      // For other connection errors, provide helpful context
      this.logger.error(
        '💡 Troubleshooting tips:\n' +
        '  1. Check DATABASE_URL is set correctly in Vercel\n' +
        '  2. Verify database is accessible from Vercel IPs\n' +
        '  3. Check connection string format: postgresql://user:password@host:port/database\n' +
        '  4. Ensure database firewall allows Vercel IP ranges\n' +
        '  5. See backend/VERCEL-ENV-SETUP.md for detailed instructions'
      );
      throw error;
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
    this.logger.log('Database disconnected');
  }
}





















