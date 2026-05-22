import { IsString, IsNotEmpty } from 'class-validator';
export class WsSendChatReqDto {
  @IsString()
  @IsNotEmpty()
  message!: string;
}
