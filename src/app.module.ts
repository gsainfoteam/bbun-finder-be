import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from './user/user.module';
import { ImageModule } from './image/image.module';
import { EmailModule } from './email/email.module';

@Module({
  imports: [UserModule, ImageModule, EmailModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
