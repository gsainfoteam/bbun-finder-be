import { IsUUID } from 'class-validator';

export class WsDeleteChatReqDto {
  @IsUUID()
  messageUuid!: string;
}
