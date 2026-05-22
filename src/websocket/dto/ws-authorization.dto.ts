import { Type } from 'class-transformer';
import { IsDate } from 'class-validator';

export class WsAuthorizationReqDto {
  @Type(() => Date)
  @IsDate()
  authorization_until!: Date;
}

export class WsAuthorizationResDto {
  authorization!: string;
}
