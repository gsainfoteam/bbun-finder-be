import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from './user/user.module';
import { ImageModule } from './image/image.module';
import { EmailModule } from './email/email.module';
import { HealthController } from './health/health.controller';
import { HealthModule } from './health/health.module';

@Module({
  imports: [UserModule, ImageModule, EmailModule, HealthModule],
  controllers: [AppController, HealthController],
  providers: [AppService],
})
export class AppModule {}
