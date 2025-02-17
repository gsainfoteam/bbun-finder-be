import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { LoginDto } from './dto/req/login.dto';
import { UserRepository } from './user.repository';
import { JwtTokenType } from './types/jwtToken.type';
import { User } from '@prisma/client';
import { InfoteamIdpService } from '@lib/infoteam-idp';
import { Loggable } from '@lib/logger/decorator/loggable';
import { CustomConfigService } from '@lib/custom-config';
import { UpdateUserDto } from './dto/req/updateUser.dto';
import { UserRegistrationDto } from './dto/res/userInfoRes.dto';
import { BbunUserResDto } from './dto/res/bbunUser.dto';
import { CreateTempUserDto, registerUserDto } from './dto/req/createUser.dto';
import { EmailService } from 'src/email/email.service';
@Injectable()
@Loggable()
export class UserService {
  private readonly logger = new Logger(UserService.name);
  constructor(
    private readonly customConfigService: CustomConfigService,
    private readonly emailService: EmailService,
    private readonly infoteamIdpService: InfoteamIdpService,
    private readonly userRepository: UserRepository,
  ) {}

  /**
   * this method is used to infoteam idp login,
   * so we can assume user must have idp account
   * because the sign up is handled by idp
   *
   * @returns accessToken, refreshToken
   */
  async login({ code, type }: LoginDto): Promise<JwtTokenType> {
    if (!code || !type) {
      this.logger.debug('invalid code or type');
      throw new BadRequestException();
    }
    const redirectUri =
      type === 'local'
        ? this.customConfigService.LOCAL_REDIRECT_URI
        : this.customConfigService.WEB_REDIRECT_URI;
    const tokens = await this.infoteamIdpService.getAccessToken(
      code,
      redirectUri,
    );
    return {
      ...tokens,
    };
  }

  /**
   * this method is used to refresh the access token.
   * therefore, the user must have a refresh token.
   * @param refreshToken
   * @returns accessToken, refreshToken
   */
  async refresh(refreshToken: string): Promise<JwtTokenType> {
    const tokens = await this.infoteamIdpService.refresh(refreshToken);
    return {
      ...tokens,
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
   * this method is used to find the user or create the user
   * @param user
   * @returns user
   */
  async findUserOrCreate(
    user: Pick<User, 'uuid' | 'name' | 'email' | 'studentNumber'>,
  ): Promise<User> {
    return this.userRepository.findUserOrCreate(user);
  }

  //서비스 회원가입
  async registerUser(
    sendUser: Pick<User, 'name' | 'email' | 'studentNumber'>,
    selection_info: registerUserDto,
  ): Promise<BbunUserResDto> {
    const user = await this.userRepository.registerUser(
      sendUser.studentNumber,
      selection_info,
    );

    //뻔라인 조회 및 이메일 전송을 위해 email list 조회
    const bbunlineEmails = await this.userRepository.findUserToSendEmail(
      sendUser.studentNumber,
    );
    const emailList = bbunlineEmails.map((user) => user.email);

    await this.emailService.sendEmailBbunline(emailList);

    return {
      ...user,
      profileImage: user.profileImage
        ? Buffer.from(user.profileImage).toString('base64')
        : null,
    };
  }

  //서비스 회원탈퇴
  async deleteUser(
    user: Pick<User, 'studentNumber'>,
  ): Promise<UserRegistrationDto> {
    return this.userRepository.deleteUser(user);
  }

  //자기 자신의 정보 조회
  async getUserInfoBbun(sendUser: Pick<User, 'uuid'>): Promise<BbunUserResDto> {
    const user = await this.userRepository.findUserByUuid(sendUser);

    return {
      ...user,
      profileImage: user.profileImage
        ? Buffer.from(user.profileImage).toString('base64')
        : null,
    };
  }

  //유저의 뻔라인 조회
  async findUserByMatchingSN(
    studentNumber: string,
  ): Promise<{ total: number; list: BbunUserResDto[] }> {
    const users = await this.userRepository.findUserByMatchingSN(
      studentNumber,
      true,
    );

    return {
      total: users.length,
      list: users.map((user) => ({
        ...user,
        profileImage: user.profileImage
          ? Buffer.from(user.profileImage).toString('base64')
          : null,
      })),
    };
  }

  //유저 정보 업데이트
  async updateUserInfo(
    studentNumber: string,
    selection_info: UpdateUserDto,
  ): Promise<BbunUserResDto> {
    const user = await this.userRepository.updateUserInfo(
      studentNumber,
      selection_info,
    );

    return {
      ...user,
      profileImage: user.profileImage
        ? Buffer.from(user.profileImage).toString('base64')
        : null,
    };
  }

  /*
  test용 api
  */

  //학번으로 정보 찾기
  async findUserByStudentNumber(
    studentNumber: string,
  ): Promise<BbunUserResDto> {
    const user =
      await this.userRepository.findUserByStudentNumber(studentNumber);

    return {
      ...user,
      profileImage: user.profileImage
        ? Buffer.from(user.profileImage).toString('base64')
        : null,
    };
  }

  //테스트용 계정 생성
  async createTempUser(
    createTempUser: CreateTempUserDto,
  ): Promise<BbunUserResDto> {
    const user = await this.userRepository.createTempUser(createTempUser);

    return {
      ...user,
      profileImage: user.profileImage
        ? Buffer.from(user.profileImage).toString('base64')
        : null,
    };
  }

  //서비스 회원가입
  async registerTempUser(
    studentNumber: string,
    selection_info: registerUserDto,
  ): Promise<BbunUserResDto> {
    const user = await this.userRepository.registerUser(
      studentNumber,
      selection_info,
    );

    //뻔라인 조회 및 이메일 전송을 위해 email list 조회
    const bbunlineEmails =
      await this.userRepository.findUserToSendEmail(studentNumber);
    const emailList = bbunlineEmails.map((user) => user.email);

    await this.emailService.sendEmailBbunline(emailList);

    return {
      ...user,
      profileImage: user.profileImage
        ? Buffer.from(user.profileImage).toString('base64')
        : null,
    };
  }

  //등록 상태 변경(isBbunRegistered)
  async updateIsBbunRegistered(
    registration: Pick<User, 'studentNumber' | 'isBbunRegistered'>,
  ): Promise<UserRegistrationDto> {
    return this.userRepository.updateIsBbunRegistered(registration);
  }
}
