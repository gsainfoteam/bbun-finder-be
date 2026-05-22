import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class WsEditChatReqDto {
  @IsUUID()
  messageUuid!: string;
  @IsString()
  @IsNotEmpty()
  message!: string;
}
