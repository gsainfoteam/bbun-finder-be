import { CustomConfigService } from '@lib/custom-config';
import { PrismaService } from '@lib/prisma';
import { Controller, Get, Logger } from '@nestjs/common';
import {
  HealthCheck,
  HealthCheckService,
  HttpHealthIndicator,
  PrismaHealthIndicator,
} from '@nestjs/terminus';
import { RedisIndicator } from './indicator/redis.indicator';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('health')
@Controller('health')
export class HealthController {
  private readonly logger = new Logger(HealthController.name);
  private readonly prismaHealthTimeoutMs = 5000;

  constructor(
    private readonly configService: CustomConfigService,
    private readonly prismaService: PrismaService,
    private readonly health: HealthCheckService,
    private readonly http: HttpHealthIndicator,
    private readonly prisma: PrismaHealthIndicator,
    private readonly redis: RedisIndicator,
  ) {}

  @Get()
  @HealthCheck()
  async check() {
    this.logger.log('Health check');
    return this.health.check([
      () =>
        this.http.pingCheck(
          'infoteam-account',
          this.configService.INFOTEAM_ACCOUNT_BASE_URL,
        ),
      () =>
        this.prisma.pingCheck('database', this.prismaService, {
          timeout: this.prismaHealthTimeoutMs,
        }),
      () => this.redis.isHealthy('redis'),
    ]);
  }
}
