import {
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '@lib/prisma';
import { Loggable } from '@lib/logger/decorator/loggable';
import { Prisma } from 'generated/prisma/client';

@Injectable()
@Loggable()
export class AuthRepository {
  private readonly logger = new Logger(AuthRepository.name);
  constructor(private readonly prismaService: PrismaService) {}

  async findExistUserByUuid(uuid: string): Promise<Prisma.UserModel> {
    return await this.prismaService.user
      .findUniqueOrThrow({
        where: { uuid, deletedAt: null },
      })
      .catch((err) => {
        if (err instanceof Prisma.PrismaClientKnownRequestError) {
          if (err.code === 'P2025') {
            this.logger.error('findExistUserByUuid Error');
            this.logger.debug('user not found');
            throw new NotFoundException();
          }
          this.logger.error('findExistUserByUuid Error');
          this.logger.debug(err);
          throw new InternalServerErrorException('Database Error');
        }
        this.logger.error('findExistUserByUuid Error');
        this.logger.debug(err);
        throw new InternalServerErrorException('Unknown Error');
      });
  }

  async updateUserBasicInfo(
    uuid: string,
    {
      name,
      studentNumber,
      email,
      profileImageUrl,
    }: Pick<
      Prisma.UserModel,
      'name' | 'studentNumber' | 'email' | 'profileImageUrl'
    >,
  ): Promise<Prisma.UserModel> {
    return this.prismaService.user.update({
      where: { uuid, deletedAt: null },
      data: {
        name,
        studentNumber,
        email,
        profileImageUrl,
      },
    });
  }
}
