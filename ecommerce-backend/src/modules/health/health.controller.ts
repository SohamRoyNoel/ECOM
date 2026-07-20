import { Controller, Get, Inject, ServiceUnavailableException } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import type Redis from 'ioredis';
import { Public } from '../../common/decorators/public.decorator';
import { REDIS_CLIENT } from '../../database/redis.module';

@Controller('health')
export class HealthController {
  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
  ) {}

  @Public()
  @Get()
  async check() {
    const [dbOk, redisOk] = await Promise.all([this.checkDb(), this.checkRedis()]);

    const status = dbOk && redisOk ? 'ok' : 'degraded';
    const body = {
      status,
      timestamp: new Date().toISOString(),
      dependencies: {
        postgres: dbOk ? 'up' : 'down',
        redis: redisOk ? 'up' : 'down',
      },
    };

    if (status !== 'ok') {
      throw new ServiceUnavailableException(body);
    }
    return body;
  }

  private async checkDb(): Promise<boolean> {
    try {
      await this.dataSource.query('SELECT 1');
      return true;
    } catch {
      return false;
    }
  }

  private async checkRedis(): Promise<boolean> {
    try {
      const pong = await this.redis.ping();
      return pong === 'PONG';
    } catch {
      return false;
    }
  }
}
