import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, MaxLength } from 'class-validator';

export class WsSendChatReqDto {
  @ApiProperty({
    description: '전송할 채팅 메시지 내용',
    example: '안녕하세요.',
    maxLength: 255,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  message!: string;
}
