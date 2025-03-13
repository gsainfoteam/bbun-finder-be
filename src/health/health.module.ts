import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { HealthController } from './health.controller';
import { PrismaModule } from '@lib/prisma';
import { CustomConfigModule } from '@lib/custom-config';

@Module({
  imports: [
    TerminusModule.forRoot({
      errorLogStyle: 'pretty',
      logger: true,
    }),
    CustomConfigModule,
    PrismaModule,
  ],
  providers: [],
  controllers: [HealthController],
})
export class HealthModule {}
