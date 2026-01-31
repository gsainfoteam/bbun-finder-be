import { CustomConfigService } from '@lib/custom-config';
import { HttpService } from '@nestjs/axios';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { createPublicKey } from 'crypto';
import { firstValueFrom } from 'rxjs';
import { IdTokenPayloadType } from './types/idTokenPayload.type';

@Injectable()
export class InfoteamAccountService implements OnModuleInit {
  private readonly logger = new Logger(InfoteamAccountService.name, {
    timestamp: true,
  });
  private readonly InfoteamAccountBaseUrl: string;
  private InfoteamAccountPublicKey: Buffer;

  constructor(
    private readonly httpService: HttpService,
    private readonly jwtService: JwtService,
    private readonly customConfigService: CustomConfigService,
  ) {
    this.InfoteamAccountBaseUrl =
      this.customConfigService.INFOTEAM_ACCOUNT_BASE_URL;
  }

  async onModuleInit() {
    this.InfoteamAccountPublicKey = await this.getPublicKey();
  }

  async verifyOpenIdToken(idToken: string): Promise<IdTokenPayloadType> {
    return await this.jwtService
      .verifyAsync<IdTokenPayloadType>(idToken, {
        publicKey: this.InfoteamAccountPublicKey,
      })
      .catch((err) => {
        this.logger.error('Failed to verify ID token', err);
        throw err;
      });
  }

  private async getPublicKey(): Promise<Buffer> {
    this.logger.log('Fetching Infoteam Account public key...');
    const url = `${this.InfoteamAccountBaseUrl}/oauth/certs`;
    const response = await firstValueFrom(
      this.httpService.get<{
        keys: {
          kty: string;
          x: string;
          y: string;
          crv: string;
          kid: string;
          use: string;
          alg: string;
        }[];
      }>(url),
    );
    const key = response.data.keys[0];
    const publicKey = createPublicKey({
      key: {
        kty: key.kty,
        crv: key.crv,
        x: key.x,
        y: key.y,
      },
      format: 'jwk',
    });

    // KeyObject를 Buffer로 변환
    return Buffer.from(publicKey.export({ type: 'spki', format: 'pem' }));
  }
}
