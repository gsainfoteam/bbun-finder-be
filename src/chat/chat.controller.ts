import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
  Post,
  Query,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
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
@ApiBearerAuth('jwt')
@Controller('chat')
@UseGuards(JwtGuard)
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get('messages')
  @ApiOperation({
    summary: '최근 채팅 메시지 조회',
    description:
      '현재 사용자가 열람 가능한 최근 채팅 메시지를 cursor 기반으로 조회합니다.',
  })
  @ApiQuery({
    name: 'cursor',
    required: false,
    type: String,
    description: '다음 페이지 조회를 위한 메시지 cursor',
  })
  @ApiQuery({
    name: 'take',
    required: false,
    type: Number,
    description: '조회할 메시지 개수. 1 이상 100 이하만 허용됩니다.',
    example: 30,
  })
  @ApiOkResponse({
    description: '채팅 메시지 조회 성공',
    type: ChatMessageResponseDto,
    isArray: true,
  })
  @ApiBadRequestResponse({
    description: 'take 값이 허용 범위를 벗어나거나 잘못된 형식인 경우',
  })
  @ApiUnauthorizedResponse({
    description: 'JWT 인증 실패',
  })
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

  @Get('messages/search')
  @ApiOperation({
    summary: '채팅 메시지 검색',
    description:
      '키워드를 기준으로 현재 사용자가 열람 가능한 채팅 메시지를 검색합니다.',
  })
  @ApiOkResponse({
    description: '채팅 메시지 검색 성공',
    type: ChatMessageResponseDto,
    isArray: true,
  })
  @ApiBadRequestResponse({
    description: '검색 Query 형식이 올바르지 않은 경우',
  })
  @ApiUnauthorizedResponse({
    description: 'JWT 인증 실패',
  })
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

  @Post('block')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: '사용자 차단',
    description: '현재 사용자가 특정 사용자를 채팅에서 차단합니다.',
  })
  @ApiNoContentResponse({
    description: '사용자 차단 성공',
  })
  @ApiBadRequestResponse({
    description: '대상 사용자 UUID가 올바르지 않거나 차단할 수 없는 경우',
  })
  @ApiUnauthorizedResponse({
    description: 'JWT 인증 실패',
  })
  async blockUser(
    @GetUser() user: Prisma.UserModel,
    @Body() body: WsBlockUserReqDto,
  ): Promise<void> {
    return this.chatService.blockUser({
      blockerUserUuid: user.uuid,
      blockedUserUuid: body.targetUserUuid,
    });
  }

  @Post('unblock')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '사용자 차단 해제',
    description: '현재 사용자가 차단한 사용자를 차단 목록에서 제거합니다.',
  })
  @ApiOkResponse({
    description: '사용자 차단 해제 성공',
    schema: {
      type: 'object',
      properties: {
        count: {
          type: 'number',
          description: '삭제된 차단 관계 개수',
          example: 1,
        },
      },
    },
  })
  @ApiBadRequestResponse({
    description: '대상 사용자 UUID가 올바르지 않은 경우',
  })
  @ApiUnauthorizedResponse({
    description: 'JWT 인증 실패',
  })
  async unblockUser(
    @GetUser() user: Prisma.UserModel,
    @Body() body: WsBlockUserReqDto,
  ): Promise<{ count: number }> {
    return this.chatService.unblockUser({
      blockerUserUuid: user.uuid,
      blockedUserUuid: body.targetUserUuid,
    });
  }

  @Get('info')
  @ApiOperation({
    summary: '채팅방 정보 조회',
    description: '현재 사용자의 채팅방 정보를 조회합니다.',
  })
  @ApiOkResponse({
    description: '채팅방 정보 조회 성공',
    type: ChatRoomInfoDto,
  })
  @ApiUnauthorizedResponse({
    description: 'JWT 인증 실패',
  })
  async getChatRoomInfo(
    @GetUser() user: Prisma.UserModel,
  ): Promise<ChatRoomInfoDto> {
    return this.chatService.getMyChatRoomInfo(user.uuid);
  }
}
