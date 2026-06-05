import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsUUID, MaxLength } from 'class-validator';

export class WsEditChatReqDto {
  @ApiProperty({
    description: '수정할 채팅 메시지 UUID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID()
  messageUuid!: string;

  @ApiProperty({
    description: '수정할 메시지 내용',
    example: '수정된 메시지입니다.',
    maxLength: 255,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  message!: string;
}
