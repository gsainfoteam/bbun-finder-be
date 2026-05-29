import { ChatMessageStatus } from '../../../generated/prisma/enums';

export type ChatMessageEntity = {
  uuid: string;
  roomUuid: string;
  senderUuid: string;
  content: string;
  status: ChatMessageStatus;
  createdAt: Date;
  updatedAt: Date;
  editedAt: Date | null;
  deletedAt: Date | null;
};

export type ChatMessageResponseDto = {
  messageUuid: string;
  roomUuid: string;
  senderUuid: string;
  message: string;
  status: ChatMessageStatus;
  createdAt: Date;
  editedAt: Date | null;
  deletedAt: Date | null;
};

export type ChatRoomUserDto = {
  userUuid: string;
  name: string;
  profileImageUrl: string | null;
};

export type ChatRoomInfoDto = {
  roomUuid: string;
  lineKey: string;
  users: ChatRoomUserDto[];
};
