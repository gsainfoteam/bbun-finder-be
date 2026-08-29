import { Injectable, Logger } from '@nestjs/common';
import { UserRepository } from './user.repository';
import { Loggable } from '@lib/logger/decorator/loggable';
import { CustomConfigService } from '@lib/custom-config';
import { IdTokenPayloadType } from '@lib/infoteam-account';
import { EmailService } from '@lib/email';
import { Prisma } from '../../generated/prisma/client';
import { UserResDto } from './dto/res/userRes.dto';
import { UpdateDataDto } from './dto/req/updateData.dto';
import { ChatService } from '../chat/chat.service';
import { UpdateStudentNumberDto } from './dto/req/updateStudentNumber.dto';

@Injectable()
@Loggable()
export class UserService {
  private readonly logger = new Logger(UserService.name);
  constructor(
    private readonly customConfigService: CustomConfigService,
    private readonly emailService: EmailService,
    private readonly userRepository: UserRepository,
    private readonly chatService: ChatService,
  ) {}

  //서비스 회원가입
  async registerUser(infoteamUser: IdTokenPayloadType): Promise<void> {
    const user = await this.userRepository.createUser(infoteamUser);

    await this.chatService.syncBbunRoomForUser(user.uuid, user.studentNumber);

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
    await this.chatService.leaveAllRoomsForUser(user.uuid);
    return this.userRepository.deleteUser(user);
  }

  //유저 정보 업데이트
  async updateUserInfo(
    uuid: string,
    UpdateData: UpdateDataDto,
  ): Promise<UserResDto> {
    return this.userRepository.updateUserInfo(uuid, UpdateData);
  }
  // staging 테스트용 학번 변경
  async updateStudentNumberForStaging(
    uuid: string,
    updateStudentNumberDto: UpdateStudentNumberDto,
  ): Promise<UserResDto> {
    // if (process.env.APP_ENV !== 'staging') {
    //   throw new ForbiddenException(
    //     'This API is only available in the staging environment',
    //   );
    // }

    const updatedUser = await this.userRepository.updateStudentNumber(
      uuid,
      updateStudentNumberDto.studentNumber,
    );

    // 변경된 학번을 기준으로 뻔라인 채팅방 다시 동기화
    await this.chatService.syncBbunRoomForUser(
      updatedUser.uuid,
      updatedUser.studentNumber,
    );

    return updatedUser;
  }
}
