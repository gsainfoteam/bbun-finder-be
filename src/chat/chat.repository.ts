import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '@lib/prisma';
import { Prisma } from '../../generated/prisma/client';
import { ChatMessageStatus } from '../../generated/prisma/enums';
import { Loggable } from '@lib/logger';
import { ChatMessageWithSender } from './dto/chat-message-response.dto';

export type ChatUserForRoom = {
  uuid: string;
  name: string;
  studentNumber: string;
  profileImageUrl: string | null;
  consent: boolean;
  deletedAt: Date | null;
};

export type ChatRoomEntity = {
  uuid: string;
  lineKey: string;
  createdAt: Date;
  updatedAt: Date;
};

export type ChatRoomMemberEntity = {
  uuid: string;
  roomUuid: string;
  userUuid: string;
  joinedAt: Date;
  leftAt: Date | null;
};

type PrismaErrorOption = {
  notFoundMessage?: string;
  conflictMessage?: string;
  foreignKeyMessage?: string;
};
@Injectable()
@Loggable()
export class ChatRepository {
  private readonly logger = new Logger(ChatRepository.name);
  constructor(private readonly prismaService: PrismaService) {}

  async findUserByUuid(userUuid: string): Promise<ChatUserForRoom | null> {
    return this.prismaService.user
      .findUnique({
        where: {
          uuid: userUuid,
          deletedAt: null,
        },
        select: {
          uuid: true,
          name: true,
          studentNumber: true,
          profileImageUrl: true,
          consent: true,
          deletedAt: true,
        },
      })
      .catch((err: unknown) => this.handlePrismaError('findUserByUuid', err));
  }

  async findOrCreateRoomByLineKey(lineKey: string): Promise<ChatRoomEntity> {
    return this.prismaService.chatRoom
      .upsert({
        where: {
          lineKey,
        },
        update: {},
        create: {
          lineKey,
        },
      })
      .catch((err: unknown) =>
        this.handlePrismaError('findOrCreateRoomByLineKey', err, {
          conflictMessage: `Chat room with lineKey ${lineKey} already exists`,
        }),
      );
  }

  async upsertRoomMember(
    roomUuid: string,
    userUuid: string,
  ): Promise<ChatRoomMemberEntity> {
    return this.prismaService.chatRoomMember
      .upsert({
        where: {
          roomUuid_userUuid: {
            roomUuid,
            userUuid,
          },
        },
        update: {
          leftAt: null,
        },
        create: {
          roomUuid,
          userUuid,
        },
      })
      .catch((err: unknown) =>
        this.handlePrismaError('upsertRoomMember', err, {
          foreignKeyMessage: 'Chat room or user does not exist',
        }),
      );
  }

  async leaveAllRoomsByUserUuid(userUuid: string): Promise<{ count: number }> {
    return this.prismaService.chatRoomMember
      .updateMany({
        where: {
          userUuid,
          leftAt: null,
        },
        data: {
          leftAt: new Date(),
        },
      })
      .catch((err: unknown) =>
        this.handlePrismaError('leaveAllRoomsByUserUuid', err),
      );
  }

  async createMessage(params: {
    roomUuid: string;
    senderUuid: string;
    content: string;
  }): Promise<ChatMessageWithSender> {
    return this.prismaService.chatMessage
      .create({
        data: {
          roomUuid: params.roomUuid,
          senderUuid: params.senderUuid,
          content: params.content,
        },
        include: {
          sender: {
            select: {
              uuid: true,
              name: true,
              profileImageUrl: true,
            },
          },
        },
      })
      .catch((err: unknown) =>
        this.handlePrismaError('createMessage', err, {
          foreignKeyMessage: 'Chat room or sender does not exist',
        }),
      );
  }

  async findMessageByUuid(
    messageUuid: string,
  ): Promise<ChatMessageWithSender | null> {
    return this.prismaService.chatMessage
      .findUnique({
        where: {
          uuid: messageUuid,
        },
        include: {
          sender: {
            select: {
              uuid: true,
              name: true,
              profileImageUrl: true,
            },
          },
        },
      })
      .catch((err: unknown) =>
        this.handlePrismaError('findMessageByUuid', err),
      );
  }

  async editMessage(
    messageUuid: string,
    content: string,
  ): Promise<ChatMessageWithSender> {
    return this.prismaService.chatMessage
      .update({
        where: {
          uuid: messageUuid,
        },
        data: {
          content,
          editedAt: new Date(),
        },
        include: {
          sender: {
            select: {
              uuid: true,
              name: true,
              profileImageUrl: true,
            },
          },
        },
      })
      .catch((err: unknown) =>
        this.handlePrismaError('editMessage', err, {
          notFoundMessage: `Message with uuid ${messageUuid} not found`,
        }),
      );
  }

