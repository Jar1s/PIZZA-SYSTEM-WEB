import { Controller, Get, Post, UseGuards } from '@nestjs/common';
import { HealthMonitorService } from './health-monitor.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('health')
export class HealthController {
  constructor(private healthMonitorService: HealthMonitorService) {}

  @Get('monitor')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async getMonitorStatus() {
    return {
      message: 'Health monitor is running',
      timestamp: new Date().toISOString(),
    };
  }

  @Post('monitor/trigger')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async triggerHealthCheck() {
    await this.healthMonitorService.triggerHealthCheck();
    return {
      message: 'Health check triggered',
      timestamp: new Date().toISOString(),
    };
  }
}

