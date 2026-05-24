import { ChatMessageStatus } from '../../../generated/prisma/enums';

export type ChatMessageSenderDto = {
  uuid: string;
  name: string;
  profileImageUrl: string | null;
};

export type ChatMessageWithSender = {
  uuid: string;
  roomUuid: string;
  senderUuid: string;
  content: string | null;
  status: ChatMessageStatus;
  createdAt: Date;
  editedAt: Date | null;
  deletedAt: Date | null;
  sender: ChatMessageSenderDto;
};

export type ChatMessageResponseDto = {
  messageUuid: string;
  roomUuid: string;
  senderUuid: string;
  senderName: string | null;
  profileImageUrl: string | null;
  message: string;
  status: ChatMessageStatus;
  createdAt: Date;
  editedAt: Date | null;
  deletedAt: Date | null;
};
