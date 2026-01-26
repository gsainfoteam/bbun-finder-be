import { plainToInstance } from 'class-transformer';
import { IsNotEmpty, IsString, validateSync } from 'class-validator';

export class EnvironmentVariables {
  @IsString()
  @IsNotEmpty()
  IDP_URL: string;

  @IsString()
  @IsNotEmpty()
  IDP_BASE_URL: string;

  @IsString()
  @IsNotEmpty()
  DATABASE_URL: string;

  @IsString()
  @IsNotEmpty()
  SWAGGER_USER: string;

  @IsString()
  @IsNotEmpty()
  SWAGGER_PASSWORD: string;

  @IsString()
  @IsNotEmpty()
  SWAGGER_AUTH_URL: string;

  @IsString()
  @IsNotEmpty()
  SWAGGER_TOKEN_URL: string;

  @IsString()
  @IsNotEmpty()
  CLIENT_ID: string;

  @IsString()
  @IsNotEmpty()
  CLIENT_SECRET: string;

  @IsString()
  @IsNotEmpty()
  API_URL: string;

  @IsString()
  @IsNotEmpty()
  API_VERSION: string;

  @IsString()
  @IsNotEmpty()
  LOCAL_REDIRECT_URI: string;

  @IsString()
  @IsNotEmpty()
  WEB_REDIRECT_URI: string;

  @IsString()
  @IsNotEmpty()
  EMAIL_USER: string;

  @IsString()
  @IsNotEmpty()
  EMAIL_PORT: string;

  @IsString()
  @IsNotEmpty()
  EMAIL_HOST: string;

  @IsString()
  @IsNotEmpty()
  EMAIL_ACCESS_URL: string;

  @IsString()
  @IsNotEmpty()
  EMAIL_SERVICE_CLIENT: string;

  @IsString()
  @IsNotEmpty()
  EMAIL_PRIVATE_KEY: string;

  @IsString()
  @IsNotEmpty()
  JWT_SECRET: string;

  @IsString()
  @IsNotEmpty()
  JWT_ISSUER: string;

  @IsString()
  @IsNotEmpty()
  JWT_AUDIENCE: string;

  @IsString()
  @IsNotEmpty()
  JWT_EXPIRE: string;

  @IsString()
  @IsNotEmpty()
  REFRESH_TOKEN_EXPIRE: string;

  @IsString()
  @IsNotEmpty()
  REDIS_URL: string;
}

export type EnvironmentVariableKeys = keyof EnvironmentVariables;

export function validate(config: Record<string, unknown>) {
  const validatedConfiguration = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });

  const errors = validateSync(validatedConfiguration, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    throw new Error(errors.toString());
  }

  return validatedConfiguration;
}
