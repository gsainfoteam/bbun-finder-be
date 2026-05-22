import { IsUUID } from 'class-validator';

export class WsBlockUserReqDto {
  @IsUUID()
  targetUserUuid!: string;
}
