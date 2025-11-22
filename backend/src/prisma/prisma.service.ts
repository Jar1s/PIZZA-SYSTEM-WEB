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
          'Please set it in Render.com dashboard: Environment → Add Environment Variable'
        );
        throw new Error(
          'DATABASE_URL is required. ' +
          'Set it in Render.com: Environment → Add Environment Variable → DATABASE_URL'
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
        '  1. Check DATABASE_URL is set correctly in Render.com (Environment → DATABASE_URL)\n' +
        '  2. Use Session Pooler connection string (IPv4 compatible): postgresql://postgres.gsawehudurchkeysdqhm:011jarko@aws-1-eu-west-1.pooler.supabase.com:5432/postgres\n' +
        '  3. Verify database is accessible (check Supabase Dashboard → Settings → Database)\n' +
        '  4. Ensure Supabase firewall allows all IPs (Settings → Database → Network Restrictions)\n' +
        '  5. See RENDER-DATABASE-FIX.md for detailed instructions'
      );
      throw error;
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
    this.logger.log('Database disconnected');
  }
}





















