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

      // Ensure SSL parameter is present for Supabase connections
      let databaseUrl = process.env.DATABASE_URL;
      if (!databaseUrl) {
        throw new Error('DATABASE_URL is not set');
      }

      // Log connection attempt (without sensitive data) - before SSL modification
      const safeUrlBefore = databaseUrl.replace(/:[^:@]+@/, ':****@');
      this.logger.log(`🔌 Original DATABASE_URL: ${safeUrlBefore.substring(0, 120)}...`);

      if (databaseUrl.includes('supabase.com') || databaseUrl.includes('supabase.co')) {
        // Ensure SSL parameter is present for Supabase
        if (!databaseUrl.includes('sslmode=') && !databaseUrl.includes('ssl=')) {
          // Add SSL parameter if missing
          const separator = databaseUrl.includes('?') ? '&' : '?';
          databaseUrl = `${databaseUrl}${separator}sslmode=require`;
          // Update process.env for Prisma to use
          process.env.DATABASE_URL = databaseUrl;
          this.logger.log('🔒 Added SSL parameter (sslmode=require) to DATABASE_URL for Supabase connection');
        } else {
          this.logger.log('✅ SSL parameter already present in DATABASE_URL');
        }
        
        // Log final connection string (without password)
        const safeUrlAfter = databaseUrl.replace(/:[^:@]+@/, ':****@');
        this.logger.log(`🔌 Final DATABASE_URL: ${safeUrlAfter.substring(0, 120)}...`);
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
        '  2. Use Session Pooler connection string with SSL: postgresql://postgres.gsawehudurchkeysdqhm:011jarko@aws-1-eu-west-1.pooler.supabase.com:5432/postgres?sslmode=require\n' +
        '  3. Verify database is accessible (check Supabase Dashboard → Settings → Database)\n' +
        '  4. Ensure Supabase firewall allows all IPs (Settings → Database → Network Restrictions)\n' +
        '  5. SSL parameter is required for Supabase - add ?sslmode=require to connection string\n' +
        '  6. See SUPABASE-CONNECTION-FIX.md for detailed instructions'
      );
      throw error;
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
    this.logger.log('Database disconnected');
  }
}





















