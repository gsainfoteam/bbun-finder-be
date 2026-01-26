//전체 다 필요 없음

import { IsString } from 'class-validator';

export class LogoutDto {
  @IsString()
  access_token: string;
}
