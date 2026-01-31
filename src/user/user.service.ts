import { Injectable, Logger } from '@nestjs/common';
import { UserRepository } from './user.repository';
import { Loggable } from '@lib/logger/decorator/loggable';
import { CustomConfigService } from '@lib/custom-config';
import { IdTokenPayloadType } from '@lib/infoteam-account';
import { EmailService } from '@lib/email';
import { Prisma } from 'generated/prisma/client';
import { UserResDto } from './dto/res/userRes.dto';
import { UpdateDataDto } from './dto/req/updateData.dto';
@Injectable()
@Loggable()
export class UserService {
  private readonly logger = new Logger(UserService.name);
  constructor(
    private readonly customConfigService: CustomConfigService,
    private readonly emailService: EmailService,
    private readonly userRepository: UserRepository,
  ) {}

  //서비스 회원가입
  async registerUser(infoteamUser: IdTokenPayloadType): Promise<void> {
    const user = await this.userRepository.createUser(infoteamUser);

    //뻔라인 조회 및 이메일 전송을 위해 email list 조회
    const bbunlineEmails = await this.userRepository.findUserByMatchingSN(
      user.studentNumber,
      false,
    );
    const emailList = bbunlineEmails.map((user) => user.email);

    await this.emailService.sendEmailBbunline(emailList);
  }

  //서비스 회원탈퇴
  async deleteUser(user: Pick<Prisma.UserModel, 'uuid'>): Promise<void> {
    return this.userRepository.deleteUser(user);
  }

  //유저 정보 업데이트
  async updateUserInfo(
    uuid: string,
    UpdateData: UpdateDataDto,
  ): Promise<UserResDto> {
    return this.userRepository.updateUserInfo(uuid, UpdateData);
  }
}
