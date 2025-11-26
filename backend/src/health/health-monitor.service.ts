import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TenantsService } from '../tenants/tenants.service';

@Injectable()
export class HealthMonitorService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(HealthMonitorService.name);
  private consecutiveErrors = 0;
  private readonly ERROR_THRESHOLD = 10; // Number of consecutive errors before enabling maintenance mode
  private readonly CHECK_INTERVAL = 30000; // Check every 30 seconds
  private healthCheckInterval: NodeJS.Timeout | null = null;
  private isAutoMaintenanceEnabled = false;
  private pendingMaintenanceUpdate: { reason: string; timestamp: Date } | null = null;

  constructor(
    private prisma: PrismaService,
    private tenantsService: TenantsService,
  ) {}

  async onModuleInit() {
    // Start health monitoring
    this.logger.log('🔍 Starting automatic health monitoring...');
    this.startHealthMonitoring();
  }

  onModuleDestroy() {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }
  }

  private startHealthMonitoring() {
    // Check immediately
    this.checkHealth();

    // Then check periodically
    this.healthCheckInterval = setInterval(() => {
      this.checkHealth();
    }, this.CHECK_INTERVAL);
  }

  /**
   * Check backend health and automatically enable/disable maintenance mode
   */
  private async checkHealth() {
    try {
      // Test database connection with timeout
      const healthCheckPromise = this.prisma.isConnected();
      const timeoutPromise = new Promise<boolean>((_, reject) => 
        setTimeout(() => reject(new Error('Health check timeout')), 10000) // 10 second timeout
      );
      
      const isConnected = await Promise.race([healthCheckPromise, timeoutPromise]) as boolean;
      
      if (isConnected) {
        // Database is healthy
        if (this.consecutiveErrors > 0) {
          this.logger.log(`✅ Health check passed. Errors cleared (was ${this.consecutiveErrors})`);
          this.consecutiveErrors = 0;
        }

        // If auto-maintenance was enabled and health is restored, disable it
        if (this.isAutoMaintenanceEnabled) {
          await this.disableAutoMaintenance();
        }
        
        // If there's a pending maintenance update, try to apply it now that DB is healthy
        if (this.pendingMaintenanceUpdate) {
          this.logger.log('🔄 Database restored, applying pending maintenance mode update...');
          const reason = this.pendingMaintenanceUpdate.reason;
          this.pendingMaintenanceUpdate = null;
          await this.enableAutoMaintenance(reason);
        }
      } else {
        // Database connection failed
        this.consecutiveErrors++;
        this.logger.warn(`⚠️ Health check failed: Database disconnected (consecutive errors: ${this.consecutiveErrors})`);
        
        if (this.consecutiveErrors >= this.ERROR_THRESHOLD && !this.isAutoMaintenanceEnabled) {
          await this.enableAutoMaintenance('Database connection lost');
        }
      }
    } catch (error) {
      // Error during health check (timeout, connection error, etc.)
      this.consecutiveErrors++;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const isTimeout = errorMessage.includes('timeout');
      const isConnectionError = errorMessage.toLowerCase().includes('connection') || 
                                errorMessage.toLowerCase().includes('econnrefused') ||
                                errorMessage.toLowerCase().includes('etimedout');
      
      if (isTimeout || isConnectionError) {
        this.logger.warn(`⚠️ Health check failed: ${errorMessage} (consecutive errors: ${this.consecutiveErrors})`);
      } else {
        this.logger.error(`❌ Health check error: ${errorMessage} (consecutive errors: ${this.consecutiveErrors})`);
      }
      
      if (this.consecutiveErrors >= this.ERROR_THRESHOLD && !this.isAutoMaintenanceEnabled) {
        const reason = isTimeout 
          ? 'Database connection timeout' 
          : isConnectionError 
            ? 'Database connection error' 
            : `Health check failed: ${errorMessage}`;
        await this.enableAutoMaintenance(reason);
      }
    }
  }

  /**
   * Enable maintenance mode automatically due to backend errors
   */
  private async enableAutoMaintenance(reason: string) {
    try {
      this.logger.warn(`🚨 Enabling automatic maintenance mode due to: ${reason}`);
      
      // Get all active tenants
      const tenants = await this.prisma.tenant.findMany({
        where: { isActive: true },
        select: { slug: true, theme: true },
      });

      // Enable maintenance mode for all active tenants
      for (const tenant of tenants) {
        try {
          const currentTheme = (tenant.theme as any) || {};
          
          // Only enable if not already manually enabled
          // Check if maintenance mode was manually set (no autoMaintenanceReason)
          const isManuallyEnabled = currentTheme.maintenanceMode === true && !currentTheme.autoMaintenanceReason;
          
          if (!isManuallyEnabled) {
            await this.tenantsService.updateTenant(tenant.slug, {
              theme: {
                ...currentTheme,
                maintenanceMode: true,
                autoMaintenanceReason: reason, // Store reason for debugging
                autoMaintenanceEnabledAt: new Date().toISOString(),
              },
            });
            
            this.logger.log(`✅ Enabled automatic maintenance mode for tenant: ${tenant.slug} (reason: ${reason})`);
          } else {
            this.logger.log(`ℹ️ Maintenance mode already manually enabled for tenant: ${tenant.slug}, skipping auto-enable`);
          }
        } catch (error) {
          this.logger.error(`❌ Failed to enable maintenance mode for tenant ${tenant.slug}:`, error);
        }
      }

      this.isAutoMaintenanceEnabled = true;
      this.pendingMaintenanceUpdate = null; // Clear pending update on success
    } catch (error) {
      // If DB update fails (e.g., DB is disconnected), store in memory and retry later
      this.logger.error('❌ Failed to enable maintenance mode via DB, storing in memory for retry:', error);
      this.pendingMaintenanceUpdate = { reason, timestamp: new Date() };
      this.isAutoMaintenanceEnabled = true; // Mark as enabled in memory
      
      // Retry after a delay
      setTimeout(() => {
        if (this.pendingMaintenanceUpdate) {
          this.logger.log('🔄 Retrying maintenance mode update...');
          this.enableAutoMaintenance(this.pendingMaintenanceUpdate.reason);
        }
      }, 60000); // Retry after 1 minute
    }
  }

  /**
   * Disable automatic maintenance mode when health is restored
   */
  private async disableAutoMaintenance() {
    try {
      this.logger.log('✅ Health restored. Disabling automatic maintenance mode...');
      
      // Get all active tenants
      const tenants = await this.prisma.tenant.findMany({
        where: { isActive: true },
        select: { slug: true, theme: true },
      });

      // Disable auto-maintenance for tenants that have it enabled
      for (const tenant of tenants) {
        try {
          const currentTheme = (tenant.theme as any) || {};
          
          // Only disable if it was auto-enabled (has autoMaintenanceReason)
          if (currentTheme.autoMaintenanceReason && currentTheme.maintenanceMode === true) {
            await this.tenantsService.updateTenant(tenant.slug, {
              theme: {
                ...currentTheme,
                maintenanceMode: false,
                autoMaintenanceReason: undefined,
                autoMaintenanceEnabledAt: undefined,
              },
            });
            
            this.logger.log(`✅ Disabled automatic maintenance mode for tenant: ${tenant.slug}`);
          }
        } catch (error) {
          this.logger.error(`❌ Failed to disable maintenance mode for tenant ${tenant.slug}:`, error);
        }
      }

      this.isAutoMaintenanceEnabled = false;
      this.consecutiveErrors = 0;
    } catch (error) {
      this.logger.error('❌ Failed to disable automatic maintenance mode:', error);
    }
  }

  /**
   * Manually trigger health check (useful for testing)
   */
  async triggerHealthCheck() {
    this.logger.log('🔍 Manual health check triggered');
    await this.checkHealth();
  }
}

