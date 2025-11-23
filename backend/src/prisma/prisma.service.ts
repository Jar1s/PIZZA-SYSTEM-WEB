import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    // Ensure SSL parameter is present for Supabase connections BEFORE creating PrismaClient
    if (process.env.DATABASE_URL) {
      let databaseUrl = process.env.DATABASE_URL;
      if ((databaseUrl.includes('supabase.com') || databaseUrl.includes('supabase.co')) 
          && !databaseUrl.includes('sslmode=') && !databaseUrl.includes('ssl=')) {
        // Add SSL parameter if missing
        const separator = databaseUrl.includes('?') ? '&' : '?';
        databaseUrl = `${databaseUrl}${separator}sslmode=require`;
        // Update process.env for Prisma to use
        process.env.DATABASE_URL = databaseUrl;
      }
    }

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

      // Log connection attempt (without sensitive data)
      const databaseUrl = process.env.DATABASE_URL;
      const safeUrl = databaseUrl.replace(/:[^:@]+@/, ':****@');
      this.logger.log(`🔌 Connecting to database: ${safeUrl.substring(0, 120)}...`);
      
      if (databaseUrl.includes('supabase.com') || databaseUrl.includes('supabase.co')) {
        if (databaseUrl.includes('sslmode=') || databaseUrl.includes('ssl=')) {
          this.logger.log('✅ SSL parameter present in DATABASE_URL');
        } else {
          this.logger.warn('⚠️ SSL parameter missing - should have been added in constructor');
        }
      }

      // Try to connect with retry logic
      let retries = 3;
      let lastError: Error | null = null;
      
      while (retries > 0) {
        try {
          await this.$connect();
          this.logger.log('✅ Database connected successfully');
          return; // Success, exit function
        } catch (connectError: unknown) {
          lastError = connectError instanceof Error ? connectError : new Error(String(connectError));
          retries--;
          
          if (retries > 0) {
            this.logger.warn(`⚠️ Connection attempt failed, retrying... (${retries} attempts left)`);
            // Wait 2 seconds before retry
            await new Promise(resolve => setTimeout(resolve, 2000));
          }
        }
      }
      
      // If we get here, all retries failed
      throw lastError || new Error('Failed to connect to database after 3 attempts');
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





















