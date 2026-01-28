import {
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { User } from '@prisma/client';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { PrismaService } from '@lib/prisma';
import { Loggable } from '@lib/logger/decorator/loggable';
import { registerUserDto } from 'src/user/dto/req/createUser.dto';

@Injectable()
@Loggable()
export class AuthRepository {
  private readonly logger = new Logger(AuthRepository.name);
  constructor(private readonly prismaService: PrismaService) {}

  // User를 찾고 없으면 생성(기본값) - 로그인 시 이루어지는 작업
  async findUserOrCreate({
    uuid,
    name,
    email,
    studentNumber,
  }: Pick<User, 'uuid' | 'name' | 'email' | 'studentNumber'>): Promise<User> {
    return await this.prismaService.user
      .upsert({
        where: { uuid },
        create: {
          uuid,
          name,
          email,
          studentNumber,
        },
        update: {
          name,
          email,
        },
      })
      .catch((err) => {
        this.logger.debug(err);
        if (err instanceof PrismaClientKnownRequestError) {
          this.logger.error('findUserOrCreate Prisma error');
          throw new InternalServerErrorException('Database Error');
        }
        this.logger.error('findUserOrCreate error');
        throw new InternalServerErrorException('Unknown Error');
      });
  }

  //uuid로 user 찾기, error 관련 코드 수정하는 게 좋을 듯
  async findUserByUuid(uuid: string): Promise<User> {
    return await this.prismaService.user
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
}
