# Usage Examples for Your Projects

## What to Replace with What - Quick Reference

### **Current Code → Template Pattern Mapping**

| **Your Current Code** | **Replace With** | **Why** |
|----------------------|------------------|---------|
| `@Body() body: any` | `@Body() body: DeviceUpdateRequest` | Type safety instead of `any` |
| `if ("acked" in body)` | `const validated = ValidationService.validate(body)` | Runtime validation |
| `body.acked == true` | `validated.acknowledged === true` | Strict equality + proper typing |
| `new AckedSetByUuid()` | `this.alarmService.acknowledgeAlarm()` | Dependency injection |
| `console.log()` | `this.logger.info()` | Structured logging |
| Large `VaPmcsDeviceLogic` class | Split into separate services | Single Responsibility |
| Direct WinCC OA calls | Service layer abstraction | Separation of concerns |
| Hardcoded strings | Type-safe enums/constants | Type safety |
| No error handling | Structured error types | Proper error management |

### **File Structure Migration**

| **Current Structure** | **New Template Structure** |
|----------------------|---------------------------|
| `src/api/controllers/` | `src/controllers/` |
| Mixed business logic in controllers | `src/services/` (business logic only) |
| Direct database/WinCC calls | `src/repositories/` (data access only) |
| Scattered type definitions | `src/types/` (centralized types) |
| No utility organization | `src/utils/` (pure functions) |
| No centralized config | `src/config/` (configuration management) |

## Adapting the Template for Your Three Repositories

### 1. **For AM Backend (Alarm Management)**

#### What to Replace:

| **Your Current AM Backend Code** | **Replace With Template Pattern** |
|----------------------------------|-----------------------------------|
| ```typescript<br/>@Put(":id")<br/>updateAlarm(@Param("id") id: string, @Body() body: any) {<br/>  if ("acked" in body) {<br/>    if (body.acked == true) {<br/>      const ackedSetByUuid = new AckedSetByUuid();<br/>      ackedSetByUuid.ack(id);<br/>    }<br/>  }<br/>}``` | ```typescript<br/>async acknowledgeAlarm(request: {<br/>  id: string;<br/>  userId: string;<br/>}): Promise<ApiResponse<Alarm>> {<br/>  try {<br/>    const alarm = await this.alarmService.acknowledgeAlarm(<br/>      request.id, request.userId<br/>    );<br/>    return ResponseBuilder.success(alarm);<br/>  } catch (error) {<br/>    return ResponseBuilder.fromError(error as Error);<br/>  }<br/>}``` |
| `any` type usage | Proper `AlarmUpdateRequest` interface |
| Direct service instantiation | Dependency injection via constructor |
| String-based property checking | Runtime validation with Zod |
| No error handling | Structured error handling |
| No logging | Structured logging with context |

#### Step-by-Step File Changes for AM Backend:

**File 1: Create new types file**
- **Location**: `src/types/alarm.ts` (NEW FILE)
- **Action**: Create this file and add:

```typescript
// src/types/alarm.ts
export interface Alarm {
  readonly id: string;
  readonly uuid: string;
  readonly severity: AlarmSeverity;
  readonly status: AlarmStatus;
  readonly timestamp: Date;
  readonly description: string;
  readonly acknowledged: boolean;
  readonly acknowledgedBy?: string;
  readonly acknowledgedAt?: Date;
}

export type AlarmSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type AlarmStatus = 'ACTIVE' | 'ACKNOWLEDGED' | 'CLEARED';

export interface AlarmUpdateRequest {
  readonly acknowledged?: boolean;
  readonly status?: AlarmStatus;
}

export interface IAlarmService {
  acknowledgeAlarm(id: string, userId: string): Promise<Alarm>;
  getActiveAlarms(): Promise<Alarm[]>;
  getAlarmById(id: string): Promise<Alarm>;
}
```

**File 2: Update existing controller**
- **Location**: `src/api/controllers/alarms.controller.ts`
- **Action**: Replace the entire file content with:

```typescript
// REPLACE ENTIRE FILE: src/api/controllers/alarms.controller.ts
import type { IAlarmService, ILogger, ApiResponse, Alarm } from '@/types';
import { ResponseBuilder } from '@/utils/response';
import { ValidationService } from '@/utils/validation';

export class AlarmController {
  constructor(
    private readonly alarmService: IAlarmService,
    private readonly logger: ILogger
  ) {}

  async acknowledgeAlarm(request: {
    id: string;
    userId: string;
  }): Promise<ApiResponse<Alarm>> {
    try {
      ValidationService.validateAlarmId(request.id);
      const alarm = await this.alarmService.acknowledgeAlarm(request.id, request.userId);
      return ResponseBuilder.success(alarm);
    } catch (error) {
      this.logger.error('Failed to acknowledge alarm', error as Error, {
        id: request.id,
        userId: request.userId
      });
      return ResponseBuilder.fromError(error as Error);
    }
  }

  async getAlarm(request: { id: string }): Promise<ApiResponse<Alarm>> {
    try {
      const alarm = await this.alarmService.getAlarmById(request.id);
      return ResponseBuilder.success(alarm);
    } catch (error) {
      this.logger.error('Failed to get alarm', error as Error, { id: request.id });
      return ResponseBuilder.fromError(error as Error);
    }
  }
}
```

