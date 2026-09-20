import { RedisService } from '@lib/redis';
import { Injectable } from '@nestjs/common';
import {
  HealthIndicatorResult,
  HealthIndicatorService,
} from '@nestjs/terminus';

@Injectable()
export class RedisIndicator {
  constructor(
    private readonly redisService: RedisService,
    private readonly healthIndicatorService: HealthIndicatorService,
  ) {}

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    const indicator = this.healthIndicatorService.check(key);
    const ping = await this.redisService.ping().catch(() => {
      indicator.down('Redis check failed');
    });
    if (ping === 'PONG') {
      return indicator.up();
    }
    return indicator.down('Redis check failed');
  }
}
