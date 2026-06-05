import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { ChatModule } from './chat/chat.module';
import { CustomConfigModule } from '@lib/custom-config';
import { BbunModule } from './bbun/bbun.module';
import { WebsocketModule } from './websocket/websocket.module';

@Module({
  imports: [
    UserModule,
    AuthModule,
    CustomConfigModule,
    BbunModule,
    WebsocketModule,
    ChatModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
