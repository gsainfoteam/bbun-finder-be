import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '@lib/prisma';
import { Loggable } from '@lib/logger/decorator/loggable';
import { IdTokenPayloadType } from '@lib/infoteam-account';
import { Prisma } from 'generated/prisma/client';
import { UpdateDataDto } from './dto/req/updateData.dto';

@Injectable()
@Loggable()
export class UserRepository {
  private readonly logger = new Logger(UserRepository.name);
  constructor(private readonly prismaService: PrismaService) {}

  //뻔라인 조회
  async findUserByMatchingSN(
    student_Number: string,
    includeSelf: boolean,
  ): Promise<Prisma.UserModel[]> {
    const suffix = student_Number.slice(-4);
    return this.prismaService.user
      .findMany({
        where: {
          studentNumber: {
            endsWith: suffix,
          },
          consent: true, //Bbunlineskate registrant only
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
        if (err instanceof Prisma.PrismaClientKnownRequestError) {
          this.logger.error('findUserByMatchingSN Error');
          this.logger.debug(err);
          throw new InternalServerErrorException('Database Error');
        }
        this.logger.error('findUserByMatchingSN Error');
        this.logger.debug(err);
        throw new InternalServerErrorException('Unknown Error');
      });
  }
  // 서비스 회원가입
  async createUser({
    sub,
    picture,
    name,
    email,
    student_id,
  }: IdTokenPayloadType): Promise<Prisma.UserModel> {
    // soft delete 된 유저가 다시 가입하는 경우 복구 처리
    const user = await this.prismaService.user.findUnique({
      where: { uuid: sub },
    });
    if (user) {
      return this.prismaService.user.update({
        where: { uuid: sub },
        data: {
          deletedAt: null,
          consent: true,
          profileImageUrl: picture,
          name,
          email,
          studentNumber: student_id,
        },
      });
    }
    return await this.prismaService.user
      .create({
        data: {
          uuid: sub,
          profileImageUrl: picture,
          name,
          email,
          studentNumber: student_id,
          consent: true,
        },
      })
      .catch((err) => {
        if (err instanceof Prisma.PrismaClientKnownRequestError) {
          if (err.code === 'P2002') {
            this.logger.error('createUser Error');
            this.logger.debug('Unique constraint failed');
            throw new ConflictException('User already exists');
          }
          this.logger.error('createUser Error');
          this.logger.debug(err);
          throw new InternalServerErrorException('Database Error');
        }
        this.logger.error('createUser Error');
        this.logger.debug(err);
        throw new InternalServerErrorException('Unknown Error');
      });
  }

  //등록 상태 변경(isBbunRegistered), 동의/ 비동의 여부
  async updateIsBbunRegistered({
    uuid,
    consent,
  }: Pick<Prisma.UserModel, 'uuid' | 'consent'>): Promise<void> {
    await this.prismaService.user
      .update({
        where: { uuid, deletedAt: null },
        data: { consent },
      })
      .catch((err) => {
        if (err instanceof Prisma.PrismaClientKnownRequestError) {
          this.logger.error('updateIsBbunRegistered Error');
          this.logger.debug(err);
          throw new InternalServerErrorException('Database Error');
        }
        this.logger.error('updateIsBbunRegistered Error');
        this.logger.debug(err);
        throw new InternalServerErrorException('Unknown Error');
      });
  }

  //사용자 정보 업데이트(선택적 필드 업데이트)
  async updateUserInfo(
    uuid: string,
    updateData: UpdateDataDto,
  ): Promise<Prisma.UserModel> {
    return await this.prismaService.user
      .update({
        where: { uuid, deletedAt: null },
        data: updateData,
      })
      .catch((err) => {
        if (err instanceof Prisma.PrismaClientKnownRequestError) {
          if (err.code === 'P2025') {
            this.logger.error('updateUserInfo Error');
            this.logger.debug(err);
            throw new NotFoundException(`User with uuid ${uuid} not found`);
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
  async deleteUser({ uuid }: Pick<Prisma.UserModel, 'uuid'>): Promise<void> {
    await this.prismaService.user
      .update({
        where: { uuid, deletedAt: null },
        data: {
          consent: false,
          deletedAt: new Date(),
          instaId: null,
          department: null,
          MBTI: null,
          description: null,
        },
      })
      .catch((err) => {
        if (err instanceof Prisma.PrismaClientKnownRequestError) {
          if (err.code === 'P2025') {
            this.logger.error('deleteAccount Error');
            this.logger.debug(`User with uuid ${uuid} not found`);
            throw new NotFoundException(`User with uuid ${uuid} not found`);
          }
          this.logger.error('deleteAccount Error');
          this.logger.debug(err);
          throw new InternalServerErrorException('Database Error');
        }
        this.logger.error('deleteAccount Error');
        this.logger.debug(err);
        throw new InternalServerErrorException('Unknown Error');
      });
  }
}
