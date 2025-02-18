import {
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { User } from '@prisma/client';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { v4 as uuid } from 'uuid';
import { PrismaService } from '@lib/prisma';
import { Loggable } from '@lib/logger/decorator/loggable';
import { UpdateUserDto } from './dto/req/updateUser.dto';
import { UserRegistrationDto } from './dto/res/userInfoRes.dto';
import { CreateTempUserDto, registerUserDto } from './dto/req/createUser.dto';

@Injectable()
@Loggable()
export class UserRepository {
  private readonly logger = new Logger(UserRepository.name);
  constructor(private readonly prismaService: PrismaService) {}

  //User를 찾고 없으면 생성(기본값)-IDP 로그인 시 이루어지는 작업
  async findUserOrCreate({
    uuid,
    name,
    email,
    studentNumber,
  }: Pick<User, 'uuid' | 'name' | 'email' | 'studentNumber'>): Promise<User> {
    const user = await this.prismaService.user
      .findUnique({
        where: { uuid },
      })
      .catch((err) => {
        if (err instanceof PrismaClientKnownRequestError) {
          this.logger.error('findUserOrCreate error');
          this.logger.debug(err);
          throw new InternalServerErrorException('Database error');
        }
        this.logger.error('findUserOrCreate error');
        this.logger.debug(err);
        throw new InternalServerErrorException('Unknown error');
      });
    if (user) {
      return user;
    }
    return this.prismaService.user
      .create({
        data: {
          uuid,
          name,
          email,
          studentNumber,
        },
      })
      .catch((err) => {
        if (err instanceof PrismaClientKnownRequestError) {
          this.logger.error('findUserOrCreate error');
          this.logger.debug(err);
          throw new InternalServerErrorException('Database error');
        }
        this.logger.error('findUserOrCreate error');
        this.logger.debug(err);
        throw new InternalServerErrorException('Unknown error');
      });
  }

  //서비스 회원가입
  async registerUser(
    studentNumber: string,
    updateData: registerUserDto,
  ): Promise<User> {
    return await this.prismaService.user
      .update({
        where: { studentNumber },
        data: { ...updateData, isBbunRegistered: true, deletedAt: null },
      })
      .catch((err) => {
        if (err instanceof PrismaClientKnownRequestError) {
          if (err.code === 'P2025') {
            this.logger.error('updateUserInfo Error');
            this.logger.debug(err);
            throw new NotFoundException(
              `User with studentNumber ${studentNumber} not found`,
            );
          }
          this.logger.error('updateUserInfo Error');
          this.logger.debug(err);
          throw new InternalServerErrorException('Database Error');
        }
        this.logger.error('updateUserInfo Error');
        this.logger.debug(err);
        throw new InternalServerErrorException('Unknown Error');
      });
  }

  //서비스 회원탈퇴
  async deleteUser({
    studentNumber,
  }: Pick<User, 'studentNumber'>): Promise<UserRegistrationDto> {
    const user = await this.prismaService.user
      .update({
        where: { studentNumber, deletedAt: null },
        data: {
          isBbunRegistered: false,
          deletedAt: new Date(),
          insta_ID: null,
          department: null,
          MBTI: null,
          profileImage: null,
          description: null,
        },
      })
      .catch((err) => {
        if (err instanceof PrismaClientKnownRequestError) {
          if (err.code === 'P2025') {
            this.logger.error('deleteAccount Error');
            this.logger.debug('user not found');
            throw new NotFoundException();
          }
          this.logger.error('deleteAccount Error');
          this.logger.debug(err);
          throw new InternalServerErrorException('Database Error');
        }
        this.logger.error('deleteAccount Error');
        this.logger.debug(err);
        throw new InternalServerErrorException('Unknown Error');
      });

    return {
      studentNumber: user.studentNumber,
      isBbunRegistered: user.isBbunRegistered,
    };
  }

  //uuid로 학생 찾기
  async findUserByUuid({ uuid }: Pick<User, 'uuid'>): Promise<User> {
    return this.prismaService.user
      .findUniqueOrThrow({
        where: { uuid },
      })
      .catch((err) => {
        if (err instanceof PrismaClientKnownRequestError) {
          if (err.code === 'P2025') {
            this.logger.error('findUserByUuid Error');
            this.logger.debug('user not found');
            throw new NotFoundException();
          }
          this.logger.error('findUserByUuid Error');
          this.logger.debug(err);
          throw new InternalServerErrorException('Database Error');
        }
        this.logger.error('findUserByUuid Error');
        this.logger.debug(err);
        throw new InternalServerErrorException('Unknown Error');
      });
  }

  //학번으로 학생 찾기
  async findUserByStudentNumber(studentNumber: string): Promise<User> {
    return this.prismaService.user
      .findUniqueOrThrow({
        where: { studentNumber },
      })
      .catch((err) => {
        if (err instanceof PrismaClientKnownRequestError) {
          if (err.code === 'P2025') {
            this.logger.error('findUserByStudentNumber Error');
            this.logger.debug('user not found');
            throw new NotFoundException();
          }
          this.logger.error('findUserByStudentNumber Error');
          this.logger.debug(err);
          throw new InternalServerErrorException('Database Error');
        }
        this.logger.error('findUserByStudentNumber Error');
        this.logger.debug(err);
        throw new InternalServerErrorException('Unknown Error');
      });
  }

  //유저의 등록 후 이메일 보낼 사람 조회
  async findUserToSendEmail(
    studentNumber: string,
  ): Promise<Pick<User, 'email'>[]> {
    const suffix = studentNumber.slice(-4);
    return this.prismaService.user
      .findMany({
        where: {
          studentNumber: {
            endsWith: suffix,
          },
          isBbunRegistered: true, //Bbunlineskate registrant only
          NOT: {
            studentNumber: studentNumber, //excluding the user himself
          },
        },
        select: { email: true },
        orderBy: {
          createdAt: 'asc',
        },
      })
      .catch((err) => {
        if (err instanceof PrismaClientKnownRequestError) {
          this.logger.error('findUserByMatchingSN Error');
          this.logger.debug(err);
          throw new InternalServerErrorException('Database Error');
        }
        this.logger.error('findUserByMatchingSN Error');
        this.logger.debug(err);
        throw new InternalServerErrorException('Unknown Error');
      });
  }

  //유저의 뻔라인 조회(자기자신을 포함할지 그러지 않을지 정할 수 있음)
  async findUserByMatchingSN(
    student_Number: string,
    includeSelf: boolean,
  ): Promise<User[]> {
    const suffix = student_Number.slice(-4);
    return this.prismaService.user
      .findMany({
        where: {
          studentNumber: {
            endsWith: suffix,
          },
          isBbunRegistered: true, //Bbunlineskate registrant only
          ...(includeSelf
            ? {}
            : {
                NOT: {
                  studentNumber: student_Number, //excluding the user himself
                },
              }),
        },
        orderBy: {
          studentNumber: 'asc',
        },
      })
      .catch((err) => {
        if (err instanceof PrismaClientKnownRequestError) {
          this.logger.error('findUserByMatchingSN Error');
          this.logger.debug(err);
          throw new InternalServerErrorException('Database Error');
        }
        this.logger.error('findUserByMatchingSN Error');
        this.logger.debug(err);
        throw new InternalServerErrorException('Unknown Error');
      });
  }

  //사용자 정보 업데이트(선택적 필드 업데이트)
  async updateUserInfo(
    studentNumber: string,
    updateData: UpdateUserDto,
  ): Promise<User> {
    return await this.prismaService.user
      .update({
        where: { studentNumber },
        data: updateData,
      })
      .catch((err) => {
        if (err instanceof PrismaClientKnownRequestError) {
          if (err.code === 'P2025') {
            this.logger.error('updateUserInfo Error');
            this.logger.debug(err);
            throw new NotFoundException(
              `User with studentNumber ${studentNumber} not found`,
            );
          }
          this.logger.error('updateUserInfo Error');
          this.logger.debug(err);
          throw new InternalServerErrorException('Database Error');
        }
        this.logger.error('updateUserInfo Error');
        this.logger.debug(err);
        throw new InternalServerErrorException('Unknown Error');
      });
  }

  //등록 상태 변경(isBbunRegistered)
  async updateIsBbunRegistered({
    studentNumber,
    isBbunRegistered,
  }: Pick<
    User,
    'studentNumber' | 'isBbunRegistered'
  >): Promise<UserRegistrationDto> {
    const user = await this.prismaService.user
      .update({
        where: { studentNumber },
        data: { isBbunRegistered },
      })
      .catch((err) => {
        if (err instanceof PrismaClientKnownRequestError) {
          this.logger.error('updateIsBbunRegistered Error');
          this.logger.debug(err);
          throw new InternalServerErrorException('Database Error');
        }
        this.logger.error('updateIsBbunRegistered Error');
        this.logger.debug(err);
        throw new InternalServerErrorException('Unknown Error');
      });

    return {
      studentNumber: user.studentNumber,
      isBbunRegistered: user.isBbunRegistered,
    };
  }

  //테스트용 데이터 생성(실제 데이터 아님)
  async createTempUser({
    name,
    email,
    studentNumber,
  }: CreateTempUserDto): Promise<User> {
    return this.prismaService.user
      .create({
        data: {
          uuid: uuid(),
          name,
          email,
          studentNumber,
          insta_ID: 'test',
        },
      })
      .catch((err) => {
        if (err instanceof PrismaClientKnownRequestError) {
          this.logger.error('createTempUser Error');
          this.logger.debug(err);
          throw new InternalServerErrorException('Database Error');
        }
        this.logger.error('findUserByMatchingSN Error');
        this.logger.debug(err);
        throw new InternalServerErrorException('Unknown Error');
      });
  }
}
