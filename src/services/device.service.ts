import type {
  IDeviceService,
  IRepository,
  Device,
  DeviceUpdateRequest,
  ILogger
} from '@/types';
import { NotFoundError, ValidationError } from '@/types';
import { ValidationService } from '@/utils/validation';

// Single Responsibility - business logic only
export class DeviceService implements IDeviceService {
  constructor(
    private readonly repository: IRepository<Device>,
    private readonly logger: ILogger
  ) {}

  async getDevice(id: string): Promise<Device> {
    this.validateId(id);

    const device = await this.repository.findById(id);
    if (!device) {
      throw new NotFoundError('Device', id);
    }

    this.logger.info('Device retrieved', { id });
    return device;
  }

  async updateDevice(id: string, updates: DeviceUpdateRequest): Promise<Device> {
    this.validateId(id);
    const validatedUpdates = ValidationService.validateDeviceUpdate(updates);

    const existingDevice = await this.repository.findById(id);
    if (!existingDevice) {
      throw new NotFoundError('Device', id);
    }

    const updatedDevice = await this.repository.update(id, {
      ...validatedUpdates,
      lastUpdate: new Date(),
    });

    if (!updatedDevice) {
      throw new Error('Failed to update device');
    }

    this.logger.info('Device updated successfully', {
      id,
      changes: Object.keys(validatedUpdates)
    });

    return updatedDevice;
  }

  async listDevices(): Promise<Device[]> {
    const devices = await this.repository.findAll();
    this.logger.info('Devices listed', { count: devices.length });
    return devices;
  }

  private validateId(id: string): void {
    if (!ValidationService.isValidId(id)) {
      throw new ValidationError('Invalid device ID format', 'id');
    }
  }
}
