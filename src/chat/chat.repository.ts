import { Injectable } from '@nestjs/common';
import { PrismaService } from '@lib/prisma';

@Injectable()
export class ChatRepository {
  constructor(private readonly prismaService: PrismaService) {}

  async findUserByUuid(userUuid: string) {
    return this.prismaService.user.findUnique({
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
    });
  }

  async findOrCreateRoomByLineKey(lineKey: string) {
    return this.prismaService.chatRoom.upsert({
      where: {
        lineKey,
      },
      update: {},
      create: {
        lineKey,
      },
    });
  }

  async upsertRoomMember(roomUuid: string, userUuid: string) {
    return this.prismaService.chatRoomMember.upsert({
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
    });
  }

  async leaveAllRoomsByUserUuid(userUuid: string) {
    return this.prismaService.chatRoomMember.updateMany({
      where: {
        userUuid,
        leftAt: null,
      },
      data: {
        leftAt: new Date(),
      },
    });
  }

  async createMessage(params: {
    roomUuid: string;
    senderUuid: string;
    content: string;
  }) {
    return this.prismaService.chatMessage.create({
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
    });
  }

  async findMessageByUuid(messageUuid: string) {
    return this.prismaService.chatMessage.findUnique({
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
    });
  }

  async editMessage(messageUuid: string, content: string) {
    return this.prismaService.chatMessage.update({
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
    });
  }

  async softDeleteMessage(messageUuid: string) {
    return this.prismaService.chatMessage.update({
      where: {
        uuid: messageUuid,
      },
      data: {
        content: null,
        status: 'DELETED',
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
    });
  }

  async getRecentMessages(params: {
    roomUuid: string;
    userUuid: string;
    take: number;
    cursor?: string;
  }) {
    const blockedUsers = await this.prismaService.userBlock.findMany({
      where: {
        blockerUserUuid: params.userUuid,
      },
      select: {
        blockedUserUuid: true,
      },
    });

    const blockedUserUuids = blockedUsers.map((item) => item.blockedUserUuid);

    return this.prismaService.chatMessage.findMany({
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
    });
  }

  async blockUser(blockerUserUuid: string, blockedUserUuid: string) {
    return this.prismaService.userBlock.upsert({
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
    });
  }

  async unblockUser(blockerUserUuid: string, blockedUserUuid: string) {
    return this.prismaService.userBlock.deleteMany({
      where: {
        blockerUserUuid,
        blockedUserUuid,
      },
    });
  }

  async findReceiverUuidsBlockingSender(senderUserUuid: string) {
    const blocks = await this.prismaService.userBlock.findMany({
      where: {
        blockedUserUuid: senderUserUuid,
      },
      select: {
        blockerUserUuid: true,
      },
    });

    return blocks.map((block) => block.blockerUserUuid);
  }
}
