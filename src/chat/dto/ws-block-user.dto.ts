import { IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class WsBlockUserReqDto {
  @ApiProperty({
    description: '차단하거나 차단 해제할 대상 사용자 UUID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID()
  targetUserUuid!: string;
}
