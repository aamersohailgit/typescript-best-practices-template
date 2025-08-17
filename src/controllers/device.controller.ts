import type { IDeviceService, ILogger, ApiResponse, Device } from '@/types';
import { ResponseBuilder } from '@/utils/response';

// Single Responsibility - HTTP handling only
export class DeviceController {
  constructor(
    private readonly deviceService: IDeviceService,
    private readonly logger: ILogger
  ) {}

  async getDevice(request: { id: string }): Promise<ApiResponse<Device>> {
    try {
      const device = await this.deviceService.getDevice(request.id);
      return ResponseBuilder.success(device);
    } catch (error) {
      this.logger.error('Failed to get device', error as Error, { id: request.id });
      return ResponseBuilder.fromError(error as Error);
    }
  }

  async updateDevice(request: {
    id: string;
    body: unknown;
  }): Promise<ApiResponse<Device>> {
    try {
      const device = await this.deviceService.updateDevice(request.id, request.body);
      return ResponseBuilder.success(device);
    } catch (error) {
      this.logger.error('Failed to update device', error as Error, { id: request.id });
      return ResponseBuilder.fromError(error as Error);
    }
  }

  async listDevices(): Promise<ApiResponse<Device[]>> {
    try {
      const devices = await this.deviceService.listDevices();
      return ResponseBuilder.success(devices);
    } catch (error) {
      this.logger.error('Failed to list devices', error as Error);
      return ResponseBuilder.fromError(error as Error);
    }
  }
}
