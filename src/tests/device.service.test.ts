import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DeviceService } from '@/services/device.service';
import { ConsoleLogger } from '@/utils/logger';
import { InMemoryDeviceRepository } from '@/repositories/device.repository';
import { NotFoundError, ValidationError } from '@/types';
import type { Device } from '@/types';

describe('DeviceService', () => {
  let deviceService: DeviceService;
  let repository: InMemoryDeviceRepository;
  let logger: ConsoleLogger;

  beforeEach(() => {
    logger = new ConsoleLogger('error'); // Suppress logs in tests
    repository = new InMemoryDeviceRepository(logger);
    deviceService = new DeviceService(repository, logger);
  });

  describe('getDevice', () => {
    it('should return device when found', async () => {
      // Arrange
      const device = await repository.create({
        name: 'Test Device',
        type: 'AXIAL_FAN',
        status: 'ONLINE',
        lastUpdate: new Date(),
        metadata: {},
      });

      // Act
      const result = await deviceService.getDevice(device.id);

      // Assert
      expect(result).toEqual(device);
    });

    it('should throw NotFoundError when device not found', async () => {
      // Arrange
      const nonExistentId = 'non-existent-id';

      // Act & Assert
      await expect(deviceService.getDevice(nonExistentId))
        .rejects
        .toThrow(NotFoundError);
    });

    it('should throw ValidationError for invalid ID', async () => {
      // Arrange
      const invalidId = '';

      // Act & Assert
      await expect(deviceService.getDevice(invalidId))
        .rejects
        .toThrow(ValidationError);
    });
  });

  describe('updateDevice', () => {
    let existingDevice: Device;

    beforeEach(async () => {
      existingDevice = await repository.create({
        name: 'Test Device',
        type: 'AXIAL_FAN',
        status: 'ONLINE',
        lastUpdate: new Date(),
        metadata: {},
      });
    });

    it('should update device successfully', async () => {
      // Arrange
      const updates = { status: 'MAINTENANCE' as const };

      // Act
      const result = await deviceService.updateDevice(existingDevice.id, updates);

      // Assert
      expect(result.status).toBe('MAINTENANCE');
      expect(result.id).toBe(existingDevice.id);
      expect(result.lastUpdate).not.toEqual(existingDevice.lastUpdate);
    });

    it('should throw NotFoundError for non-existent device', async () => {
      // Arrange
      const nonExistentId = 'non-existent-id';
      const updates = { status: 'MAINTENANCE' as const };

      // Act & Assert
      await expect(deviceService.updateDevice(nonExistentId, updates))
        .rejects
        .toThrow(NotFoundError);
    });

    it('should throw ValidationError for invalid updates', async () => {
      // Arrange
      const invalidUpdates = { status: 'INVALID_STATUS' };

      // Act & Assert
      await expect(deviceService.updateDevice(existingDevice.id, invalidUpdates))
        .rejects
        .toThrow(ValidationError);
    });
  });

  describe('listDevices', () => {
    it('should return all devices', async () => {
      // Arrange
      const device1 = await repository.create({
        name: 'Device 1',
        type: 'AXIAL_FAN',
        status: 'ONLINE',
        lastUpdate: new Date(),
        metadata: {},
      });

      const device2 = await repository.create({
        name: 'Device 2',
        type: 'FIRE_PANEL',
        status: 'OFFLINE',
        lastUpdate: new Date(),
        metadata: {},
      });

      // Act
      const result = await deviceService.listDevices();

      // Assert
      expect(result).toHaveLength(4); // 2 seeded + 2 created
      expect(result.some(d => d.id === device1.id)).toBe(true);
      expect(result.some(d => d.id === device2.id)).toBe(true);
    });
  });
});
