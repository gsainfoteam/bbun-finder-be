import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ChatRepository } from './chat.repository';

const EDIT_LIMIT_MS = 5 * 60 * 1000;
const MAX_MESSAGE_LENGTH = 1000;

@Injectable()
export class ChatService {
  constructor(private readonly chatRepository: ChatRepository) {}

  async syncBbunRoomForUser(userUuid: string, studentNumber: string) {
    const lineKey = this.extractLineKey(studentNumber);

    const room = await this.chatRepository.findOrCreateRoomByLineKey(lineKey);

    await this.chatRepository.upsertRoomMember(room.uuid, userUuid);

    return {
      room,
      lineKey,
    };
  }

  async getOrCreateMyBbunRoom(userUuid: string) {
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
  }) {
    const content = params.message.trim();

    if (!content) {
      throw new ForbiddenException('Message is empty');
    }

    if (content.length > MAX_MESSAGE_LENGTH) {
      throw new ForbiddenException('Message is too long');
    }

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
  }) {
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

    const content = params.message.trim();

    if (!content) {
      throw new ForbiddenException('Message is empty');
    }

    if (content.length > MAX_MESSAGE_LENGTH) {
      throw new ForbiddenException('Message is too long');
    }

    return this.chatRepository.editMessage(params.messageUuid, content);
  }

  async deleteChat(params: { userUuid: string; messageUuid: string }) {
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
  }) {
    const { room } = await this.getOrCreateMyBbunRoom(params.userUuid);

    const messages = await this.chatRepository.getRecentMessages({
      roomUuid: room.uuid,
      userUuid: params.userUuid,
      take: params.take ?? 30,
      cursor: params.cursor,
    });

    return messages.map((message) => this.toMessageResponse(message)).reverse();
  }

  async blockUser(params: {
    blockerUserUuid: string;
    blockedUserUuid: string;
  }) {
    if (params.blockerUserUuid === params.blockedUserUuid) {
      throw new ForbiddenException('Cannot block yourself');
    }

    return this.chatRepository.blockUser(
      params.blockerUserUuid,
      params.blockedUserUuid,
    );
  }

  async unblockUser(params: {
    blockerUserUuid: string;
    blockedUserUuid: string;
  }) {
    return this.chatRepository.unblockUser(
      params.blockerUserUuid,
      params.blockedUserUuid,
    );
  }

  async leaveAllRoomsForUser(userUuid: string) {
    return this.chatRepository.leaveAllRoomsByUserUuid(userUuid);
  }

  async getReceiverUuidsBlockingSender(senderUserUuid: string) {
    return this.chatRepository.findReceiverUuidsBlockingSender(senderUserUuid);
  }

  toMessageResponse(message: any) {
    const isDeleted = message.status === 'DELETED';

    return {
      messageUuid: message.uuid,
      roomUuid: message.roomUuid,
      senderUuid: message.senderUuid,
      senderName: message.sender?.name ?? null,
      profileImageUrl: message.sender?.profileImageUrl ?? null,
      message: isDeleted ? '메시지가 삭제되었습니다.' : message.content,
      status: message.status,
      createdAt: message.createdAt,
      editedAt: message.editedAt,
      deletedAt: message.deletedAt,
    };
  }

  private extractLineKey(studentNumber: string) {
    if (studentNumber.length < 4) {
      throw new ForbiddenException('Invalid student number');
    }

    return studentNumber.slice(-4);
  }
}