  async softDeleteMessage(messageUuid: string): Promise<ChatMessageWithSender> {
    return this.prismaService.chatMessage
      .update({
        where: {
          uuid: messageUuid,
        },
        data: {
          content: null,
          status: ChatMessageStatus.DELETED,
          deletedAt: new Date(),
        },
        include: {
          sender: {
            select: {
              uuid: true,
              name: true,
              profileImageUrl: true,
            },
          },
        },
      })
      .catch((err: unknown) =>
        this.handlePrismaError('softDeleteMessage', err, {
          notFoundMessage: `Message with uuid ${messageUuid} not found`,
        }),
      );
  }

  async getRecentMessages(params: {
    roomUuid: string;
    userUuid: string;
    take: number;
    cursor?: string;
  }): Promise<ChatMessageWithSender[]> {
    const blockedUsers = await this.prismaService.userBlock
      .findMany({
        where: {
          blockerUserUuid: params.userUuid,
        },
        select: {
          blockedUserUuid: true,
        },
      })
      .catch((err: unknown) =>
        this.handlePrismaError('getRecentMessages.findBlockedUsers', err),
      );

    const blockedUserUuids = blockedUsers.map((item) => item.blockedUserUuid);

    return this.prismaService.chatMessage
      .findMany({
        where: {
          roomUuid: params.roomUuid,
          senderUuid: {
            notIn: blockedUserUuids,
          },
        },
        take: params.take,
        skip: params.cursor ? 1 : 0,
        cursor: params.cursor
          ? {
              uuid: params.cursor,
            }
          : undefined,
        orderBy: {
          createdAt: 'desc',
        },
        include: {
          sender: {
            select: {
              uuid: true,
              name: true,
              profileImageUrl: true,
            },
          },
        },
      })
      .catch((err: unknown) =>
        this.handlePrismaError('getRecentMessages.findMessages', err, {
          notFoundMessage: 'Cursor message not found',
        }),
      );
  }

  async blockUser(
    blockerUserUuid: string,
    blockedUserUuid: string,
  ): Promise<void> {
    if (blockerUserUuid === blockedUserUuid) {
      throw new Error('Self Block is not allowed');
    }
    await this.prismaService.userBlock
      .upsert({
        where: {
          blockerUserUuid_blockedUserUuid: {
            blockerUserUuid,
            blockedUserUuid,
          },
        },
        update: {},
        create: {
          blockerUserUuid,
          blockedUserUuid,
        },
      })
      .catch((err: unknown) =>
        this.handlePrismaError('blockUser', err, {
          foreignKeyMessage: 'Blocker user or blocked user does not exist',
          conflictMessage: 'User block already exists',
        }),
      );
  }

  async unblockUser(
    blockerUserUuid: string,
    blockedUserUuid: string,
  ): Promise<{ count: number }> {
    return this.prismaService.userBlock
      .deleteMany({
        where: {
          blockerUserUuid,
          blockedUserUuid,
        },
      })
      .catch((err: unknown) => this.handlePrismaError('unblockUser', err));
  }

  async findReceiverUuidsBlockingSender(
    senderUserUuid: string,
  ): Promise<string[]> {
    const blocks = await this.prismaService.userBlock
      .findMany({
        where: {
          blockedUserUuid: senderUserUuid,
        },
        select: {
          blockerUserUuid: true,
        },
      })
      .catch((err: unknown) =>
        this.handlePrismaError('findReceiverUuidsBlockingSender', err),
      );

    return blocks.map((block) => block.blockerUserUuid);
  }

  private handlePrismaError(
    methodName: string,
    err: unknown,
    option: PrismaErrorOption = {},
  ): never {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === 'P2025') {
        this.logger.error(`${methodName} Error`);
        this.logger.debug(err);
        throw new NotFoundException(
          option.notFoundMessage ?? 'Resource not found',
        );
      }

      if (err.code === 'P2002') {
        this.logger.error(`${methodName} Error`);
        this.logger.debug(err);
        throw new ConflictException(
          option.conflictMessage ?? 'Unique constraint failed',
        );
      }

      if (err.code === 'P2003') {
        this.logger.error(`${methodName} Error`);
        this.logger.debug(err);
        throw new BadRequestException(
          option.foreignKeyMessage ?? 'Invalid relation',
        );
      }

      this.logger.error(`${methodName} Error`);
      this.logger.debug(err);
      throw new InternalServerErrorException('Database Error');
    }

    this.logger.error(`${methodName} Error`);
    this.logger.debug(err);
    throw new InternalServerErrorException('Unknown Error');
  }
}
