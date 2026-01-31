import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { AuthRepository } from './auth.repository';
import { Loggable } from '@lib/logger/decorator/loggable';
import { CustomConfigService } from '@lib/custom-config';
import { JwtService } from '@nestjs/jwt';
import * as crypto from 'crypto';
import ms, { StringValue } from 'ms';
import { IssueTokenType, JwtTokenType } from './types/jwtToken.types';
import { RedisService } from 'libs/redis/src';
import {
  IdTokenPayloadType,
  InfoteamAccountService,
} from '@lib/infoteam-account';
import { Prisma } from 'generated/prisma/client';

@Injectable()
@Loggable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly refreshTokenPrefix = 'bbunRefreshToken';
  private readonly refreshTokenExpire: number;
  constructor(
    private readonly customConfigService: CustomConfigService,
    private readonly infoteamAccountService: InfoteamAccountService,
    private readonly authRepository: AuthRepository,
    private readonly jwtService: JwtService,
    private readonly redisService: RedisService,
  ) {
    this.refreshTokenExpire = ms(
      customConfigService.REFRESH_TOKEN_EXPIRE as StringValue,
    );
  }

  /**
   * this method is used to login the user and issue the access token and refresh token.
   * @param param0 IdTokenPayloadType
   * @returns accessToken, refreshToken and the information that is  the user consent
   */
  async login({
    sub,
    name,
    student_id,
    email,
    picture,
  }: IdTokenPayloadType): Promise<JwtTokenType> {
    const user = await this.authRepository.findUserByUuid(sub);
    await this.authRepository.updateUserBasicInfo(sub, {
      name,
      studentNumber: student_id,
      email,
      profileImageUrl: picture,
    });
    const tokens = await this.issueTokens(user.uuid);
    return { ...tokens, consent: user.consent };
  }

  /**
   * this method is used to refresh the access token.
   * therefore, the user must have a refresh token.
   * @param refreshToken
   * @returns accessToken, refreshToken and the information that is  the user consent
   */
  async refresh(refreshToken: string): Promise<JwtTokenType> {
    const uuid = await this.redisService
      .getOrThrow<string>(refreshToken, {
        prefix: this.refreshTokenPrefix,
      })
      .catch(() => {
        throw new UnauthorizedException('Invalid refresh token');
      });
    const user = await this.authRepository.findUserByUuid(uuid);
    await this.redisService.del(refreshToken, {
      prefix: this.refreshTokenPrefix,
    });
    const { access_token, refresh_token } = await this.issueTokens(user.uuid);
    return {
      access_token,
      refresh_token,
      consent: user.consent,
    };
  }

  /**
   * this method is used to logout the user from the idp
   * @param accessToken
   * @param refreshToken
   * @returns void
   */
  async logout(refreshToken: string): Promise<void> {
    await this.redisService.del(refreshToken, {
      prefix: this.refreshTokenPrefix,
    });
  }

  async validateIdToken(idToken: string): Promise<IdTokenPayloadType> {
    return this.infoteamAccountService.verifyOpenIdToken(idToken);
  }

  async findUserByUuid(uuid: string): Promise<Prisma.UserModel> {
    return await this.authRepository.findUserByUuid(uuid);
  }

  private generateOpaqueToken() {
    return crypto
      .randomBytes(32)
      .toString('base64')
      .replace(/[+//=]/g, '');
  }

  private async issueTokens(uuid: string): Promise<IssueTokenType> {
    const refresh_token: string = this.generateOpaqueToken();
    await this.redisService.set<string>(refresh_token, uuid, {
      prefix: this.refreshTokenPrefix,
      ttl: this.refreshTokenExpire / 1000,
    });
    return {
      access_token: this.jwtService.sign({}, { subject: uuid }),
      refresh_token,
    };
  }
}
