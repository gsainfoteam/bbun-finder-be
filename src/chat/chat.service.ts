import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ChatMessageStatus } from '../../generated/prisma/enums';
import {
  ChatRepository,
  ChatRoomEntity,
  ChatUserForRoom,
} from './chat.repository';
import {
  ChatMessageResponseDto,
  ChatMessageWithSender,
} from './dto/chat-message-response.dto';

const EDIT_LIMIT_MS = 5 * 60 * 1000;
const MAX_MESSAGE_LENGTH = 1000;
const DEFAULT_MESSAGE_TAKE = 30;
const MAX_MESSAGE_TAKE = 50;

export type MyBbunRoomContext = {
  user: ChatUserForRoom;
  room: ChatRoomEntity;
  lineKey: string;
};

@Injectable()
export class ChatService {
  constructor(private readonly chatRepository: ChatRepository) {}

  async syncBbunRoomForUser(
    userUuid: string,
    studentNumber: string,
  ): Promise<{
    room: ChatRoomEntity;
    lineKey: string;
  }> {
    const lineKey = this.extractLineKey(studentNumber);

    const room = await this.chatRepository.findOrCreateRoomByLineKey(lineKey);

    await this.chatRepository.upsertRoomMember(room.uuid, userUuid);

    return {
      room,
      lineKey,
    };
  }

  async getOrCreateMyBbunRoom(userUuid: string): Promise<MyBbunRoomContext> {
    const user = await this.chatRepository.findUserByUuid(userUuid);

    if (!user || user.deletedAt) {
      throw new NotFoundException('User not found');
    }

    if (!user.consent) {
      throw new ForbiddenException('User consent is required');
    }

    const { room, lineKey } = await this.syncBbunRoomForUser(
      user.uuid,
      user.studentNumber,
    );

    return {
      user,
      room,
      lineKey,
    };
  }

  async saveChat(params: {
    userUuid: string;
    roomUuid: string;
    message: string;
  }): Promise<ChatMessageWithSender> {
    const content = this.normalizeMessage(params.message);

    return this.chatRepository.createMessage({
      roomUuid: params.roomUuid,
      senderUuid: params.userUuid,
      content,
    });
  }

  async editChat(params: {
    userUuid: string;
    messageUuid: string;
    message: string;
  }): Promise<ChatMessageWithSender> {
    const message = await this.chatRepository.findMessageByUuid(
      params.messageUuid,
    );

    if (!message) {
      throw new NotFoundException('Message not found');
    }

    if (message.senderUuid !== params.userUuid) {
      throw new ForbiddenException('Cannot edit other user message');
    }

    if (message.deletedAt) {
      throw new ForbiddenException('Cannot edit deleted message');
    }

    if (Date.now() - message.createdAt.getTime() > EDIT_LIMIT_MS) {
      throw new ForbiddenException('Edit time expired');
    }

    const content = this.normalizeMessage(params.message);

    return this.chatRepository.editMessage(params.messageUuid, content);
  }

  async deleteChat(params: {
    userUuid: string;
    messageUuid: string;
  }): Promise<ChatMessageWithSender> {
    const message = await this.chatRepository.findMessageByUuid(
      params.messageUuid,
    );

    if (!message) {
      throw new NotFoundException('Message not found');
    }

    if (message.senderUuid !== params.userUuid) {
      throw new ForbiddenException('Cannot delete other user message');
    }

    return this.chatRepository.softDeleteMessage(params.messageUuid);
  }

  async getRecentMessages(params: {
    userUuid: string;
    take?: number;
    cursor?: string;
  }): Promise<ChatMessageResponseDto[]> {
    const { room } = await this.getOrCreateMyBbunRoom(params.userUuid);

    const take = this.normalizeTake(params.take);

    const messages = await this.chatRepository.getRecentMessages({
      roomUuid: room.uuid,
      userUuid: params.userUuid,
      take,
      cursor: params.cursor,
    });

    return messages.map((message) => this.toMessageResponse(message)).reverse();
  }

  async blockUser(params: {
    blockerUserUuid: string;
    blockedUserUuid: string;
  }): Promise<void> {
    if (params.blockerUserUuid === params.blockedUserUuid) {
      throw new ForbiddenException('Cannot block yourself');
    }

    await this.chatRepository.blockUser(
      params.blockerUserUuid,
      params.blockedUserUuid,
    );
  }

  async unblockUser(params: {
    blockerUserUuid: string;
    blockedUserUuid: string;
  }): Promise<{ count: number }> {
    return this.chatRepository.unblockUser(
      params.blockerUserUuid,
      params.blockedUserUuid,
    );
  }

  async leaveAllRoomsForUser(userUuid: string): Promise<{ count: number }> {
    return this.chatRepository.leaveAllRoomsByUserUuid(userUuid);
  }

  async getReceiverUuidsBlockingSender(
    senderUserUuid: string,
  ): Promise<string[]> {
    return this.chatRepository.findReceiverUuidsBlockingSender(senderUserUuid);
  }

  toMessageResponse(message: ChatMessageWithSender): ChatMessageResponseDto {
    const isDeleted = message.status === ChatMessageStatus.DELETED;

    return {
      messageUuid: message.uuid,
      roomUuid: message.roomUuid,
      senderUuid: message.senderUuid,
      senderName: message.sender.name,
      profileImageUrl: message.sender.profileImageUrl,
      message: isDeleted ? '메시지가 삭제되었습니다.' : (message.content ?? ''),
      status: message.status,
      createdAt: message.createdAt,
      editedAt: message.editedAt,
      deletedAt: message.deletedAt,
    };
  }

  private normalizeMessage(message: string): string {
    const content = message.trim();

    if (!content) {
      throw new ForbiddenException('Message is empty');
    }

    if (content.length > MAX_MESSAGE_LENGTH) {
      throw new ForbiddenException('Message is too long');
    }
    return content;
  }

  private normalizeTake(take?: number): number {
    if (!take) return DEFAULT_MESSAGE_TAKE;
    return Math.min(Math.max(take, 1), MAX_MESSAGE_TAKE);
  }

  private extractLineKey(studentNumber: string) {
    if (studentNumber.length < 4) {
      throw new ForbiddenException('Invalid student number');
    }

    return studentNumber.slice(-4);
  }
}
