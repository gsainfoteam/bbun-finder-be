import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { UserModule } from './user/user.module';
import { AuthModule } from './auth/auth.module';
import { CustomConfigModule } from '@lib/custom-config';

@Module({
  imports: [UserModule, AuthModule, CustomConfigModule],
  controllers: [AppController],
})
export class AppModule {}
