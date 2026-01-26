import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EnvironmentVariableKeys } from '@lib/custom-config/env.validation';

@Injectable()
export class CustomConfigService {
  constructor(private configService: ConfigService) {}

  private getEnvVariable(key: EnvironmentVariableKeys) {
    return this.configService.getOrThrow(key);
  }

  get IDP_URL(): string {
    return this.getEnvVariable('IDP_URL');
  }

  get IDP_BASE_URL(): string {
    return this.getEnvVariable('IDP_BASE_URL');
  }

  get DATABASE_URL(): string {
    return this.getEnvVariable('DATABASE_URL');
  }

  get SWAGGER_USER(): string {
    return this.getEnvVariable('SWAGGER_USER');
  }

  get SWAGGER_PASSWORD(): string {
    return this.getEnvVariable('SWAGGER_PASSWORD');
  }

  get SWAGGER_AUTH_URL(): string {
    return this.getEnvVariable('SWAGGER_AUTH_URL');
  }

  get SWAGGER_TOKEN_URL(): string {
    return this.getEnvVariable('SWAGGER_TOKEN_URL');
  }

  get API_URL(): string {
    return this.getEnvVariable('API_URL');
  }

  get API_VERSION(): string {
    return this.getEnvVariable('API_VERSION');
  }

  get CLIENT_ID(): string {
    return this.getEnvVariable('CLIENT_ID');
  }

  get CLIENT_SECRET(): string {
    return this.getEnvVariable('CLIENT_SECRET');
  }

  get LOCAL_REDIRECT_URI(): string {
    return this.getEnvVariable('LOCAL_REDIRECT_URI');
  }

  get WEB_REDIRECT_URI(): string {
    return this.getEnvVariable('WEB_REDIRECT_URI');
  }

  get EMAIL_USER(): string {
    return this.getEnvVariable('EMAIL_USER');
  }

  get EMAIL_PORT(): string {
    return this.getEnvVariable('EMAIL_PORT');
  }

  get EMAIL_HOST(): string {
    return this.getEnvVariable('EMAIL_HOST');
  }

  get EMAIL_ACCESS_URL(): string {
    return this.getEnvVariable('EMAIL_ACCESS_URL');
  }

  get EMAIL_SERVICE_CLIENT(): string {
    return this.getEnvVariable('EMAIL_SERVICE_CLIENT');
  }

  get EMAIL_PRIVATE_KEY(): string {
    return this.getEnvVariable('EMAIL_PRIVATE_KEY');
  }

  get JWT_SECRET(): string {
    return this.getEnvVariable('JWT_SECRET');
  }

  get JWT_ISSUER(): string {
    return this.getEnvVariable('JWT_ISSUER');
  }

  get JWT_AUDIENCE(): string {
    return this.getEnvVariable('JWT_AUDIENCE');
  }

  get JWT_EXPIRE(): string {
    return this.getEnvVariable('JWT_EXPIRE');
  }
  get REFRESH_TOKEN_EXPIRE(): string {
    return this.getEnvVariable('REFRESH_TOKEN_EXPIRE');
  }
  get REDIS_URL(): string {
    return this.getEnvVariable('REDIS_URL');
  }
}
