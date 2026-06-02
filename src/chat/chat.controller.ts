import {
  BadRequestException,
  Body,
  Controller,
  Get,
  ParseIntPipe,
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
import { WsBlockUserReqDto } from './dto/ws-block-user.dto';
import {
  ChatMessageResponseDto,
  ChatRoomInfoDto,
} from './dto/chat-message-response.dto';
import { SearchChatMessagesQueryDto } from './dto/search-chat-messages-query.dto';

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
    @Query('take', new ParseIntPipe({ optional: true })) take?: number,
  ): Promise<ChatMessageResponseDto[]> {
    const normalizedTake = take ?? 30;

    if (normalizedTake < 1 || normalizedTake > 100) {
      throw new BadRequestException('take must be between 1 and 100');
    }

    return this.chatService.getRecentMessages({
      userUuid: user.uuid,
      cursor,
      take: normalizedTake,
    });
  }

  @ApiBearerAuth('jwt')
  @Get('messages/search')
  @UseGuards(JwtGuard)
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async searchMessages(
    @GetUser() user: Prisma.UserModel,
    @Query() query: SearchChatMessagesQueryDto,
  ): Promise<ChatMessageResponseDto[]> {
    return this.chatService.searchMessages({
      userUuid: user.uuid,
      keyword: query.keyword,
      cursor: query.cursor,
      take: query.take,
    });
  }

  @ApiBearerAuth('jwt')
  @Post('block')
  @UseGuards(JwtGuard)
  async blockUser(
    @GetUser() user: Prisma.UserModel,
    @Body() body: WsBlockUserReqDto,
  ): Promise<void> {
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
    @Body() body: WsBlockUserReqDto,
  ): Promise<{ count: number }> {
    return this.chatService.unblockUser({
      blockerUserUuid: user.uuid,
      blockedUserUuid: body.targetUserUuid,
    });
  }

  @ApiBearerAuth('jwt')
  @Get('info')
  @UseGuards(JwtGuard)
  async getChatRoomInfo(
    @GetUser() user: Prisma.UserModel,
  ): Promise<ChatRoomInfoDto> {
    return this.chatService.getMyChatRoomInfo(user.uuid);
  }
}
