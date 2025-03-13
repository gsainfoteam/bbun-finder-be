import { Controller, Get, Logger } from '@nestjs/common';
import { CustomConfigService } from '@lib/custom-config';
import { PrismaService } from '@lib/prisma';
import {
  HealthCheck,
  HealthCheckService,
  HttpHealthIndicator,
  MemoryHealthIndicator,
  PrismaHealthIndicator,
} from '@nestjs/terminus';

import { ApiTags } from '@nestjs/swagger';

@ApiTags('health')
@Controller('health')
export class HealthController {
  private readonly logger = new Logger(HealthController.name);
  constructor(
    private readonly configService: CustomConfigService,
    private readonly prismaService: PrismaService,
    private readonly health: HealthCheckService,
    private readonly http: HttpHealthIndicator,
    private readonly prisma: PrismaHealthIndicator,
    private readonly memory: MemoryHealthIndicator,
  ) {}

  @Get()
  @HealthCheck()
  async check() {
    this.logger.log('Health check');
    return this.health.check([
      () =>
        this.http.pingCheck('infoteam-idp', this.configService.IDP_BASE_URL),
      () => this.prisma.pingCheck('database', this.prismaService),
      () => this.memory.checkRSS('memory_rss', 1024 * 1024 * 150),
    ]);
  }
}
