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

  get CLIENT_ID(): string {
    return this.getEnvVariable('CLIENT_ID');
  }

  get CLIENT_SECRET(): string {
    return this.getEnvVariable('CLIENT_SECRET');
  }

  get FLUTTER_REDIRECT_URI(): string {
    return this.getEnvVariable('FLUTTER_REDIRECT_URI');
  }

  get LOCAL_REDIRECT_URI(): string {
    return this.getEnvVariable('LOCAL_REDIRECT_URI');
  }

  get WEB_REDIRECT_URI(): string {
    return this.getEnvVariable('WEB_REDIRECT_URI');
  }
}
