import { IsString, IsNotEmpty, MaxLength } from 'class-validator';
export class WsSendChatReqDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(314)
  message!: string;
}
