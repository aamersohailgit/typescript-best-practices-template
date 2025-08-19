# TypeScript Best Practices Template - Usage Examples

## Table of Contents

1. [Quick Start Guide](#quick-start-guide)
2. [Unified TypeScript Configuration](#unified-typescript-configuration)
3. [Repository Analysis Summary](#repository-analysis-summary)
4. [Repository 1: AM Backend (Alarm Management)](#repository-1-am-backend-alarm-management)
5. [Repository 2: DM Backend (Device Management)](#repository-2-dm-backend-device-management)
6. [Repository 3: PMCS Devices](#repository-3-pmcs-devices)
7. [Repository 4: Command Handler](#repository-4-command-handler)
8. [Common Migration Patterns](#common-migration-patterns)
9. [Configuration Updates](#configuration-updates)
10. [Testing & Validation](#testing--validation)

---

## Quick Start Guide

### What This Template Provides

This template gives you a **production-ready TypeScript project structure** that follows:
- **SOLID Principles** - Single responsibility, dependency injection, interfaces
- **DRY Principle** - No code duplication, reusable utilities
- **KISS Principle** - Simple, readable, maintainable code
- **TypeScript Best Practices** - Strict typing, no `any`, proper error handling

### How to Use This Template

1. **Choose your repository** from the sections below
2. **Follow the step-by-step file changes** for that specific repository
3. **Apply the common patterns** to other parts of your codebase
4. **Use the configuration updates** to improve your TypeScript setup

---

## Unified TypeScript Configuration

### **Why Unified Configuration?**

Having consistent `tsconfig.json` across all repositories ensures:
- **Code Consistency** - Same TypeScript rules everywhere
- **Easier Maintenance** - Update rules in one place
- **Team Productivity** - Developers know what to expect
- **Quality Assurance** - Consistent code quality standards

### **Configuration Strategy**

This template provides a **single, production-ready TypeScript configuration** that all repositories should use:

```
typescript-best-practices-template/
└── tsconfig.json          # Single configuration for all repos
```

### **Implementation for Your Repositories**

#### **1. Copy the Template Configuration**

Copy `tsconfig.json` to each repository's root directory.

#### **2. Repository-Specific Customizations**

**For NestJS Projects (AM Backend, DM Backend, Command Handler):**

```json
// In your tsconfig.json, ensure these settings:
{
  "compilerOptions": {
    "module": "CommonJS", // NestJS works better with CommonJS
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true
  }
}
```

**For Standalone TypeScript (PMCS Devices):**

```json
// In your tsconfig.json, ensure these settings:
{
  "compilerOptions": {
    "module": "ESNext",
    "experimentalDecorators": false,
    "emitDecoratorMetadata": false
  }
}
```

#### **3. Benefits of This Approach**

- **Consistent Rules**: All repos use the same strict TypeScript settings
- **Single Source of Truth**: One configuration file to maintain
- **Easy Updates**: Change rules once, apply everywhere
- **Modern TypeScript**: Uses latest features and strict checking

### **Key Configuration Features**

| **Feature** | **Benefit** |
|-------------|-------------|
| `"strict": true` | Enables all strict type checking |
| `"noImplicitAny": true` | Prevents implicit any types |
| `"exactOptionalPropertyTypes": true` | Strict optional property handling |
| `"noUncheckedIndexedAccess": true` | Safe array/object access |
| Path mapping with `@/*` | Clean, consistent imports |
| Decorator support | Full NestJS compatibility |

---

## NestJS Best Practices

### **Architecture Principles**

#### **1. Clean Architecture Layers**

```
src/
├── presentation/     # Controllers, DTOs, Guards, Interceptors
├── application/      # Use Cases, Application Services
├── domain/          # Business Logic, Entities, Interfaces
└── infrastructure/  # External Dependencies, Database, APIs
```

#### **2. SOLID Principles in NestJS**

- **Single Responsibility**: Each class has one reason to change
- **Open/Closed**: Extend functionality without modifying existing code
- **Liskov Substitution**: Use interfaces for dependency injection
- **Interface Segregation**: Keep interfaces focused and small
- **Dependency Inversion**: Depend on abstractions, not concretions

### **Project Structure**

#### **Recommended Directory Structure**

```
src/
├── config/                 # Configuration files
├── controllers/            # HTTP request handlers
├── services/              # Business logic
├── repositories/          # Data access layer
├── entities/              # Database models
├── dto/                   # Data Transfer Objects
├── interfaces/            # TypeScript interfaces
├── guards/                # Route guards
├── interceptors/          # Request/response interceptors
├── pipes/                 # Validation pipes
├── filters/               # Exception filters
├── middleware/            # Custom middleware
├── decorators/            # Custom decorators
├── utils/                 # Utility functions
└── main.ts                # Application entry point
```

### **Dependency Injection Best Practices**

#### **1. Constructor Injection (Recommended)**

```typescript
@Injectable()
export class UserService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly logger: ILogger,
    private readonly configService: ConfigService,
  ) {}
}
```

#### **2. Use Interfaces for Dependencies**

```typescript
// interfaces/user-repository.interface.ts
export interface IUserRepository {
  create(userData: CreateUserDto): Promise<User>;
  findById(id: number): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
}

// services/user.service.ts
@Injectable()
export class UserService {
  constructor(
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
  ) {}
}
```

### **Controller Best Practices**

#### **1. Keep Controllers Thin**

```typescript
@Controller('users')
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly logger: ILogger,
  ) {}

  @Post()
  @UsePipes(new ValidationPipe({ transform: true }))
  async createUser(@Body() createUserDto: CreateUserDto): Promise<ApiResponse<User>> {
    try {
      const user = await this.userService.createUser(createUserDto);
      return ResponseBuilder.success(user);
    } catch (error) {
      this.logger.error('Failed to create user', error);
      return ResponseBuilder.fromError(error);
    }
  }
}
```

#### **2. Use DTOs for Request/Response**

```typescript
// dto/create-user.dto.ts
export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  @Length(2, 50)
  readonly firstName: string;

  @IsString()
  @IsNotEmpty()
  @Length(2, 50)
  readonly lastName: string;

  @IsEmail()
  readonly email: string;

  @IsString()
  @MinLength(8)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
  readonly password: string;
}
```

### **Service Best Practices**

#### **1. Single Responsibility**

```typescript
@Injectable()
export class UserService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly emailService: EmailService,
    private readonly logger: ILogger,
  ) {}

  async createUser(createUserDto: CreateUserDto): Promise<User> {
    // Validate business rules
    await this.validateUserCreation(createUserDto);

    // Create user
    const user = await this.userRepository.create(createUserDto);

    // Send welcome email
    await this.emailService.sendWelcomeEmail(user.email);

    // Log success
    this.logger.info('User created successfully', { userId: user.id });

    return user;
  }
}
```

### **Repository Pattern**

#### **1. Abstract Data Access**

```typescript
// repositories/base.repository.ts
export abstract class BaseRepository<T> {
  constructor(
    protected readonly repository: Repository<T>,
    protected readonly logger: ILogger,
  ) {}

  async findById(id: number): Promise<T | null> {
    try {
      return await this.repository.findOne({ where: { id } as any });
    } catch (error) {
      this.logger.error('Failed to find entity by ID', error, { id });
      throw new DatabaseException('Failed to retrieve entity');
    }
  }
}
```

### **Error Handling**

#### **1. Custom Exception Classes**

```typescript
// exceptions/custom.exceptions.ts
export class ValidationException extends BadRequestException {
  constructor(message: string, public readonly errors: string[]) {
    super(message);
  }
}

export class DatabaseException extends InternalServerErrorException {
  constructor(message: string, public readonly originalError?: Error) {
    super(message);
  }
}
```

#### **2. Global Exception Filter**

```typescript
// filters/global-exception.filter.ts
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  constructor(private readonly logger: ILogger) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let errorCode = 'INTERNAL_ERROR';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      message = exception.message;
      errorCode = this.getErrorCode(exception);
    }

    // Log error
    this.logger.error('Exception occurred', exception, {
      path: request.url,
      method: request.method,
      status,
      errorCode,
    });

    // Send response
    response.status(status).json({
      success: false,
      error: {
        code: errorCode,
        message,
        timestamp: new Date().toISOString(),
        path: request.url,
      },
    });
  }
}
```

### **Testing Strategy**

#### **1. Unit Testing Services**

```typescript
// user.service.spec.ts
describe('UserService', () => {
  let service: UserService;
  let mockRepository: jest.Mocked<IUserRepository>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: 'IUserRepository',
          useValue: createMockRepository(),
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    mockRepository = module.get('IUserRepository');
  });

  it('should create user successfully', async () => {
    const createUserDto = {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      password: 'SecurePass123!',
    };

    const expectedUser = { id: 1, ...createUserDto };
    mockRepository.create.mockResolvedValue(expectedUser);

    const result = await service.createUser(createUserDto);

    expect(result).toEqual(expectedUser);
    expect(mockRepository.create).toHaveBeenCalledWith(createUserDto);
  });
});
```

### **Performance & Security**

#### **1. Caching Strategy**

```typescript
@Injectable()
export class UserService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly cacheManager: Cache,
  ) {}

  @CacheKey('user')
  @CacheTTL(300) // 5 minutes
  async getUserById(id: number): Promise<User> {
    const cacheKey = `user:${id}`;

    // Try to get from cache first
    let user = await this.cacheManager.get<User>(cacheKey);
    if (user) {
      return user;
    }

    // Get from database
    user = await this.userRepository.findById(id);
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    // Store in cache
    await this.cacheManager.set(cacheKey, user, 300);

    return user;
  }
}
```

#### **2. Security Headers**

```typescript
// main.ts
import helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Security headers
  app.use(helmet());

  // CORS configuration
  app.enableCors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });

  await app.listen(3000);
}
```

---

## Repository Analysis Summary

| Repository | Type | Current Status | Main Issues | Priority |
|------------|------|----------------|-------------|----------|
| **AM Backend** | NestJS | Basic structure | `any` types, no validation | High |
| **DM Backend** | NestJS | Good foundation | Mixed concerns, hardcoded values | Medium |
| **PMCS Devices** | TypeScript | Monolithic classes | 684-line classes, mixed responsibilities | High |
| **Command Handler** | NestJS | Well-structured | TypeScript config, complex patterns | Medium |

---

## Repository 1: AM Backend (Alarm Management)

### Current Problems
- Uses `any` types in controllers
- Direct service instantiation instead of dependency injection
- No request validation
- Mixed business logic in controllers

### What You'll Get
- Type-safe alarm management
- Proper dependency injection
- Request validation with Zod
- Separated concerns (Controller → Service → Repository)

### Step-by-Step Changes

#### 1. Create New Types File
**File**: `src/types/alarm.ts` (NEW FILE)

```typescript
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

#### 2. Replace Controller
**File**: `src/api/controllers/alarms.controller.ts` (REPLACE ENTIRE FILE)

```typescript
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
}
```

#### 3. Create Service
**File**: `src/services/alarm.service.ts` (NEW FILE)

```typescript
import type { IAlarmService, IRepository, Alarm, ILogger } from '@/types';
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
}
```

#### 4. Create Repository
**File**: `src/repositories/alarm.repository.ts` (NEW FILE)

```typescript
import type { IRepository, Alarm, ILogger } from '@/types';

export class AlarmRepository implements IRepository<Alarm> {
  private readonly alarms = new Map<string, Alarm>();

  constructor(private readonly logger: ILogger) {
    this.seedSampleData();
  }

  async findById(id: string): Promise<Alarm | null> {
    return this.alarms.get(id) || null;
  }

  async update(id: string, updates: Partial<Alarm>): Promise<Alarm | null> {
    const existing = this.alarms.get(id);
    if (!existing) return null;

    const updated: Alarm = { ...existing, ...updates, id };
    this.alarms.set(id, updated);
    return updated;
  }
}
```

#### 5. Update App Module
**File**: `src/app.module.ts` (UPDATE IMPORTS)

```typescript
import { AlarmController } from "./controllers/alarm.controller";
import { AlarmService } from "./services/alarm.service";
import { AlarmRepository } from "./repositories/alarm.repository";

@Module({
  controllers: [AlarmController, UserController],
  providers: [
    AlarmService,
    AlarmRepository,
    {
      provide: 'ILogger',
      useClass: ConsoleLogger,
    },
  ],
})
export class AppModule {}
```

---

## Repository 2: DM Backend (Device Management)

### Current Problems
- String parsing in controllers
- Direct WinCC OA calls
- Hard-coded string concatenation
- Mixed responsibilities

### What You'll Get
- Dedicated command parsing service
- Service layer abstraction
- Type-safe DP name building
- Separated concerns

### Step-by-Step Changes

#### 1. Create Device Types
**File**: `src/types/device.ts` (NEW FILE)

```typescript
export interface WinccoaDevice extends Device {
  readonly dpName: string;
  readonly remoteSystem: string;
  readonly className: string;
  readonly commandMappings: Map<string, string>;
}

export interface DeviceCommandRequest {
  readonly controlMode: string; // e.g., "desiredOpenCmd:true"
}

export interface IDeviceCommandService {
  executeCommand(deviceId: string, commandRequest: DeviceCommandRequest): Promise<void>;
}
```

#### 2. Replace Device Controller
**File**: `src/api/apis/device.controller.ts` (REPLACE ENTIRE FILE)

```typescript
import type { IDeviceCommandService, IDeviceService, ILogger, ApiResponse, Device, DeviceCommandRequest } from '@/types';
import { ResponseBuilder } from '@/utils/response';

@Controller("api/v1/devices")
export class DevicesController {
  constructor(
    private readonly deviceService: IDeviceService,
    private readonly deviceCommandService: IDeviceCommandService,
    private readonly logger: ILogger
  ) {}

  @Put(":id")
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

#### 3. Create Command Service
**File**: `src/services/device-command.service.ts` (NEW FILE)

```typescript
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
  }

  private parseControlMode(controlMode: string): [string, string] {
    const [command, value] = controlMode.split(':');
    if (!command || !value) {
      throw new ValidationError('Invalid control mode format. Expected "command:value"');
    }
    return [command, value];
  }
}
```

---

## Repository 3: PMCS Devices

### Current Problems
- 684-line monolithic class
- Mixed concerns in one class
- Direct WinCC OA manager usage
- Hard-coded device type switches

### What You'll Get
- Split into focused, single-purpose services
- Clear separation: Base + Specific implementations
- Factory pattern for device creation
- Centralized callback lifecycle management

### Step-by-Step Changes

#### 1. Create PMCS Types
**File**: `src/types/pmcs-device.ts` (NEW FILE)

```typescript
export interface IPmcsDeviceLogic {
  run(): Promise<void>;
  stop(): Promise<void>;
}

export interface PmcsDevice {
  readonly dpName: string;
  readonly className: string;
  readonly bitMappings: BitMappings;
}

export interface IPmcsDeviceFactory {
  createDevice(dpName: string, className: string): IPmcsDeviceLogic;
}
```

#### 2. Create Base Service
**File**: `src/services/pmcs-device-base.service.ts` (NEW FILE)

```typescript
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

  protected abstract setupCustomCallbacks(): Promise<void>;
}
```

#### 3. Replace Large Base Class
**File**: `classes/VaPmcsDeviceLogic.ts` (REPLACE ENTIRE FILE)

```typescript
export class PmcsDeviceFactory implements IPmcsDeviceFactory {
  constructor(
    private readonly winccoa: WinccoaManager,
    private readonly logger: ILogger
  ) {}

  createDevice(dpName: string, className: string): IPmcsDeviceLogic {
    const device: PmcsDevice = { dpName, className, bitMappings: { /* ... */ } };

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

#### 4. Create Specific Services
**File**: `src/services/axial-fan.service.ts` (NEW FILE)

```typescript
export class AxialFanService extends PmcsDeviceBaseService {
  protected async setupCustomCallbacks(): Promise<void> {
    this.setupStatusCallback(
      `${this.device.dpName}.states.currentFanSpeed`,
      new Map([[0, 'fanSpeed'], [1, 'fanStatus']])
    );
  }
}
```

---

## Repository 4: Command Handler

### Current Problems
- TypeScript configuration issues (`noImplicitAny: false`)
- Large services with mixed responsibilities
- Tight coupling in chain handlers
- Complex error aggregation logic

### What You'll Get
- Strict TypeScript configuration
- Clean architecture with proper interfaces
- Simplified chain pattern
- Proper error handling and validation

### Step-by-Step Changes

#### 1. Fix TypeScript Configuration
**File**: `tsconfig.json` (REPLACE ENTIRE FILE)

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "strict": true,
    "noImplicitAny": true,
    "strictBindCallApply": true,
    "exactOptionalPropertyTypes": true,
    "noUncheckedIndexedAccess": true,
    "baseUrl": "./src",
    "paths": {
      "@/*": ["*"],
      "@/domain/*": ["domain/*"],
      "@/application/*": ["application/*"],
      "@/infrastructure/*": ["infrastructure/*"],
      "@/presentation/*": ["presentation/*"]
    }
  }
}
```

#### 2. Implement Clean Architecture
**Structure**: Create new directory structure

```
src/
├── domain/           # Business logic interfaces
├── application/      # Use cases and application services
├── infrastructure/   # External dependencies (WinCC OA)
└── presentation/     # Controllers and DTOs
```

#### 3. Create Interfaces
**File**: `src/domain/interfaces/winccoa.interface.ts` (NEW FILE)

```typescript
export interface IWinccoaManager {
  connect(): Promise<void>
  disconnect(): Promise<void>
  sendCommand(command: Command): Promise<CommandResult>
}

export interface ICommandHandler {
  canHandle(command: Command): boolean
  handle(command: Command): Promise<CommandResult>
}
```

#### 4. Simplify Chain Pattern
**File**: `src/application/services/command.orchestrator.service.ts` (NEW FILE)

```typescript
@Injectable()
export class CommandOrchestratorService {
  constructor(
    private readonly handlers: ICommandHandler[],
    private readonly winccoaManager: IWinccoaManager
  ) {}

  async executeCommand(command: Command): Promise<CommandResult> {
    const handler = this.handlers.find(h => h.canHandle(command))
    if (!handler) {
      throw new CommandNotSupportedError(command.type)
    }

    return await handler.handle(command)
  }
}
```

---

## Common Migration Patterns

### Code Pattern Replacements

| **Current Pattern** | **New Pattern** | **Benefit** |
|--------------------|-----------------|-------------|
| `@Body() body: any` | `@Body() body: DeviceUpdateRequest` | Type safety instead of `any` |
| `if ("acked" in body)` | `const validated = ValidationService.validate(body)` | Runtime validation |
| `new AckedSetByUuid()` | `this.alarmService.acknowledgeAlarm()` | Dependency injection |
| `console.log()` | `this.logger.info()` | Structured logging |
| Large monolithic classes | Split into separate services | Single Responsibility |
| Direct WinCC OA calls | Service layer abstraction | Separation of concerns |

### File Structure Migration

| **Current Structure** | **New Template Structure** |
|----------------------|----------------------------|
| `src/api/controllers/` | `src/controllers/` |
| Mixed business logic in controllers | `src/services/` (business logic only) |
| Direct database/WinCC calls | `src/repositories/` (data access only) |
| Scattered type definitions | `src/types/` (centralized types) |
| No utility organization | `src/utils/` (pure functions) |

---

## Configuration Updates

### TypeScript Configuration Changes

| **Current Setting** | **New Setting** | **Why** |
|---------------------|-----------------|---------|
| `"noImplicitAny": false` | `"noImplicitAny": true` | Prevents implicit any types |
| `"target": "es2016"` | `"target": "ES2022"` | Modern JavaScript features |
| Missing strict options | `"strict": true` | Enables all strict checks |
| No path mapping | `"baseUrl": "./src"` | Clean import paths |

### Package.json Script Updates

| **Current Script** | **New Script** | **Purpose** |
|-------------------|-----------------|-------------|
| `"build": "tsc"` | `"build": "tsc && tsc-alias"` | Build with path mapping |
| `"test": "jest dist/test"` | `"test": "vitest"` | Modern testing framework |
| No validation scripts | `"validate": "npm run type-check && npm run lint:check"` | Code quality checks |

### ESLint Rule Updates

```javascript
// Add these rules to your ESLint config
{
  rules: {
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/explicit-function-return-type': 'error',
    'complexity': ['error', 10],
    'max-lines-per-function': ['error', 50],
    'max-params': ['error', 4]
  }
}
```

---

## Testing & Validation

### Unit Testing Examples

```typescript
describe('AlarmService', () => {
  let alarmService: AlarmService;
  let mockRepository: jest.Mocked<IRepository<Alarm>>;

  beforeEach(() => {
    mockRepository = createMockRepository<Alarm>();
    alarmService = new AlarmService(mockRepository, mockLogger);
  });

  it('should acknowledge an active alarm', async () => {
    const alarm = { id: 'alarm-123', acknowledged: false };
    mockRepository.findById.mockResolvedValue(alarm);

    const result = await alarmService.acknowledgeAlarm('alarm-123', 'user-456');

    expect(result.acknowledged).toBe(true);
    expect(mockRepository.update).toHaveBeenCalled();
  });
});
```

### Integration Testing

```typescript
describe('AlarmController Integration', () => {
  let app: INestApplication;
  let alarmService: AlarmService;

  beforeEach(async () => {
    const moduleFixture = await Test.createTestingModule({
      controllers: [AlarmController],
      providers: [AlarmService, AlarmRepository],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/api/v1/alarms/:id (PUT)', async () => {
    const response = await request(app.getHttpServer())
      .put('/api/v1/alarms/alarm-123')
      .send({ acknowledged: true })
      .expect(200);

    expect(response.body.success).toBe(true);
  });
});
```

---

## Migration Checklist

### Phase 1: Configuration
- [ ] Replace `tsconfig.json` with template version
- [ ] Update `package.json` scripts
- [ ] Add ESLint and Prettier configurations
- [ ] Install new dependencies: `npm install zod tsx vitest`

### Phase 2: Types
- [ ] Create `src/types/index.ts` with your domain types
- [ ] Replace all `any` types with proper interfaces
- [ ] Add validation schemas with Zod
- [ ] Create custom error classes

### Phase 3: Structure
- [ ] Move controllers to `src/controllers/`
- [ ] Extract business logic to `src/services/`
- [ ] Create data access layer in `src/repositories/`
- [ ] Move utilities to `src/utils/`

### Phase 4: Implementation
- [ ] Implement dependency injection container
- [ ] Replace console.log with structured logging
- [ ] Add proper error handling
- [ ] Write unit tests for business logic

### Phase 5: Validation
- [ ] Run `npm run validate` and fix all issues
- [ ] Ensure zero `any` types
- [ ] Add integration tests
- [ ] Document the new architecture

---

## Need Help?

This template provides a solid foundation for all your repositories. Each section above contains:
- **Specific file changes** with exact code snippets
- **Step-by-step instructions** for implementation
- **Before/after examples** showing the transformation
- **Common patterns** you can apply elsewhere

Start with the repository that matches your current project, then apply the common patterns to other parts of your codebase!
