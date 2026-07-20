import { Inject, Injectable } from '@nestjs/common';
import type Redis from 'ioredis';
import { REDIS_CLIENT } from '../../database/redis.module';

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
}

@Injectable()
export class RateLimiterService {
  constructor(@Inject(REDIS_CLIENT) private readonly redis: Redis) {}

  private static readonly INCR_AND_EXPIRE_SCRIPT = `
    local current = redis.call("INCR", KEYS[1])
    if tonumber(current) == 1 then
      redis.call("EXPIRE", KEYS[1], ARGV[1])
    end
    local ttl = redis.call("TTL", KEYS[1])
    return {current, ttl}
  `;

  async hit(key: string, limit: number, windowSeconds: number): Promise<RateLimitResult> {
    const [current, ttl] = (await this.redis.eval(
      RateLimiterService.INCR_AND_EXPIRE_SCRIPT,
      1,
      key,
      windowSeconds,
    )) as [number, number];

    return {
      allowed: current <= limit,
      remaining: Math.max(0, limit - current),
      retryAfterSeconds: ttl > 0 ? ttl : windowSeconds,
    };
  }

  async peek(key: string, limit: number): Promise<RateLimitResult> {
    const current = parseInt((await this.redis.get(key)) || '0', 10);
    const ttl = await this.redis.ttl(key);
    return {
      allowed: current < limit,
      remaining: Math.max(0, limit - current),
      retryAfterSeconds: ttl > 0 ? ttl : 0,
    };
  }

  async reset(key: string): Promise<void> {
    await this.redis.del(key);
  }
}
