import { IsString, IsNotEmpty, MaxLength } from 'class-validator';
export class WsSendChatReqDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  message!: string;
}