**File 3: Create new service**
- **Location**: `src/services/alarm.service.ts` (NEW FILE)
- **Action**: Create this file and add:

```typescript
// src/services/alarm.service.ts
import type {
  IAlarmService,
  IRepository,
  Alarm,
  ILogger
} from '@/types';
import { NotFoundError, ValidationError } from '@/types';

export class AlarmService implements IAlarmService {
  constructor(
    private readonly repository: IRepository<Alarm>,
    private readonly logger: ILogger
  ) {}

  async acknowledgeAlarm(id: string, userId: string): Promise<Alarm> {
    const alarm = await this.repository.findById(id);
    if (!alarm) {
      throw new NotFoundError('Alarm', id);
    }

    if (alarm.acknowledged) {
      throw new ValidationError('Alarm already acknowledged');
    }

    const updatedAlarm = await this.repository.update(id, {
      acknowledged: true,
      acknowledgedBy: userId,
      acknowledgedAt: new Date(),
      status: 'ACKNOWLEDGED' as const,
    });

    this.logger.info('Alarm acknowledged', { id, userId });
    return updatedAlarm!;
  }

  async getActiveAlarms(): Promise<Alarm[]> {
    const alarms = await this.repository.findAll();
    return alarms.filter(alarm => alarm.status === 'ACTIVE');
  }

  async getAlarmById(id: string): Promise<Alarm> {
    const alarm = await this.repository.findById(id);
    if (!alarm) {
      throw new NotFoundError('Alarm', id);
    }
    return alarm;
  }
}
```

**File 4: Create repository**
- **Location**: `src/repositories/alarm.repository.ts` (NEW FILE)
- **Action**: Create this file and add:

```typescript
// src/repositories/alarm.repository.ts
import type { IRepository, Alarm, ILogger } from '@/types';

export class AlarmRepository implements IRepository<Alarm> {
  private readonly alarms = new Map<string, Alarm>();

  constructor(private readonly logger: ILogger) {
    this.seedSampleData();
  }

  async findById(id: string): Promise<Alarm | null> {
    return this.alarms.get(id) || null;
  }

  async findAll(): Promise<Alarm[]> {
    return Array.from(this.alarms.values());
  }

  async create(alarmData: Omit<Alarm, 'id'>): Promise<Alarm> {
    const id = this.generateId();
    const alarm: Alarm = { ...alarmData, id };
    this.alarms.set(id, alarm);
    return alarm;
  }

  async update(id: string, updates: Partial<Alarm>): Promise<Alarm | null> {
    const existing = this.alarms.get(id);
    if (!existing) return null;

    const updated: Alarm = { ...existing, ...updates, id };
    this.alarms.set(id, updated);
    return updated;
  }

  async delete(id: string): Promise<boolean> {
    return this.alarms.delete(id);
  }

  private generateId(): string {
    return `alarm_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private seedSampleData(): void {
    // Add sample alarms for testing
    const sampleAlarms: Alarm[] = [
      {
        id: 'alarm_001',
        uuid: 'uuid_001',
        severity: 'HIGH',
        status: 'ACTIVE',
        timestamp: new Date(),
        description: 'High temperature detected',
        acknowledged: false,
      },
    ];

    sampleAlarms.forEach(alarm => {
      this.alarms.set(alarm.id, alarm);
    });
  }
}
```

**File 5: Update existing acknowledgement service**
- **Location**: `src/services/Acknowledgement.ts`
- **Action**: DELETE this file (functionality moved to AlarmService)

**File 6: Update app module**
- **Location**: `src/app.module.ts`
- **Action**: Replace the imports and providers section:

```typescript
// REPLACE IMPORTS in src/app.module.ts
import { MiddlewareConsumer, Module, NestModule } from "@nestjs/common";
import { AlarmController } from "./controllers/alarm.controller"; // Updated import
import { UserController } from "./api/controllers/userinfo.controller";
import { WSGateway } from "./WSGateway";
import { apiLoggerMiddleware } from '@varia/logger';
import { AlarmService } from "./services/alarm.service"; // New import
import { AlarmRepository } from "./repositories/alarm.repository"; // New import
import { ConsoleLogger } from "./utils/logger"; // New import

