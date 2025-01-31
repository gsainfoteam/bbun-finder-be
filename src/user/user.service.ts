import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { LoginDto } from './dto/req/login.dto';
import { UserRepository } from './user.repository';
import { JwtTokenType } from './types/jwtToken.type';
import { User } from '@prisma/client';
import { InfoteamIdpService } from '@lib/infoteam-idp';
import { Loggable } from '@lib/logger/decorator/loggable';
import { CustomConfigService } from '@lib/custom-config';
import { Express } from 'express';
import { promises as fs } from 'fs';
@Injectable()
@Loggable()
export class UserService {
  private readonly logger = new Logger(UserService.name);
  constructor(
    private readonly customConfigService: CustomConfigService,
    private readonly infoteamIdpService: InfoteamIdpService,
    private readonly userRepository: UserRepository,
  ) {}

  /**
   * this method is used to infoteam idp login,
   * so we can assume user must have idp account
   * because the sign up is handled by idp
   *
   * @returns accessToken, refreshToken and the information that is  the user consent required
   */
  async login({ code, type }: LoginDto): Promise<JwtTokenType> {
    if (!code || !type) {
      this.logger.debug('invalid code or type');
      throw new BadRequestException();
    }
    const redirectUri =
      type === 'flutter'
        ? this.customConfigService.FLUTTER_REDIRECT_URI
        : type === 'local'
          ? this.customConfigService.LOCAL_REDIRECT_URI
          : this.customConfigService.WEB_REDIRECT_URI;
    const tokens = await this.infoteamIdpService.getAccessToken(
      code,
      redirectUri,
    );
    const userInfo = await this.infoteamIdpService.getUserInfo(
      tokens.access_token,
    );
    const user = await this.userRepository.findUserOrCreate({
      uuid: userInfo.uuid,
      name: userInfo.name,
      email: userInfo.email,
      studentNumber: userInfo.studentNumber,
    });
    return {
      ...tokens,
      consent_required: !user?.consent,
    };
  }

  /**
   * this method is used to refresh the access token.
   * therefore, the user must have a refresh token.
   * @param refreshToken
   * @returns accessToken, refreshToken and the information that is  the user consent required
   */
  async refresh(refreshToken: string): Promise<JwtTokenType> {
    const tokens = await this.infoteamIdpService.refresh(refreshToken);
    const userData = await this.infoteamIdpService.getUserInfo(
      tokens.access_token,
    );
    const user = await this.userRepository.findUserOrCreate({
      uuid: userData.uuid,
      name: userData.name,
      email: userData.email,
      studentNumber: userData.studentNumber,
    });
    return {
      ...tokens,
      consent_required: !user?.consent,
    };
  }

  /**
   * this method is used to logout the user from the idp
   * @param accessToken
   * @param refreshToken
   * @returns void
   */
  async logout(accessToken: string, refreshToken: string): Promise<void> {
    await this.infoteamIdpService.revoke(accessToken);
    await this.infoteamIdpService.revoke(refreshToken);
  }

  /**
   * this method is used to set the user consent about bbundlineskate service
   * @param user
   * @returns void
   */
  async setConsent(user: User): Promise<void> {
    await this.userRepository.setConsent(user);
  }

  /**
   * this method is used to find the user or create the user
   * @param user
   * @returns user
   */
  async findUserOrCreate(
    user: Pick<User, 'uuid' | 'name' | 'email' | 'studentNumber'>,
  ): Promise<User> {
    return this.userRepository.findUserOrCreate(user);
  }

  async findUserByStudentNumber(studentNumber: string): Promise<User> {
    return this.userRepository.findUserByStudentNumber(studentNumber);
  }

  async findUserByMatchingSN(studentNumber: string): Promise<User[]> {
    const users = await this.userRepository.findUserByMatchingSN(studentNumber);

    if (users.length === 0) {
      throw new NotFoundException(
        'No users found with matching student number',
      );
    }
    return users;
  }

  async uploadProfileImage(
    uuid: string,
    file: Express.Multer.File,
  ): Promise<void> {
    if (!file) {
      throw new NotFoundException('No file');
    }
    const base64Image = await this.converFileToBase64(file);

    await this.userRepository.saveProfileImage(uuid, base64Image);
  }

  //특정 사용자의 프로필 사진 조회
  async getProfileImage(uuid: string): Promise<string> {
    const image = await this.userRepository.getProfileImage(uuid);

    if (!image) {
      throw new NotFoundException("There's no profile pictures");
    }

    return image;
  }

  //파일을 base64로 변환환
  private async converFileToBase64(file: Express.Multer.File): Promise<string> {
    const fileBuffer = await fs.readFile(file.path);
    return `data:${file.mimetype};base64,${fileBuffer.toString('base64')}`;
  }
  // async RegisterBbunUser(
  //   user: Pick<User, 'uuid'
  // )

  // async setFcmToken(userUuid: string, fcmToken: setFcmTokenReq) {
  //   return this.userRepository.setFcmToken(userUuid, fcmToken);
  // }
}
