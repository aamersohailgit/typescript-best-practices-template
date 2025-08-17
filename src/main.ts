import { ConfigService } from '@/config';
import { ConsoleLogger } from '@/utils/logger';
import { InMemoryDeviceRepository } from '@/repositories/device.repository';
import { DeviceService } from '@/services/device.service';
import { DeviceController } from '@/controllers/device.controller';

// Dependency Injection Container (KISS principle)
export class Application {
  private readonly config = ConfigService.load();
  private readonly logger = new ConsoleLogger(this.config.logLevel);
  private readonly deviceRepository = new InMemoryDeviceRepository(this.logger);
  private readonly deviceService = new DeviceService(this.deviceRepository, this.logger);
  private readonly deviceController = new DeviceController(this.deviceService, this.logger);

  async start(): Promise<void> {
    try {
      this.logger.info('Starting application', {
        port: this.config.port,
        logLevel: this.config.logLevel
      });

      // Demo: Show the application working
      await this.runDemo();

      this.logger.info('Application started successfully');
    } catch (error) {
      this.logger.error('Failed to start application', error as Error);
      process.exit(1);
    }
  }

  private async runDemo(): Promise<void> {
    this.logger.info('Running demo...');

    // List all devices
    const listResponse = await this.deviceController.listDevices();
    this.logger.info('List devices response', { response: listResponse });

    // Get specific device
    const getResponse = await this.deviceController.getDevice({ id: 'device_001' });
    this.logger.info('Get device response', { response: getResponse });

    // Update device
    const updateResponse = await this.deviceController.updateDevice({
      id: 'device_001',
      body: { status: 'MAINTENANCE' as const },
    });
    this.logger.info('Update device response', { response: updateResponse });

    // Try to get non-existent device (error handling demo)
    const errorResponse = await this.deviceController.getDevice({ id: 'non_existent' });
    this.logger.info('Error response demo', { response: errorResponse });
  }
}

// Entry point
async function main(): Promise<void> {
  const app = new Application();
  await app.start();
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

void main();
