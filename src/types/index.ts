// Core Types - Single source of truth (DRY principle)

export interface ILogger {
  info(message: string, meta?: Record<string, unknown>): void;
  warn(message: string, meta?: Record<string, unknown>): void;
  error(message: string, error?: Error, meta?: Record<string, unknown>): void;
}

export interface IRepository<T, ID = string> {
  findById(id: ID): Promise<T | null>;
  findAll(): Promise<T[]>;
  create(entity: Omit<T, 'id'>): Promise<T>;
  update(id: ID, entity: Partial<T>): Promise<T | null>;
  delete(id: ID): Promise<boolean>;
}

export interface IDeviceService {
  getDevice(id: string): Promise<Device>;
  updateDevice(id: string, updates: DeviceUpdateRequest): Promise<Device>;
  listDevices(): Promise<Device[]>;
}

// Domain Models
export interface Device {
  readonly id: string;
  readonly name: string;
  readonly type: DeviceType;
  readonly status: DeviceStatus;
  readonly lastUpdate: Date;
  readonly metadata: DeviceMetadata;
}

export type DeviceType =
  | 'AXIAL_FAN'
  | 'DELUGE_VALVE'
  | 'FIRE_PANEL'
  | 'PUMP';

export type DeviceStatus =
  | 'ONLINE'
  | 'OFFLINE'
  | 'MAINTENANCE'
  | 'ERROR';

export interface DeviceMetadata {
  readonly location?: string;
  readonly manufacturer?: string;
  readonly model?: string;
  readonly version?: string;
}

// API Request/Response Types
export interface DeviceUpdateRequest {
  readonly name?: string;
  readonly status?: DeviceStatus;
  readonly metadata?: Partial<DeviceMetadata>;
}

export interface ApiResponse<T> {
  readonly success: boolean;
  readonly data?: T;
  readonly error?: ApiError;
  readonly timestamp: Date;
}

export interface ApiError {
  readonly code: string;
  readonly message: string;
  readonly details?: Record<string, unknown>;
}

// Configuration Types
export interface AppConfig {
  readonly port: number;
  readonly logLevel: LogLevel;
  readonly database: DatabaseConfig;
}

export interface DatabaseConfig {
  readonly host: string;
  readonly port: number;
  readonly database: string;
  readonly username: string;
  readonly password: string;
}

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

// Error Types
export class DomainError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode: number = 500
  ) {
    super(message);
    this.name = 'DomainError';
  }
}

export class ValidationError extends DomainError {
  constructor(message: string, public readonly field?: string) {
    super(message, 'VALIDATION_ERROR', 400);
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends DomainError {
  constructor(resource: string, id: string) {
    super(`${resource} with id '${id}' not found`, 'NOT_FOUND', 404);
    this.name = 'NotFoundError';
  }
}
