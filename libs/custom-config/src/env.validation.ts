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
  LOCAL_REDIRECT_URI: string;

  @IsString()
  @IsNotEmpty()
  WEB_REDIRECT_URI: string;
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
