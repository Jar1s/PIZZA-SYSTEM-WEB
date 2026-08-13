import { Controller, Get, Logger } from '@nestjs/common';
import { Public } from './auth/decorators/public.decorator';
import { PrismaService } from './prisma/prisma.service';

@Controller()
export class AppController {
  private readonly logger = new Logger(AppController.name);

  constructor(private prisma: PrismaService) {}
  @Public()
  @Get()
  getRoot() {
    return {
      message: 'Backend API is running',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
    };
  }

  @Public()
  @Get('health')
  async getHealth() {
    const checks: {
      status: string;
      timestamp: string;
      uptime: number;
      database: string;
    } = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: Math.floor(process.uptime()),
      database: 'unknown',
    };

    // Test database connection
    try {
      const isConnected = await this.prisma.isConnected();
      if (isConnected) {
        checks.database = 'connected';
      } else {
        checks.database = 'disconnected';
        checks.status = 'degraded';
      }
    } catch (error) {
      checks.database = 'error';
      checks.status = 'degraded';
      // Never expose the raw driver error to unauthenticated callers —
      // Prisma/Postgres messages can embed connection details.
      this.logger.error('Health check database probe failed', error instanceof Error ? error.message : error);
    }

    return checks;
  }
}
