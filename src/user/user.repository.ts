import {
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { User } from '@prisma/client';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { v4 as uuid } from 'uuid';
// import { setFcmTokenReq } from './dto/req/setFcmTokenReq.dto';
import { PrismaService } from '@lib/prisma';
import { Loggable } from '@lib/logger/decorator/loggable';

@Injectable()
@Loggable()
export class UserRepository {
  private readonly logger = new Logger(UserRepository.name);
  constructor(private readonly prismaService: PrismaService) {}

  async findUserByUuid({ uuid }: Pick<User, 'uuid'>) {
    return this.prismaService.user.findUnique({
      where: { uuid },
    });
  }

  //없으면 만들기
  async findUserOrCreate({
    uuid,
    name,
    email,
    studentNumber,
  }: Pick<User, 'uuid' | 'name' | 'email' | 'studentNumber'>): Promise<User> {
    const user = await this.prismaService.user.findUnique({
      where: { uuid },
    });
    if (user) {
      return user;
    }
    return this.prismaService.user.create({
      data: {
        uuid,
        name,
        email,
        studentNumber,
        consent: false,
      },
    });
  }

  //찾아서 업데이트
  async findUserAndUpdate({
    uuid,
    name,
  }: Pick<User, 'uuid' | 'name'>): Promise<User> {
    const user = await this.prismaService.user
      .findUniqueOrThrow({
        where: { uuid },
      })
      .catch((err) => {
        if (err instanceof PrismaClientKnownRequestError) {
          if (err.code === 'P2016') {
            this.logger.debug('user not found');
            throw new NotFoundException();
          }
          this.logger.error(err.message);
          throw new InternalServerErrorException();
        }
        this.logger.error(err);
        throw new InternalServerErrorException();
      });
    if (user.name === name) {
      return user;
    }
    return this.prismaService.user
      .update({
        where: { uuid },
        data: { name },
      })
      .catch((err) => {
        if (err instanceof PrismaClientKnownRequestError) {
          if (err.code === 'P2025') {
            this.logger.debug('user not found');
            throw new NotFoundException();
          }
          this.logger.error(err.message);
          throw new InternalServerErrorException();
        }
        this.logger.error(err);
        throw new InternalServerErrorException();
      })
      .then((user) => {
        return user;
      });
  }

  //Consent 세팅팅
  async setConsent(user: User): Promise<User> {
    return this.prismaService.user
      .update({
        where: { uuid: user.uuid },
        data: { consent: true },
      })
      .catch((err) => {
        if (err instanceof PrismaClientKnownRequestError) {
          if (err.code === 'P2025' || err.code === 'P2016') {
            throw new NotFoundException();
          }
          this.logger.error(err.message);
          throw new InternalServerErrorException();
        }
        this.logger.error(err);
        throw new InternalServerErrorException();
      })
      .then((user) => {
        return user;
      });
  }

  //학번으로 학생 찾기
  async findUserByStudentNumber(studentNumber: string): Promise<User> {
    return this.prismaService.user
      .findUnique({
        where: { studentNumber },
      })
      .catch((err) => {
        if (err instanceof PrismaClientKnownRequestError) {
          if (err.code === 'P2025') {
            this.logger.debug('user not found');
            throw new NotFoundException();
          }
          this.logger.error(err.message);
          this.logger.debug(err);
          throw new InternalServerErrorException('Database Error');
        }
        this.logger.error('findUserAndUpdate Error');
        this.logger.debug(err);
        throw new InternalServerErrorException('Unknown Error');
      });
  }

  //뻔선뻔후 찾아주기
  async findUserByMatchingSN(studentNumber: string): Promise<User[]> {
    const suffix = studentNumber.slice(-4);
    return this.prismaService.user
      .findMany({
        where: {
          studentNumber: {
            endsWith: suffix,
          },
          isBbunRegistered: true, //Bbunlineskate registrant only
          // NOT: {
          //   studentNumber: studentNumber, //excluding the user himself
          // },
        },
      })
      .catch((err) => {
        if (err instanceof PrismaClientKnownRequestError) {
          this.logger.error(err.message);
          this.logger.debug(err);
          throw new InternalServerErrorException('Database Error');
        }
        this.logger.error('findUserByMatchingSN Error');
        this.logger.debug(err);
        throw new InternalServerErrorException('Unknown Error');
      });
  }

  //수정 필요
  async updateUserByUuid(uuid, updateData): Promise<any> {
    return this.prismaService.user.update({
      where: { uuid: uuid },
      data: updateData,
    });
  }

  //테스트용 데이터 생성
  async createTempUser({ name }: Pick<User, 'name'>): Promise<User> {
    return this.prismaService.user
      .create({
        data: {
          uuid: uuid(),
          name,
          email: 'example@gm.gist.ac.kr',
          studentNumber: '20005000',
          consent: false,
        },
      })
      .catch((err) => {
        if (err instanceof PrismaClientKnownRequestError) {
          this.logger.error(err.message);
          throw new InternalServerErrorException();
        }
        this.logger.error(err);
        throw new InternalServerErrorException();
      });
  }

  //사용자의 프로필 사진 저장 (Base 64)
  async saveProfileImage(uuid: string, base64Image: string): Promise<User> {
    return this.prismaService.user.update({
      where: { uuid },
      data: { profileImage: base64Image },
    });
  }

  async getProfileImage(uuid: string): Promise<string | null> {
    const user = await this.prismaService.user.findUnique({
      where: { uuid },
      select: { profileImage: true },
    });

    return user?.profileImage || null;
  }

  async updateUser(studentNumber: string, updateData: any) {
    return await this.prismaService.user.update({
      where: { studentNumber },
      data: updateData,
    });
  }

  // async register(user: User): Promise<User> {
  //   return this.prismaService.user
  //     .update({
  //       where: { uuid: user.uuid },
  //       data: { consent: true },
  //     })
  //     .catch((err) => {
  //       if (err instanceof PrismaClientKnownRequestError) {
  //         if (err.code === 'P2025' || err.code === 'P2016') {
  //           throw new NotFoundException();
  //         }
  //         this.logger.error(err.message);
  //         throw new InternalServerErrorException();
  //       }
  //       this.logger.error(err);
  //       throw new InternalServerErrorException();
  //     })
  //     .then((user) => {
  //       return user;
  //     });
  // }
}
