import { Type } from 'class-transformer';
import { IsDate, IsString, IsNotEmpty } from 'class-validator';

export class WsAuthorizationReqDto {
  @Type(() => Date)
  @IsDate()
  authorization_until!: Date;
}

export class WsAuthorizationResDto {
  @IsString()
  @IsNotEmpty()
  authorization!: string;
}
