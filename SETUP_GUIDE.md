# Quick Setup Guide

## Getting Started

1. **Navigate to the template directory:**
   ```bash
   cd /Users/aamer/yunex/typescript-best-practices-template
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Run the development server:**
   ```bash
   npm run dev
   ```

4. **Try other commands:**
   ```bash
   npm run build      # Build for production
   npm run test       # Run tests
   npm run lint       # Check code quality
   npm run validate   # Full validation (types + lint + format)
   ```

## Project Structure Overview

```
src/
├── types/           # All TypeScript type definitions (DRY)
├── utils/           # Pure utility functions (KISS)
├── repositories/    # Data access layer (Interface Segregation)
├── services/        # Business logic (Single Responsibility)
├── controllers/     # HTTP request handlers (Single Responsibility)
├── config/          # Application configuration
├── tests/           # Unit tests
└── main.ts          # Application entry point
```

## Key Features Demonstrated

### Strict TypeScript Configuration
- No `any` types allowed
- Strict null checks
- Explicit return types required
- Path mapping for clean imports (`@/types`, `@/utils`)

### SOLID Principles Implementation

**Single Responsibility:**
- Controllers only handle HTTP requests
- Services only contain business logic
- Repositories only handle data access

**Dependency Inversion:**
- All dependencies are injected via constructor
- Classes depend on interfaces, not concrete implementations

**Interface Segregation:**
- Small, focused interfaces (`ILogger`, `IRepository<T>`)
- No large, monolithic interfaces

### Clean Architecture
```
Controllers → Services → Repositories
     ↓           ↓           ↓
HTTP Only   Business     Data Access
            Logic        Only
```

### Type Safety
- Comprehensive type definitions
- Runtime validation with Zod
- Custom error types with proper inheritance

### Code Quality
- ESLint with strict TypeScript rules
- Prettier for consistent formatting
- Vitest for testing
- Maximum function complexity: 10
- Maximum lines per function: 50

## How to Adapt for Your Projects

### 1. For Device Management (like your DM backend):

   **Replace the Device types with your domain:**
   ```typescript
   // In src/types/index.ts
   export interface Alarm {
     readonly id: string;
     readonly severity: AlarmSeverity;
     readonly status: AlarmStatus;
     readonly timestamp: Date;
   }

   export type AlarmSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
   export type AlarmStatus = 'ACTIVE' | 'ACKNOWLEDGED' | 'CLEARED';
   ```

   **Create AlarmService:**
   ```typescript
   // In src/services/alarm.service.ts
   export class AlarmService implements IAlarmService {
     constructor(
       private readonly repository: IRepository<Alarm>,
       private readonly logger: ILogger
     ) {}

     async acknowledgeAlarm(id: string): Promise<Alarm> {
       // Business logic only
     }
   }
   ```

### 2. For PMCS Devices:

   **Replace with device logic types:**
   ```typescript
   export interface PmcsDevice {
     readonly dpName: string;
     readonly className: string;
     readonly status: DeviceStatus;
     readonly bitMappings: Map<number, string>;
   }

   export interface IDeviceLogic {
     run(): Promise<void>;
     createStatusCallback(dpe: string, mapping: Map<number, string>): void;
   }
   ```

### 3. For Backend APIs:

   **Add Express.js or Fastify integration:**
   ```typescript
   // In src/controllers/http.controller.ts
   import express from 'express';

   export class HttpController {
     constructor(private readonly deviceController: DeviceController) {}

     setupRoutes(): express.Router {
       const router = express.Router();

       router.get('/devices/:id', async (req, res) => {
         const result = await this.deviceController.getDevice({ id: req.params.id });
         res.status(result.success ? 200 : 500).json(result);
       });

       return router;
     }
   }
   ```

## Best Practices Checklist

When adapting this template, ensure you:

- [ ] **No `any` types** - Use proper TypeScript types everywhere
- [ ] **Explicit return types** - Every public method should have a return type
- [ ] **Single responsibility** - Each class should do one thing well
- [ ] **Dependency injection** - Inject dependencies, don't create them
- [ ] **Interface segregation** - Keep interfaces small and focused
- [ ] **Error handling** - Use structured error types, not generic errors
- [ ] **Validation** - Validate all inputs with Zod schemas
- [ ] **Testing** - Write tests for business logic
- [ ] **Logging** - Use structured logging, not console.log

## Testing Strategy

```typescript
// Example test pattern
describe('DeviceService', () => {
  let service: DeviceService;
  let mockRepository: IRepository<Device>;
  let mockLogger: ILogger;

  beforeEach(() => {
    mockRepository = createMockRepository();
    mockLogger = createMockLogger();
    service = new DeviceService(mockRepository, mockLogger);
  });

  it('should handle business logic correctly', async () => {
    // Arrange - Set up test data
    // Act - Call the method
    // Assert - Check results
  });
});
```

## Next Steps

1. **Copy this template** to create your new project
2. **Adapt the types** to match your domain (devices, alarms, etc.)
3. **Implement your business logic** in services
4. **Add your data access** in repositories
5. **Create HTTP endpoints** in controllers
6. **Write tests** for your business logic
7. **Run validation** regularly with `npm run validate`

## Pro Tips

- **Start small**: Don't try to migrate everything at once
- **Use the template patterns**: Copy the structure, not just the code
- **Validate frequently**: Run `npm run validate` after each change
- **Test-driven development**: Write tests for new business logic
- **Incremental refactoring**: Improve one file at a time

Remember: **Perfect is the enemy of good. Start simple, refactor iteratively!**
