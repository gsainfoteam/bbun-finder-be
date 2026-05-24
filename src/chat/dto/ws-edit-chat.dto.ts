import { IsNotEmpty, IsString, IsUUID, MaxLength } from 'class-validator';

export class WsEditChatReqDto {
  @IsUUID()
  messageUuid!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(314)
  message!: string;
}
