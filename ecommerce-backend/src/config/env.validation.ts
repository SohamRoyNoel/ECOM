import { plainToInstance } from 'class-transformer';
import { IsBooleanString, IsIn, IsNotEmpty, IsNumberString, IsOptional, validateSync } from 'class-validator';

class EnvironmentVariables {
  @IsOptional()
  @IsIn(['development', 'production', 'test'])
  NODE_ENV?: string;

  @IsOptional()
  @IsNumberString()
  PORT?: string;

  @IsNotEmpty()
  DB_HOST!: string;

  @IsNotEmpty()
  DB_USERNAME!: string;

  @IsNotEmpty()
  DB_PASSWORD!: string;

  @IsNotEmpty()
  DB_DATABASE!: string;

  @IsOptional()
  @IsBooleanString()
  DB_SYNCHRONIZE?: string;

  @IsNotEmpty()
  REDIS_HOST!: string;

  @IsNotEmpty()
  JWT_SECRET!: string;
}

export function validate(config: Record<string, unknown>) {
  const validatedConfig = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });
  const errors = validateSync(validatedConfig, { skipMissingProperties: false });

  if (errors.length > 0) {
    throw new Error(
      `Config validation error(s):\n${errors
        .map((e) => Object.values(e.constraints || {}).join(', '))
        .join('\n')}`,
    );
  }

  if ((validatedConfig.JWT_SECRET || '').length < 32) {
    throw new Error('JWT_SECRET must be at least 32 characters long.');
  }

  return validatedConfig;
}
