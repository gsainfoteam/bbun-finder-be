import { IsNotEmpty, IsString, IsUUID, MaxLength } from 'class-validator';

export class WsEditChatReqDto {
  @IsUUID()
  messageUuid!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  message!: string;
}
