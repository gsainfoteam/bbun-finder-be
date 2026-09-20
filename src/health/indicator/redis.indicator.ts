import { InjectRedis } from '@nestjs-modules/ioredis';
import { Injectable } from '@nestjs/common';
import {
  HealthIndicatorResult,
  HealthIndicatorService,
} from '@nestjs/terminus';
import { Redis } from 'ioredis';

@Injectable()
export class RedisIndicator {
  constructor(
    @InjectRedis() private readonly redis: Redis,
    private readonly healthIndicatorService: HealthIndicatorService,
  ) {}

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    const indicator = this.healthIndicatorService.check(key);
    const ping = await this.redis.ping().catch(() => {
      indicator.down('Redis check failed');
    });
    if (ping === 'PONG') {
      return indicator.up();
    }
    return indicator.down('Redis check failed');
  }
}
