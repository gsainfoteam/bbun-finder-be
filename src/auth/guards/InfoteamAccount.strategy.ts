import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-http-bearer';
import { AuthService } from '../auth.service';
import { IdTokenPayloadType } from '@lib/infoteam-account';

@Injectable()
export class InfoteamAccountStrategy extends PassportStrategy(
  Strategy,
  'infoteam-account',
) {
  private readonly logger = new Logger(InfoteamAccountStrategy.name);
  constructor(private readonly authService: AuthService) {
    super();
  }

  async validate(token: string): Promise<IdTokenPayloadType> {
    return this.authService.validateIdToken(token).catch((err) => {
      this.logger.debug(err);
      throw new UnauthorizedException('Invalid ID Token');
    });
  }
}
