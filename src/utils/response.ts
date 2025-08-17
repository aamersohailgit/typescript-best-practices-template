import type { ApiResponse, ApiError } from '@/types';

// Utility for consistent API responses (DRY principle)
export class ResponseBuilder {
  static success<T>(data: T): ApiResponse<T> {
    return {
      success: true,
      data,
      timestamp: new Date(),
    };
  }

  static error(error: ApiError): ApiResponse<never> {
    return {
      success: false,
      error,
      timestamp: new Date(),
    };
  }

  static fromError(error: Error): ApiResponse<never> {
    const apiError: ApiError = {
      code: error.name,
      message: error.message,
    };

    return this.error(apiError);
  }
}
