import type { AppConfig, LogLevel } from '@/types';

// Configuration management (KISS principle)
export class ConfigService {
  static load(): AppConfig {
    return {
      port: this.getPort(),
      logLevel: this.getLogLevel(),
      database: {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432', 10),
        database: process.env.DB_NAME || 'app_db',
        username: process.env.DB_USER || 'user',
        password: process.env.DB_PASS || 'password',
      },
    };
  }

  private static getPort(): number {
    const port = parseInt(process.env.PORT || '3000', 10);
    if (isNaN(port) || port < 1 || port > 65535) {
      throw new Error('Invalid PORT configuration');
    }
    return port;
  }

  private static getLogLevel(): LogLevel {
    const level = process.env.LOG_LEVEL || 'info';
    const validLevels: LogLevel[] = ['debug', 'info', 'warn', 'error'];

    if (!validLevels.includes(level as LogLevel)) {
      throw new Error(`Invalid LOG_LEVEL: ${level}. Must be one of: ${validLevels.join(', ')}`);
    }

    return level as LogLevel;
  }
}
