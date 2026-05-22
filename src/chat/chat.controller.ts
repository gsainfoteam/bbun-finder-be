import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Prisma } from '../../generated/prisma/client';
import { JwtGuard } from '../auth/guards/jwt.guard';
import { GetUser } from '../auth/decorators/getUser.decorator';
import { ChatService } from './chat.service';

@ApiTags('chat')
@Controller('chat')
@UsePipes(ValidationPipe)
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @ApiBearerAuth('jwt')
  @Get('messages')
  @UseGuards(JwtGuard)
  async getMessages(
    @GetUser() user: Prisma.UserModel,
    @Query('cursor') cursor?: string,
    @Query('take') take?: string,
  ) {
    return this.chatService.getRecentMessages({
      userUuid: user.uuid,
      cursor,
      take: take ? Number(take) : 30,
    });
  }

  @ApiBearerAuth('jwt')
  @Post('block')
  @UseGuards(JwtGuard)
  async blockUser(
    @GetUser() user: Prisma.UserModel,
    @Body() body: { targetUserUuid: string },
  ) {
    return this.chatService.blockUser({
      blockerUserUuid: user.uuid,
      blockedUserUuid: body.targetUserUuid,
    });
  }

  @ApiBearerAuth('jwt')
  @Post('unblock')
  @UseGuards(JwtGuard)
  async unblockUser(
    @GetUser() user: Prisma.UserModel,
    @Body() body: { targetUserUuid: string },
  ) {
    return this.chatService.unblockUser({
      blockerUserUuid: user.uuid,
      blockedUserUuid: body.targetUserUuid,
    });
  }
}
