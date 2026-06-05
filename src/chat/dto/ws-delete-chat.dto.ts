import { IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class WsDeleteChatReqDto {
  @ApiProperty({
    description: '삭제할 채팅 메시지 UUID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID()
  messageUuid!: string;
}
