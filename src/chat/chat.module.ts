import { Module } from '@nestjs/common';
import { PrismaModule } from '@lib/prisma';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { ChatRepository } from './chat.repository';
import { CustomConfigModule } from '@lib/custom-config';

@Module({
  imports: [PrismaModule, CustomConfigModule],
  controllers: [ChatController],
  providers: [ChatService, ChatRepository],
  exports: [ChatService],
})
export class ChatModule {}
