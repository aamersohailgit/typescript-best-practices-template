import type { IRepository, Device, ILogger } from '@/types';
import { NotFoundError } from '@/types';

// Interface Segregation - focused on data access only
export class InMemoryDeviceRepository implements IRepository<Device> {
  private readonly devices = new Map<string, Device>();

  constructor(private readonly logger: ILogger) {
    this.seedData();
  }

  async findById(id: string): Promise<Device | null> {
    this.logger.info('Finding device by ID', { id });
    return this.devices.get(id) || null;
  }

  async findAll(): Promise<Device[]> {
    this.logger.info('Finding all devices');
    return Array.from(this.devices.values());
  }

  async create(deviceData: Omit<Device, 'id'>): Promise<Device> {
    const id = this.generateId();
    const device: Device = {
      ...deviceData,
      id,
    };

    this.devices.set(id, device);
    this.logger.info('Device created', { id, name: device.name });
    return device;
  }

  async update(id: string, updates: Partial<Device>): Promise<Device | null> {
    const existing = this.devices.get(id);
    if (!existing) {
      return null;
    }

    const updated: Device = {
      ...existing,
      ...updates,
      id, // Ensure ID cannot be changed
      lastUpdate: new Date(),
    };

    this.devices.set(id, updated);
    this.logger.info('Device updated', { id });
    return updated;
  }

  async delete(id: string): Promise<boolean> {
    const deleted = this.devices.delete(id);
    if (deleted) {
      this.logger.info('Device deleted', { id });
    }
    return deleted;
  }

  private generateId(): string {
    return `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private seedData(): void {
    const sampleDevices: Device[] = [
      {
        id: 'device_001',
        name: 'Axial Fan A1',
        type: 'AXIAL_FAN',
        status: 'ONLINE',
        lastUpdate: new Date(),
        metadata: {
          location: 'Building A',
          manufacturer: 'TechCorp',
          model: 'AF-100',
          version: '1.2.3',
        },
      },
      {
        id: 'device_002',
        name: 'Fire Panel Main',
        type: 'FIRE_PANEL',
        status: 'ONLINE',
        lastUpdate: new Date(),
        metadata: {
          location: 'Control Room',
          manufacturer: 'SafeCorp',
          model: 'FP-200',
          version: '2.1.0',
        },
      },
    ];

    sampleDevices.forEach(device => {
      this.devices.set(device.id, device);
    });

    this.logger.info('Sample data seeded', { count: sampleDevices.length });
  }
}
