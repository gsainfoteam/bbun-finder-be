import { Loggable } from '@lib/logger';
import { PrismaService } from '@lib/prisma';
import {
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { User } from '@prisma/client';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

@Injectable()
@Loggable()
export class ImageRepository {
  private readonly logger = new Logger(ImageRepository.name);
  constructor(private readonly prismaService: PrismaService) {}

  /**
   * 사용자 프로필 이미지를 webp로 저장
   * @param userUuid 사용자 UUID
   * @param imageBuffer 이미지 버퍼 데이터
   */
  async saveProfileImage(userUuid: string, imageBuffer: Buffer): Promise<User> {
    return await this.prismaService.user
      .update({
        where: { uuid: userUuid },
        data: { profileImage: imageBuffer },
      })
      .catch((err) => {
        if (err instanceof PrismaClientKnownRequestError) {
          if (err.code === 'P2025') {
            this.logger.error('saveProfileImage Error');
            this.logger.debug(err);
            throw new NotFoundException('user not found');
          }
          this.logger.error('saveProfileImage Error');
          this.logger.debug(err);
          throw new InternalServerErrorException('Database Error');
        }
        this.logger.error('saveProfileImage Error');
        this.logger.debug(err);
        throw new InternalServerErrorException('Unknown Error');
      });
  }

  /**
   * 사용자 프로필 이미지 조회
   * @param userUuid 사용자 UUID
   * @returns 프로필 이미지 버퍼
   */
  async getProfileImage(userUuid: string): Promise<Buffer> {
    const user = await this.prismaService.user
      .findUnique({
        where: { uuid: userUuid },
        select: { profileImage: true },
      })
      .catch((err) => {
        if (err instanceof PrismaClientKnownRequestError) {
          if (err.code === 'P2025') {
            this.logger.error('getProfileImage Error');
            this.logger.debug(err);
            throw new NotFoundException('user not found');
          }
          this.logger.error('getProfileImage Error');
          this.logger.debug(err);
          throw new InternalServerErrorException('Database Error');
        }
        this.logger.error('getProfileImage Error');
        this.logger.debug(err);
        throw new InternalServerErrorException('Unknown Error');
      });

    if (!user?.profileImage) {
      throw new NotFoundException("There's no profile image.");
    }
    return Buffer.from(user.profileImage);
  }

  async deleteProfileImage(uuid: string): Promise<{ message: string }> {
    await this.prismaService.user
      .update({
        where: { uuid },
        data: { profileImage: null },
      })
      .catch((err) => {
        if (err instanceof PrismaClientKnownRequestError) {
          if (err.code === 'P2025') {
            this.logger.error('deleteProfileImage Error');
            this.logger.debug(err);
            throw new NotFoundException('user not found');
          }
          this.logger.error('deleteProfileImage Error');
          this.logger.debug(err);
          throw new InternalServerErrorException('Database Error');
        }
        this.logger.error('deleteProfileImage Error');
        this.logger.debug(err);
        throw new InternalServerErrorException('Unknown Error');
      });
    return { message: 'Profile image deleted' };
  }
}
