import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { ConfigModule } from '@nestjs/config';
import { PrismaMetricsService } from '@gsainfoteam/nest-observability';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [PrismaService, PrismaMetricsService],
  exports: [PrismaService],
})
export class PrismaModule {}
