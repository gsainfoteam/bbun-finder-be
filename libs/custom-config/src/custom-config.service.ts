import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EnvironmentVariableKeys } from '@lib/custom-config/env.validation';

@Injectable()
export class CustomConfigService {
  constructor(private configService: ConfigService) {}

  private getEnvVariable<T>(key: EnvironmentVariableKeys) {
    return this.configService.getOrThrow<T>(key);
  }

  get INFOTEAM_ACCOUNT_BASE_URL(): string {
    return this.getEnvVariable<string>('INFOTEAM_ACCOUNT_BASE_URL');
  }

  get DATABASE_URL(): string {
    return this.getEnvVariable<string>('DATABASE_URL');
  }

  get SWAGGER_USER(): string {
    return this.getEnvVariable<string>('SWAGGER_USER');
  }

  get SWAGGER_PASSWORD(): string {
    return this.getEnvVariable<string>('SWAGGER_PASSWORD');
  }

  get SWAGGER_AUTH_URL(): string {
    return this.getEnvVariable<string>('SWAGGER_AUTH_URL');
  }

  get SWAGGER_TOKEN_URL(): string {
    return this.getEnvVariable<string>('SWAGGER_TOKEN_URL');
  }

  get API_URL(): string {
    return this.getEnvVariable<string>('API_URL');
  }

  get API_VERSION(): string {
    return this.getEnvVariable<string>('API_VERSION');
  }

  get CLIENT_ID(): string {
    return this.getEnvVariable<string>('CLIENT_ID');
  }

  get CLIENT_SECRET(): string {
    return this.getEnvVariable<string>('CLIENT_SECRET');
  }

  get EMAIL_USER(): string {
    return this.getEnvVariable<string>('EMAIL_USER');
  }

  get EMAIL_PORT(): string {
    return this.getEnvVariable<string>('EMAIL_PORT');
  }

  get EMAIL_HOST(): string {
    return this.getEnvVariable<string>('EMAIL_HOST');
  }

  get EMAIL_ACCESS_URL(): string {
    return this.getEnvVariable<string>('EMAIL_ACCESS_URL');
  }

  get EMAIL_SERVICE_CLIENT(): string {
    return this.getEnvVariable<string>('EMAIL_SERVICE_CLIENT');
  }

  get EMAIL_PRIVATE_KEY(): string {
    return this.getEnvVariable<string>('EMAIL_PRIVATE_KEY');
  }

  get JWT_SECRET(): string {
    return this.getEnvVariable<string>('JWT_SECRET');
  }

  get JWT_ISSUER(): string {
    return this.getEnvVariable<string>('JWT_ISSUER');
  }

  get JWT_AUDIENCE(): string {
    return this.getEnvVariable<string>('JWT_AUDIENCE');
  }

  get JWT_EXPIRE(): string {
    return this.getEnvVariable<string>('JWT_EXPIRE');
  }
  get REFRESH_TOKEN_EXPIRE(): string {
    return this.getEnvVariable<string>('REFRESH_TOKEN_EXPIRE');
  }
  get REDIS_URL(): string {
    return this.getEnvVariable<string>('REDIS_URL');
  }
}