@Module({
  imports: [],
  controllers: [AlarmController, UserController], // Updated controller
  providers: [
    WSGateway,
    AlarmService, // New provider
    AlarmRepository, // New provider
    {
      provide: 'ILogger',
      useClass: ConsoleLogger,
    }, // New provider
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(apiLoggerMiddleware).forRoutes("/api/v1");
  }
}

### 2. **For DM Backend (Device Management)**

#### What to Replace:

| **Your Current DM Backend Code** | **Replace With Template Pattern** |
|----------------------------------|-----------------------------------|
| ```typescript<br/>@Put(":id")<br/>async updateDevice(<br/>  @Param("id") id: string,<br/>  @Body() updateDeviceRequest: UpdateDeviceRequest<br/>): Promise<Device> {<br/>  const tokens = updateDeviceRequest.control_mode!.split(":");<br/>  const column = tokens[0];<br/>  const value = tokens[1];<br/>  let remoteSystem = WinccoaUtils.findRemoteSystem(id);<br/>  let fullyQualifiedDpName = remoteSystem + ":" + id + "." +<br/>    DeviceRequestHandler.DP_REQUEST_COLUMN_LOOKUP_MAP.get(column);<br/>  const result1 = WSGateway.winccoa.dpSet(fullyQualifiedDpName, value);<br/>}``` | ```typescript<br/>async updateDevice(request: {<br/>  id: string;<br/>  body: DeviceCommandRequest;<br/>}): Promise<ApiResponse<Device>> {<br/>  try {<br/>    await this.deviceCommandService.executeCommand(<br/>      request.id,<br/>      request.body<br/>    );<br/>    const device = await this.deviceService.getDevice(request.id);<br/>    return ResponseBuilder.success(device);<br/>  } catch (error) {<br/>    return ResponseBuilder.fromError(error as Error);<br/>  }<br/>}``` |
| String parsing in controller | Dedicated service for command parsing |
| Direct WinCC OA calls | Service layer abstraction |
| Hard-coded string concatenation | Type-safe DP name building |
| No error handling | Comprehensive error handling |
| Mixed responsibilities | Separated concerns (Controller → Service → Repository) |

#### Step-by-Step File Changes for DM Backend:

**File 1: Create extended device types**
- **Location**: `src/types/device.ts` (NEW FILE)
- **Action**: Create this file and add:

```typescript
// src/types/device.ts
export interface WinccoaDevice extends Device {
  readonly dpName: string;
  readonly remoteSystem: string;
  readonly className: string;
  readonly commandMappings: Map<string, string>;
}

export interface DeviceCommand {
  readonly deviceId: string;
  readonly command: string;
  readonly value: unknown;
  readonly timestamp: Date;
}

export interface DeviceCommandRequest {
  readonly controlMode: string; // e.g., "desiredOpenCmd:true"
}

export interface IDeviceCommandService {
  executeCommand(deviceId: string, commandRequest: DeviceCommandRequest): Promise<void>;
}

export interface IWinccoaRepository {
  executeCommand(dpeName: string, value: string): Promise<void>;
  findRemoteSystem(deviceId: string): Promise<string>;
  buildDpeName(device: WinccoaDevice, command: string): string;
}
```

**File 2: Update existing device controller**
- **Location**: `src/api/apis/device.controller.ts`
- **Action**: Replace the entire file content with:

```typescript
// REPLACE ENTIRE FILE: src/api/apis/device.controller.ts
import { Body, Controller, Get, Param, Put } from "@nestjs/common";
import { ApiOperation } from "@nestjs/swagger";
import type { IDeviceCommandService, IDeviceService, ILogger, ApiResponse, Device, DeviceCommandRequest } from '@/types';
import { ResponseBuilder } from '@/utils/response';

@Controller("api/v1/devices")
export class DevicesController {
  constructor(
    private readonly deviceService: IDeviceService,
    private readonly deviceCommandService: IDeviceCommandService,
    private readonly logger: ILogger
  ) {}

  @Get(":id")
  async getDevice(@Param("id") id: string): Promise<ApiResponse<Device>> {
    try {
      const device = await this.deviceService.getDevice(id);
      return ResponseBuilder.success(device);
    } catch (error) {
      this.logger.error('Failed to get device', error as Error, { id });
      return ResponseBuilder.fromError(error as Error);
    }
  }

  @Put(":id")
  @ApiOperation({ summary: "Update Device by ID" })
  async updateDevice(
    @Param("id") id: string,
    @Body() updateDeviceRequest: DeviceCommandRequest
  ): Promise<ApiResponse<Device>> {
    try {
      await this.deviceCommandService.executeCommand(id, updateDeviceRequest);
      const device = await this.deviceService.getDevice(id);
      return ResponseBuilder.success(device);
    } catch (error) {
      this.logger.error('Failed to update device', error as Error, { id });
      return ResponseBuilder.fromError(error as Error);
    }
  }
}
```

**File 3: Create device command service**
- **Location**: `src/services/device-command.service.ts` (NEW FILE)
- **Action**: Create this file and add:

```typescript
// src/services/device-command.service.ts
import type {
  IDeviceCommandService,
  IRepository,
  WinccoaDevice,
  DeviceCommandRequest,
  ILogger
} from '@/types';
import { NotFoundError, ValidationError } from '@/types';
import { ValidationService } from '@/utils/validation';

export class DeviceCommandService implements IDeviceCommandService {
  constructor(
    private readonly deviceRepository: IRepository<WinccoaDevice>,
    private readonly logger: ILogger
  ) {}

  async executeCommand(
    deviceId: string,
    commandRequest: DeviceCommandRequest
  ): Promise<void> {
    const device = await this.deviceRepository.findById(deviceId);
    if (!device) {
      throw new NotFoundError('Device', deviceId);
    }

    const [command, value] = this.parseControlMode(commandRequest.controlMode);
    const fullyQualifiedDpName = this.buildDpeName(device, command);

    await this.executeWinccoaCommand(fullyQualifiedDpName, value);

    this.logger.info('Device command executed', {
      deviceId,
      command,
      value
    });
  }

  private parseControlMode(controlMode: string): [string, string] {
    const [command, value] = controlMode.split(':');
    if (!command || !value) {
      throw new ValidationError('Invalid control mode format. Expected "command:value"');
    }
    return [command, value];
  }

  private buildDpeName(device: WinccoaDevice, command: string): string {
    const columnMapping = device.commandMappings.get(command);
    if (!columnMapping) {
      throw new ValidationError(`Unknown command: ${command}`);
    }
    return `${device.remoteSystem}:${device.dpName}.${columnMapping}`;
  }

  private async executeWinccoaCommand(dpeName: string, value: string): Promise<void> {
    // Integrate with your WinCC OA system here
    // This is where you'd use WSGateway.winccoa.dpSet(dpeName, value)
    this.logger.info('Executing WinCC OA command', { dpeName, value });
  }
}
```

**File 4: Create WinCC OA repository**
- **Location**: `src/repositories/winccoa.repository.ts` (NEW FILE)
- **Action**: Create this file and add:

```typescript
// src/repositories/winccoa.repository.ts
import type { IWinccoaRepository, WinccoaDevice, ILogger } from '@/types';
import { WSGateway } from '../WSGateway'; // Your existing gateway

export class WinccoaRepository implements IWinccoaRepository {
  constructor(private readonly logger: ILogger) {}

  async executeCommand(dpeName: string, value: string): Promise<void> {
    try {
      await WSGateway.winccoa.dpSet(dpeName, value);
      this.logger.info('WinCC OA command executed', { dpeName, value });
    } catch (error) {
      this.logger.error('Failed to execute WinCC OA command', error as Error, { dpeName, value });
      throw error;
    }
  }

  async findRemoteSystem(deviceId: string): Promise<string> {
    // Replace WinccoaUtils.findRemoteSystem with proper logic
    // This should be moved from utils to repository
    const remoteSystem = await this.lookupRemoteSystem(deviceId);
    return remoteSystem;
  }

  buildDpeName(device: WinccoaDevice, command: string): string {
    const columnMapping = device.commandMappings.get(command);
    if (!columnMapping) {
      throw new Error(`Unknown command: ${command}`);
    }
    return `${device.remoteSystem}:${device.dpName}.${columnMapping}`;
  }

  private async lookupRemoteSystem(deviceId: string): Promise<string> {
    // Implement your remote system lookup logic here
    // This replaces the static WinccoaUtils.findRemoteSystem method
    return 'woa_omcs'; // Default or implement proper lookup
  }
}
```

**File 5: Update existing utils**
- **Location**: `src/utils/winccoaUtils.ts`
- **Action**: DELETE the findRemoteSystem method (moved to repository)

**File 6: Update app module**
- **Location**: `src/app.module.ts`
- **Action**: Update imports and providers:

```typescript
// UPDATE IMPORTS in src/app.module.ts
import { DeviceCommandService } from "./services/device-command.service"; // New import
import { WinccoaRepository } from "./repositories/winccoa.repository"; // New import

@Module({
  imports: [EventEmitterModule.forRoot(), ValueTemplateModule],
  controllers: [DevicesController, UserController],
  providers: [
    WSGateway,
    DeviceCommandService, // New provider
    WinccoaRepository, // New provider
    {
      provide: 'ILogger',
      useClass: ConsoleLogger,
    }, // New provider
  ],
}

### 3. **For PMCS Devices**

#### What to Replace:

| **Your Current PMCS Code** | **Replace With Template Pattern** |
|----------------------------|-----------------------------------|
| ```typescript<br/>export class VaPmcsDeviceLogic {<br/>  // 684 lines of mixed responsibilities:<br/>  // - Bit manipulation<br/>  // - Callback management<br/>  // - Status handling<br/>  // - Error management<br/>  // - WinCC OA integration<br/>  public async run(): Promise<void> {<br/>    await this.getBitMapping();<br/>    this.createStatusCallback(...);<br/>    this.createCmdCallback();<br/>    this.createDpeCallback(...);<br/>    // ... 600+ more lines<br/>  }<br/>}``` | ```typescript<br/>// Split into focused services:<br/>export abstract class PmcsDeviceBaseService {<br/>  async run(): Promise<void> {<br/>    await this.initializeBitMappings();<br/>    await this.setupStatusCallbacks();<br/>    await this.setupCommandCallbacks();<br/>    await this.setupCustomCallbacks(); // Abstract<br/>  }<br/>}<br/><br/>export class AxialFanService extends PmcsDeviceBaseService {<br/>  protected async setupCustomCallbacks(): Promise<void> {<br/>    // Only axial fan specific logic<br/>  }<br/>}``` |
| 684-line monolithic class | Split into focused, single-purpose services |
| Direct WinCC OA manager usage | Abstracted through repository pattern |
| Mixed concerns in one class | Clear separation: Base + Specific implementations |
| Hard-coded device type switches | Factory pattern for device creation |
| `console.log` everywhere | Structured logging with context |
| No error typing | Custom error classes with proper inheritance |
| Manual callback management | Centralized callback lifecycle management |

#### Specific Replacements:

| **Current Pattern** | **New Pattern** | **Benefit** |
|--------------------|-----------------|-------------|
| ```typescript<br/>constructor(dpName: string, className: string, winccOA: WinccoaManager) {<br/>  this.dpName = dpName;<br/>  this.className = className;<br/>  this.woa = winccOA;<br/>}``` | ```typescript<br/>constructor(<br/>  protected readonly device: PmcsDevice,<br/>  protected readonly winccoa: WinccoaManager,<br/>  protected readonly logger: ILogger<br/>) {}``` | Dependency injection + structured data |
| `console.log("createCmdCallback > " + \`Command dpe does not exist: ${cmd_dpe}\`)` | `this.logger.error('Command DPE not found', { cmdDpe: cmd_dpe, deviceName: this.device.dpName })` | Structured logging with context |
| ```typescript<br/>public createCmdCallback(): void {<br/>  // 50+ lines of mixed logic<br/>}``` | ```typescript<br/>private readonly callbackService = new CallbackService();<br/>protected setupCommandCallback(): void {<br/>  this.callbackService.createCallback({...});<br/>}``` | Single responsibility |
| ```typescript<br/>if (this.woa.dpExists(status_dpe)) {<br/>  // callback logic<br/>}``` | ```typescript<br/>await this.winccoaRepository.createCallback({<br/>  dpePath: status_dpe,<br/>  callback: this.handleStatusUpdate.bind(this)<br/>});``` | Repository pattern for data access |

#### Step-by-Step File Changes for PMCS Devices:

**File 1: Create new PMCS types**
- **Location**: `src/types/pmcs-device.ts` (NEW FILE)
- **Action**: Create this file and add:

```typescript
// src/types/pmcs-device.ts
import type { WinccoaConnectUpdateType, WinccoaError, WinccoaManager } from 'winccoa-manager';

export interface IPmcsDeviceLogic {
  run(): Promise<void>;
  stop(): Promise<void>;
}

export interface PmcsDevice {
  readonly dpName: string;
  readonly className: string;
  readonly bitMappings: BitMappings;
}

export interface BitMappings {
  readonly cmd: Map<number, string>;
  readonly status: Map<number, string>;
  readonly warning: Map<number, string>;
  readonly fault: Map<number, string>;
  readonly interlock: Map<number, string>;
  readonly permissive: Map<number, string>;
}

export interface DeviceCallback {
  readonly dpePath: string;
  readonly callback: CallbackFunction;
  readonly userData?: unknown;
}

export type CallbackFunction = (
  names: string[],
  values: unknown[],
  type: WinccoaConnectUpdateType,
  error?: WinccoaError
) => void;

export interface IPmcsDeviceFactory {
  createDevice(dpName: string, className: string): IPmcsDeviceLogic;
}
```

**File 2: Create base service class**
- **Location**: `src/services/pmcs-device-base.service.ts` (NEW FILE)
- **Action**: Create this file and add:

```typescript
// src/services/pmcs-device-base.service.ts
import type {
  IPmcsDeviceLogic,
  PmcsDevice,
  DeviceCallback,
  CallbackFunction,
  ILogger
} from '@/types';
import type { WinccoaManager } from 'winccoa-manager';

export abstract class PmcsDeviceBaseService implements IPmcsDeviceLogic {
  protected readonly callbacks: DeviceCallback[] = [];

  constructor(
    protected readonly device: PmcsDevice,
    protected readonly winccoa: WinccoaManager,
    protected readonly logger: ILogger
  ) {}

  async run(): Promise<void> {
    await this.initializeBitMappings();
    await this.setupStatusCallbacks();
    await this.setupCommandCallbacks();
    await this.setupCustomCallbacks(); // Abstract method
  }

  async stop(): Promise<void> {
    this.callbacks.forEach(callback => {
      // Disconnect WinCC OA callbacks
    });
    this.callbacks.length = 0;
  }

  protected abstract setupCustomCallbacks(): Promise<void>;

  protected async initializeBitMappings(): Promise<void> {
    // Common bit mapping initialization logic
  }

  protected setupStatusCallback(dpePath: string, bitMapping: Map<number, string>): void {
    const callback: CallbackFunction = (names, values, type, error) => {
      if (error) {
        this.logger.error('Status callback error', error);
        return;
      }
      this.handleStatusUpdate(bitMapping, names, values);
    };

    this.callbacks.push({ dpePath, callback });
  }

  private handleStatusUpdate(
    bitMapping: Map<number, string>,
    names: string[],
    values: unknown[]
  ): void {
    // Common status handling logic
  }
}
```

**File 3: Replace the large base class**
- **Location**: `classes/VaPmcsDeviceLogic.ts`
- **Action**: REPLACE the entire 684-line file with:

```typescript
// REPLACE ENTIRE FILE: classes/VaPmcsDeviceLogic.ts
import type { IPmcsDeviceFactory, IPmcsDeviceLogic, PmcsDevice, ILogger } from '@/types';
import type { WinccoaManager } from 'winccoa-manager';
import { AxialFanService } from '../services/axial-fan.service';
import { FirePanelService } from '../services/fire-panel.service';
import { ValidationError } from '@/types';

export class PmcsDeviceFactory implements IPmcsDeviceFactory {
  constructor(
    private readonly winccoa: WinccoaManager,
    private readonly logger: ILogger
  ) {}

  createDevice(dpName: string, className: string): IPmcsDeviceLogic {
    const device: PmcsDevice = {
      dpName,
      className,
      bitMappings: {
        cmd: new Map(),
        status: new Map(),
        warning: new Map(),
        fault: new Map(),
        interlock: new Map(),
        permissive: new Map(),
      }
    };

    switch (className) {
      case 'VaAxialFanSFN':
      case 'VaAxialFanXFN':
        return new AxialFanService(device, this.winccoa, this.logger);

      case 'VaMainFirePanel':
        return new FirePanelService(device, this.winccoa, this.logger);

      default:
        throw new ValidationError(`Unsupported device class: ${className}`);
    }
  }
}
```

**File 4: Create specific device services**
- **Location**: `src/services/axial-fan.service.ts` (NEW FILE)
- **Action**: Create this file and add:

```typescript
// src/services/axial-fan.service.ts
import { PmcsDeviceBaseService } from './pmcs-device-base.service';

export class AxialFanService extends PmcsDeviceBaseService {
  protected async setupCustomCallbacks(): Promise<void> {
    this.setupStatusCallback(
      `${this.device.dpName}.states.currentFanSpeed`,
      new Map([[0, 'fanSpeed'], [1, 'fanStatus']])
    );

    this.logger.info('Axial fan specific callbacks setup', {
      dpName: this.device.dpName
    });
  }
}
```

- **Location**: `src/services/fire-panel.service.ts` (NEW FILE)
- **Action**: Create this file and add:

```typescript
// src/services/fire-panel.service.ts
import { PmcsDeviceBaseService } from './pmcs-device-base.service';

export class FirePanelService extends PmcsDeviceBaseService {
  protected async setupCustomCallbacks(): Promise<void> {
    this.setupStatusCallback(
      `${this.device.dpName}.states.currentHliCommSts`,
      new Map([[0, 'hliComm'], [1, 'hliStatus']])
    );

    this.logger.info('Fire panel specific callbacks setup', {
      dpName: this.device.dpName
    });
  }
}
```

**File 5: Update index.ts**
- **Location**: `index.ts`
- **Action**: REPLACE the main function with:

```typescript
// REPLACE MAIN FUNCTION in index.ts
import { WinccoaManager } from "winccoa-manager";
import { PmcsDeviceFactory } from "./classes/VaPmcsDeviceLogic";
import { ConsoleLogger } from "./utils/logger";
import type { IPmcsDeviceLogic } from '@/types';

const winccoa = new WinccoaManager();
const logger = new ConsoleLogger('info');
const deviceFactory = new PmcsDeviceFactory(winccoa, logger);

class DeviceManager {
  private readonly devices: IPmcsDeviceLogic[] = [];

  async initializeAllDevices(): Promise<void> {
    const deviceConfigs = [
      { filter: "*", className: "VaAxialFanSFN" },
      { filter: "*", className: "VaAxialFanXFN" },
      { filter: "*", className: "VaMainFirePanel" },
    ];

    for (const config of deviceConfigs) {
      await this.initializeDeviceType(config.filter, config.className);
    }
  }

  private async initializeDeviceType(filter: string, className: string): Promise<void> {
    try {
      const dpNames = winccoa.dpNames(filter, className);

      for (const dpName of dpNames) {
        const deviceName = this.extractDeviceName(dpName);
        const device = deviceFactory.createDevice(deviceName, className);

        await device.run();
        this.devices.push(device);
      }
    } catch (error) {
      logger.error(`Failed to initialize ${className} devices`, error as Error);
    }
  }

  private extractDeviceName(dpName: string): string {
    return dpName.split(':')[1] || dpName;
  }

  async shutdown(): Promise<void> {
    for (const device of this.devices) {
      await device.stop();
    }
    this.devices.length = 0;
  }
}

async function main(): Promise<void> {
  const manager = new DeviceManager();

  try {
    await manager.initializeAllDevices();
    logger.info('All PMCS devices initialized successfully');
  } catch (error) {
    logger.error('Failed to initialize PMCS devices', error as Error);
    process.exit(1);
  }

  process.on('SIGINT', async () => {
    logger.info('Shutting down PMCS devices...');
    await manager.shutdown();
    process.exit(0);
  });
}

void main();
```

#### Refactor the base class following SRP:

```typescript
// src/services/pmcs-device-base.service.ts
export abstract class PmcsDeviceBaseService implements IPmcsDeviceLogic {
  protected readonly callbacks: DeviceCallback[] = [];

  constructor(
    protected readonly device: PmcsDevice,
    protected readonly winccoa: WinccoaManager,
    protected readonly logger: ILogger
  ) {}

  // Template method (Open/Closed Principle)
  async run(): Promise<void> {
    await this.initializeBitMappings();
    await this.setupStatusCallbacks();
    await this.setupCommandCallbacks();
    await this.setupCustomCallbacks(); // Abstract method
  }

  async stop(): Promise<void> {
    // Cleanup all callbacks
    this.callbacks.forEach(callback => {
      // Disconnect WinCC OA callbacks
    });
    this.callbacks.length = 0;
  }

  // Abstract method - each device implements its specific logic
  protected abstract setupCustomCallbacks(): Promise<void>;

  protected async initializeBitMappings(): Promise<void> {
    // Common bit mapping initialization logic
  }

  protected setupStatusCallback(dpePath: string, bitMapping: Map<number, string>): void {
    const callback: CallbackFunction = (names, values, type, error) => {
      if (error) {
        this.logger.error('Status callback error', error);
        return;
      }
      this.handleStatusUpdate(bitMapping, names, values);
    };

    this.callbacks.push({ dpePath, callback });
    // Register with WinCC OA
  }

  private handleStatusUpdate(
    bitMapping: Map<number, string>,
    names: string[],
    values: unknown[]
  ): void {
    // Common status handling logic
  }
}
```

#### Create specific device implementations:

```typescript
// src/services/axial-fan.service.ts
export class AxialFanService extends PmcsDeviceBaseService {
  protected async setupCustomCallbacks(): Promise<void> {
    // Axial fan specific callbacks
    this.setupStatusCallback(
      `${this.device.dpName}.states.currentFanSpeed`,
      new Map()
    );
  }
}

// src/services/fire-panel.service.ts
export class FirePanelService extends PmcsDeviceBaseService {
  protected async setupCustomCallbacks(): Promise<void> {
    // Fire panel specific callbacks
    this.setupStatusCallback(
      `${this.device.dpName}.states.currentHliCommSts`,
      new Map()
    );
  }
}
```

#### Device Factory (following Factory Pattern):

```typescript
// src/services/device.factory.ts
export class PmcsDeviceFactory {
  static createDevice(
    deviceConfig: PmcsDevice,
    winccoa: WinccoaManager,
    logger: ILogger
  ): IPmcsDeviceLogic {
    switch (deviceConfig.className) {
      case 'VaAxialFanSFN':
      case 'VaAxialFanXFN':
        return new AxialFanService(deviceConfig, winccoa, logger);

      case 'VaMainFirePanel':
        return new FirePanelService(deviceConfig, winccoa, logger);

      case 'VaDelugeValve':
        return new DelugeValveService(deviceConfig, winccoa, logger);

      default:
        throw new ValidationError(`Unsupported device class: ${deviceConfig.className}`);
    }
  }
}
```

## Integration Patterns

### Express.js Integration (for HTTP APIs):

```typescript
// src/infrastructure/express.server.ts
import express from 'express';

export class ExpressServer {
  private app = express();

  constructor(
    private readonly alarmController: AlarmController,
    private readonly deviceController: DeviceController,
    private readonly logger: ILogger
  ) {
    this.setupMiddleware();
    this.setupRoutes();
  }

  private setupRoutes(): void {
    this.app.put('/api/v1/alarms/:id', async (req, res) => {
      const result = await this.alarmController.acknowledgeAlarm({
        id: req.params.id,
        userId: req.headers['x-user-id'] as string,
      });

      res.status(result.success ? 200 : 500).json(result);
    });

    this.app.get('/api/v1/devices/:id', async (req, res) => {
      const result = await this.deviceController.getDevice({
        id: req.params.id,
      });

      res.status(result.success ? 200 : 404).json(result);
    });
  }
}
```

### WebSocket Integration (for real-time updates):

```typescript
// src/infrastructure/websocket.gateway.ts
export class WebSocketGateway {
  constructor(
    private readonly alarmService: IAlarmService,
    private readonly logger: ILogger
  ) {}

  setupAlarmSubscriptions(socket: WebSocket): void {
    // Subscribe to alarm updates and send to client
    this.alarmService.onAlarmUpdate((alarm) => {
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({
          type: 'ALARM_UPDATE',
          data: alarm,
        }));
      }
    });
  }
}
```

## Testing Examples

```typescript
// src/tests/alarm.service.test.ts
describe('AlarmService', () => {
  let alarmService: AlarmService;
  let mockRepository: jest.Mocked<IRepository<Alarm>>;
  let mockLogger: jest.Mocked<ILogger>;

  beforeEach(() => {
    mockRepository = createMockRepository<Alarm>();
    mockLogger = createMockLogger();
    alarmService = new AlarmService(mockRepository, mockLogger);
  });

  describe('acknowledgeAlarm', () => {
    it('should acknowledge an active alarm', async () => {
      // Arrange
      const alarmId = 'alarm-123';
      const userId = 'user-456';
      const alarm: Alarm = {
        id: alarmId,
        uuid: 'uuid-123',
        severity: 'HIGH',
        status: 'ACTIVE',
        acknowledged: false,
        timestamp: new Date(),
        description: 'Test alarm',
      };

      mockRepository.findById.mockResolvedValue(alarm);
      mockRepository.update.mockResolvedValue({
        ...alarm,
        acknowledged: true,
        acknowledgedBy: userId,
        acknowledgedAt: expect.any(Date),
        status: 'ACKNOWLEDGED',
      });

      // Act
      const result = await alarmService.acknowledgeAlarm(alarmId, userId);

      // Assert
      expect(result.acknowledged).toBe(true);
      expect(result.acknowledgedBy).toBe(userId);
      expect(mockRepository.update).toHaveBeenCalledWith(alarmId, {
        acknowledged: true,
        acknowledgedBy: userId,
        acknowledgedAt: expect.any(Date),
        status: 'ACKNOWLEDGED',
      });
    });

    it('should throw ValidationError when alarm already acknowledged', async () => {
      // Arrange
      const alarm: Alarm = {
        id: 'alarm-123',
        uuid: 'uuid-123',
        severity: 'HIGH',
        status: 'ACKNOWLEDGED',
        acknowledged: true,
        timestamp: new Date(),
        description: 'Test alarm',
      };

      mockRepository.findById.mockResolvedValue(alarm);

      // Act & Assert
      await expect(alarmService.acknowledgeAlarm('alarm-123', 'user-456'))
        .rejects
        .toThrow(ValidationError);
    });
  });
});
```

## Configuration & Setup Replacements

### **TypeScript Configuration Changes**

| **Your Current tsconfig.json** | **Replace With Template tsconfig.json** |
|--------------------------------|------------------------------------------|
| ```json<br/>"noImplicitAny": false``` | ```json<br/>"noImplicitAny": true``` |
| ```json<br/>"target": "es2016"<br/>"module": "commonjs"``` | ```json<br/>"target": "ES2022"<br/>"module": "ESNext"``` |
| Missing strict options | ```json<br/>"strict": true,<br/>"noImplicitReturns": true,<br/>"noUncheckedIndexedAccess": true,<br/>"exactOptionalPropertyTypes": true``` |
| No path mapping | ```json<br/>"baseUrl": "./src",<br/>"paths": {<br/>  "@/*": ["*"],<br/>  "@/types/*": ["types/*"]<br/>}``` |

### **Package.json Script Replacements**

| **Current Scripts** | **Replace With Template Scripts** |
|--------------------|------------------------------------|
| ```json<br/>"start": "node dist/server/server.js"<br/>"dev": "ts-node-dev --respawn --transpile-only src/server/server.ts"``` | ```json<br/>"start": "node dist/main.js"<br/>"dev": "tsx watch src/main.ts"``` |
| ```json<br/>"build": "tsc"``` | ```json<br/>"build": "tsc && tsc-alias"``` |
| ```json<br/>"test": "jest dist/test"``` | ```json<br/>"test": "vitest"<br/>"test:coverage": "vitest --coverage"``` |
| No validation scripts | ```json<br/>"lint": "eslint src --ext .ts --fix"<br/>"validate": "npm run type-check && npm run lint:check"``` |

### **Error Handling Replacements**

| **Current Error Handling** | **Replace With Template Pattern** |
|----------------------------|-----------------------------------|
| ```typescript<br/>try {<br/>  values = (await this.woa.dpGet(dpElements)) as [string[], number[]];<br/>} catch (exe) {<br/>  //add debug log<br/>}``` | ```typescript<br/>try {<br/>  const values = await this.winccoaRepository.getValues(dpElements);<br/>  return this.processValues(values);<br/>} catch (error) {<br/>  this.logger.error('Failed to get DP values', error, {<br/>    dpElements,<br/>    deviceName: this.device.dpName<br/>  });<br/>  throw new WinccoaError('DP value retrieval failed', error);<br/>}``` |
| Generic `catch` blocks | Specific error types with context |
| `console.log(error)` | Structured error logging |
| No error propagation | Proper error throwing with typed errors |

### **Import Statement Replacements**

| **Current Imports** | **Replace With Template Imports** |
|--------------------|-----------------------------------|
| ```typescript<br/>import { AckedSetByUuid } from '../../services/Acknowledgement'``` | ```typescript<br/>import type { IAlarmService } from '@/types';<br/>import { AlarmService } from '@/services/alarm.service';``` |
| Relative path imports | Path-mapped imports using `@/` |
| Mixed default/named imports | Consistent import patterns |
| No type-only imports | `import type` for type-only imports |

### **Dependency Injection Replacements**

| **Current Pattern** | **Replace With Template Pattern** |
|--------------------|------------------------------------|
| ```typescript<br/>export class AlarmsController {<br/>  @Put(":id")<br/>  updateAlarm(@Param("id") id: string, @Body() body: any) {<br/>    const ackedSetByUuid = new AckedSetByUuid();<br/>    ackedSetByUuid.ack(id);<br/>  }<br/>}``` | ```typescript<br/>export class AlarmController {<br/>  constructor(<br/>    private readonly alarmService: IAlarmService,<br/>    private readonly logger: ILogger<br/>  ) {}<br/><br/>  async acknowledgeAlarm(request: AlarmRequest): Promise<ApiResponse<Alarm>> {<br/>    return this.alarmService.acknowledgeAlarm(request.id, request.userId);<br/>  }<br/>}``` |
| Direct instantiation | Constructor injection |
| No interface dependencies | Interface-based dependencies |
| No logging | Injected logger |

## Step-by-Step Migration Checklist

### **Phase 1: Configuration **
- [ ] Replace `tsconfig.json` with template version
- [ ] Update `package.json` scripts
- [ ] Add ESLint and Prettier configurations
- [ ] Install new dependencies: `npm install zod tsx vitest`

### **Phase 2: Types **
- [ ] Create `src/types/index.ts` with your domain types
- [ ] Replace all `any` types with proper interfaces
- [ ] Add validation schemas with Zod
- [ ] Create custom error classes

### **Phase 3: Structure **
- [ ] Move controllers to `src/controllers/`
- [ ] Extract business logic to `src/services/`
- [ ] Create data access layer in `src/repositories/`
- [ ] Move utilities to `src/utils/`

### **Phase 4: Implementation **
- [ ] Implement dependency injection container
- [ ] Replace console.log with structured logging
- [ ] Add proper error handling
- [ ] Write unit tests for business logic

### **Phase 5: Validation **
- [ ] Run `npm run validate` and fix all issues
- [ ] Ensure zero `any` types
- [ ] Add integration tests
- [ ] Document the new architecture

This template provides a solid foundation that you can adapt for all three of your repositories while maintaining TypeScript best practices and SOLID principles!
