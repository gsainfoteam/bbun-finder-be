import { PrismaMetricsService } from '@gsainfoteam/nest-observability';
import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../../../generated/prisma/client';
import { PrismaClientOptions } from '@prisma/client/runtime/client';

const createPrismaOption = (connectionString: string) =>
  ({
    log: [{ emit: 'event', level: 'query' }] as const,
    adapter: new PrismaPg({ connectionString }),
  }) satisfies PrismaClientOptions;

/**
 * Service for using Prisma.
 */
@Injectable()
export class PrismaService
  extends PrismaClient<ReturnType<typeof createPrismaOption>>
  implements OnModuleInit, OnModuleDestroy
{
  constructor(
    readonly configService: ConfigService,
    private readonly prismaMetricsService: PrismaMetricsService,
  ) {
    super(createPrismaOption(configService.getOrThrow<string>('DATABASE_URL')));
    this.$on('query', this.prismaMetricsService.getMetricsMiddleware());
  }

  /**
   * This method is called when the application is on the bootstrap phase.
   * And it's the right place to connect to the database.
   */
  async onModuleInit() {
    await this.$connect();
  }

  /**
   * This method is called when the application is shutting down.
   * And it's the right place to close the database connection.
   */
  async onModuleDestroy() {
    await this.$disconnect();
  }
}
