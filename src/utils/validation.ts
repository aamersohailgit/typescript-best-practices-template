import { z } from 'zod';
import type { DeviceUpdateRequest } from '@/types';
import { ValidationError } from '@/types';

// Centralized validation logic (DRY principle)
export const deviceUpdateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  status: z.enum(['ONLINE', 'OFFLINE', 'MAINTENANCE', 'ERROR']).optional(),
  metadata: z.object({
    location: z.string().optional(),
    manufacturer: z.string().optional(),
    model: z.string().optional(),
    version: z.string().optional(),
  }).optional(),
});

export class ValidationService {
  static validateDeviceUpdate(data: unknown): DeviceUpdateRequest {
    try {
      return deviceUpdateSchema.parse(data);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const field = error.issues[0]?.path.join('.') || 'unknown';
        const message = error.issues[0]?.message || 'Validation failed';
        throw new ValidationError(`Invalid ${field}: ${message}`, field);
      }
      throw new ValidationError('Validation failed');
    }
  }

  static isValidId(id: string): boolean {
    return typeof id === 'string' && id.length > 0 && id.length <= 36;
  }
}
