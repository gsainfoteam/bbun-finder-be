import { Injectable, Logger } from '@nestjs/common';
import { UserRepository } from './user.repository';
import { User } from '@prisma/client';
import { InfoteamIdpService } from '@lib/infoteam-idp';
import { Loggable } from '@lib/logger/decorator/loggable';
import { CustomConfigService } from '@lib/custom-config';
import { UpdateUserDto } from './dto/req/updateUser.dto';
import { UserRegistrationDto } from './dto/res/userInfoRes.dto';
import { BbunUserResDto } from './dto/res/bbunUser.dto';
import { CreateTempUserDto, registerUserDto } from './dto/req/createUser.dto';
import { EmailService } from 'src/email/email.service';
import { AuthRepository } from 'src/auth/auth.repository';
@Injectable()
@Loggable()
export class UserService {
  private readonly logger = new Logger(UserService.name);
  constructor(
    private readonly customConfigService: CustomConfigService,
    private readonly emailService: EmailService,
    private readonly infoteamIdpService: InfoteamIdpService,
    private readonly userRepository: UserRepository,
    private readonly authRepository: AuthRepository,
  ) {}

  //서비스 회원탈퇴
  async deleteUser(
    user: Pick<User, 'studentNumber'>,
  ): Promise<UserRegistrationDto> {
    return this.userRepository.deleteUser(user);
  }

  //자기 자신의 정보 조회 (이거 수정해야 됨 )
  //senUser를 굳이 pick으로 uuid만 뽑게 할 필요가 없음.
  async getUserInfoBbun(sendUser: Pick<User, 'uuid'>): Promise<BbunUserResDto> {
    const user = await this.authRepository.findUserByUuid(sendUser.uuid);

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

  //서비스 회원가입(임시테스트 용)
  async registerTempUser(
    studentNumber: string,
    selection_info: registerUserDto,
  ): Promise<BbunUserResDto> {
    const user = await this.authRepository.registerUser(
      studentNumber,
      selection_info,
    );

    //뻔라인 조회 및 이메일 전송을 위해 email list 조회
    const bbunlineEmails =
      await this.authRepository.findUserToSendEmail(studentNumber);
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

  //서비스 회원가입
  async registerUser(
    sendUser: Pick<Prisma.UserModel, 'name' | 'email' | 'studentNumber'>,
    selection_info: registerUserDto,
  ): Promise<BbunUserResDto> {
    const user = await this.authRepository.registerUser(
      sendUser.studentNumber,
      selection_info,
    );

    //뻔라인 조회 및 이메일 전송을 위해 email list 조회
    const bbunlineEmails = await this.authRepository.findUserToSendEmail(
      sendUser.studentNumber,
    );
    const emailList = bbunlineEmails.map((user) => user.email);

    await this.emailSerivce.sendEmailBbunline(emailList);

    return {
      ...user,
      profileImage: user.profileImage
        ? Buffer.from(user.profileImage).toString('base64')
        : null,
    };
  }
}
