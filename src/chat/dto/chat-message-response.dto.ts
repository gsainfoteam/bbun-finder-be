import { ApiProperty } from '@nestjs/swagger';
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

export class ChatMessageResponseDto {
  @ApiProperty({
    description: '채팅 메시지 UUID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  messageUuid!: string;

  @ApiProperty({
    description: '채팅방 UUID',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  roomUuid!: string;

  @ApiProperty({
    description: '메시지 발신자 UUID',
    example: '550e8400-e29b-41d4-a716-446655440002',
  })
  senderUuid!: string;

  @ApiProperty({
    description: '채팅 메시지 내용',
    example: '안녕하세요.',
  })
  message!: string;

  @ApiProperty({
    description: '채팅 메시지 상태',
    enum: ChatMessageStatus,
    example: ChatMessageStatus.ACTIVE,
  })
  status!: ChatMessageStatus;

  @ApiProperty({
    description: '메시지 생성 시각',
    type: String,
    format: 'date-time',
    example: '2026-06-02T09:30:00.000Z',
  })
  createdAt!: Date;

  @ApiProperty({
    description: '메시지 수정 시각',
    type: String,
    format: 'date-time',
    nullable: true,
    example: null,
  })
  editedAt!: Date | null;

  @ApiProperty({
    description: '메시지 삭제 시각',
    type: String,
    format: 'date-time',
    nullable: true,
    example: null,
  })
  deletedAt!: Date | null;
}

export class ChatRoomUserDto {
  @ApiProperty({
    description: '사용자 UUID',
    example: '550e8400-e29b-41d4-a716-446655440003',
  })
  userUuid!: string;

  @ApiProperty({
    description: '사용자 이름',
    example: '홍길동',
  })
  name!: string;

  @ApiProperty({
    description: '사용자 프로필 이미지 URL',
    nullable: true,
    example: 'https://example.com/profile.png',
  })
  profileImageUrl!: string | null;
}

export class ChatRoomInfoDto {
  @ApiProperty({
    description: '채팅방 UUID',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  roomUuid!: string;

  @ApiProperty({
    description: '채팅방 line key',
    example: '20241234',
  })
  lineKey!: string;

  @ApiProperty({
    description: '채팅방 참여 사용자 목록',
    type: () => [ChatRoomUserDto],
  })
  users!: ChatRoomUserDto[];
}
