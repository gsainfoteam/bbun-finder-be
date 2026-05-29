import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '@lib/prisma';
import { Prisma, ChatMessageStatus } from '../../generated/prisma/client';
import { Loggable } from '@lib/logger';
import {
  ChatMessageEntity,
  ChatRoomUserDto,
} from './dto/chat-message-response.dto';

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
  }): Promise<ChatMessageEntity> {
    return this.prismaService.chatMessage
      .create({
        data: {
          roomUuid: params.roomUuid,
          senderUuid: params.senderUuid,
          content: params.content,
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
  ): Promise<ChatMessageEntity | null> {
    return this.prismaService.chatMessage
      .findUnique({
        where: {
          uuid: messageUuid,
        },
      })
      .catch((err: unknown) =>
        this.handlePrismaError('findMessageByUuid', err),
      );
  }

  async editMessage(
    messageUuid: string,
    content: string,
  ): Promise<ChatMessageEntity> {
    return this.prismaService.chatMessage
      .update({
        where: {
          uuid: messageUuid,
        },
        data: {
          content,
          status: ChatMessageStatus.EDITED,
          editedAt: new Date(),
        },
      })
      .catch((err: unknown) =>
        this.handlePrismaError('editMessage', err, {
          notFoundMessage: `Message with uuid ${messageUuid} not found`,
        }),
      );
  }

  async softDeleteMessage(messageUuid: string): Promise<ChatMessageEntity> {
    return this.prismaService.chatMessage
      .update({
        where: {
          uuid: messageUuid,
        },
        data: {
          // 삭제된 메시지는 실제 content는 남기고, 상태만 Deleted로 바꿈
          // 클라이언트 표시 문구는 CahtService.toMessageResponse()에서 생성
          status: ChatMessageStatus.DELETED,
          deletedAt: new Date(),
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
  }): Promise<ChatMessageEntity[]> {
    const blockedUsers = await this.prismaService.userBlock
      .findMany({
        where: {
          blockerUserUuid: params.userUuid,
          // 일단 삭제된 메시지는 삭제되었다고 표시할 것인지 프론트쪽 진행상황을 몰라서 주석처리만 해두었습니다.
          // status: {
          //   in: [ChatMessageStatus.ACTIVE, ChatMessageStatus.EDITED],
          // },
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
        //pagination 정렬 문제(createdAt이 완전히 똑같을 수도 있어서)
        orderBy: [{ createdAt: 'desc' }, { uuid: 'desc' }],
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
      .catch((err: unknown) => this.handlePrismaError('blockUser', err));
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

  async findRoomUsers(roomUuid: string): Promise<ChatRoomUserDto[]> {
    const members = await this.prismaService.chatRoomMember
      .findMany({
        where: {
          roomUuid,
          leftAt: null,
          user: {
            consent: true,
            deletedAt: null,
          },
        },
        include: {
          user: {
            select: {
              uuid: true,
              name: true,
              profileImageUrl: true,
            },
          },
        },
        orderBy: {
          joinedAt: 'asc',
        },
      })
      .catch((err: unknown) => this.handlePrismaError('findRoomUsers', err));

    return members.map((member) => ({
      userUuid: member.user.uuid,
      name: member.user.name,
      profileImageUrl: member.user.profileImageUrl,
    }));
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
    this.logger.error(`${methodName} Error`);
    this.logger.debug(err);
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === 'P2000') {
        throw new BadRequestException('Input value is too long');
      }
      if (err.code === 'P2025') {
        throw new NotFoundException(
          option.notFoundMessage ?? 'Resource not found',
        );
      }

      if (err.code === 'P2002') {
        throw new ConflictException(
          option.conflictMessage ?? 'Unique constraint failed',
        );
      }

      if (err.code === 'P2003') {
        throw new BadRequestException(
          option.foreignKeyMessage ?? 'Invalid relation',
        );
      }
      throw new InternalServerErrorException('Database Error');
    }
    throw new InternalServerErrorException('Unknown Error');
  }
}
