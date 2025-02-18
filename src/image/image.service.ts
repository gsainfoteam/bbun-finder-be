import { Loggable } from '@lib/logger';
import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import sharp, { FormatEnum } from 'sharp';
import { ImageRepository } from './image.repository';

@Injectable()
@Loggable()
export class ImageService {
  private readonly logger = new Logger(ImageService.name);
  constructor(private readonly imageRepository: ImageRepository) {}

  /**
   * 프로필 이미지 업로드 (WebP로 받은 사진파일을 저장)
   * @param uuid 사용자 UUID
   * @param file 업로드된 파일
   */
  async uploadProfileWebpImage(uuid: string, file: Express.Multer.File) {
    if (!file) {
      throw new NotFoundException("There's no file");
    }
    if (!['image/webp'].includes(file.mimetype)) {
      throw new BadRequestException('Only WebP formats are supported');
    }
    await this.imageRepository.saveProfileImage(uuid, file.buffer);
  }

  /**
   * 프로필 이미지 업로드 (받은 사진파일을 WebP 변환 후 저장)
   * @param uuid 사용자 UUID
   * @param file 업로드된 파일
   */
  async uploadProfileImage(uuid: string, file: Express.Multer.File) {
    if (!file) {
      throw new NotFoundException("There's no file");
    }
    const webpImage = await this.convertToWebP(file);
    await this.imageRepository.saveProfileImage(uuid, webpImage);
  }

  /**
   * WebP 프로필 이미지 조회(webp -> base64)
   * @param uuid 사용자 UUID
   * @returns WebP 이미지 버퍼
   */
  async getProfileWebImageToBase64(uuid: string): Promise<string> {
    const profileImage = await this.imageRepository.getProfileImage(uuid);
    if (!profileImage) {
      throw new NotFoundException('프로필 이미지가 존재하지 않습니다.');
    }
    return Buffer.from(profileImage).toString('base64');
  }

  /**
   * WebP 프로필 이미지 조회(webp)
   * @param uuid 사용자 UUID
   * @returns WebP 이미지 버퍼
   */
  async getProfileWebpImage(uuid: string): Promise<Buffer> {
    const profileImage = await this.imageRepository.getProfileImage(uuid);
    if (!profileImage) {
      throw new NotFoundException('프로필 이미지가 존재하지 않습니다.');
    }
    return Buffer.from(profileImage);
  }

  /**
   * 원본 프로필 이미지 복원
   * @param userUuid 사용자 uuid
   * @param format 변환할 포맷 ('jpeg', 'png' 등)
   * @returns 변환된 이미지 버퍼
   */
  async getOriginalProfileImage(
    userUuid: string,
    format: string,
  ): Promise<Buffer> {
    const webpImage = await this.imageRepository.getProfileImage(userUuid);
    if (!webpImage) {
      throw new NotFoundException('프로필 이미지가 존재하지 않습니다.');
    }

    return await this.convertFromWebP(webpImage, format);
  }

  async deleteProfileImage(uuid: string): Promise<{ message: string }> {
    return this.imageRepository.deleteProfileImage(uuid);
  }

  /**
   * 이미지를 WebP로 변환 및 압축하는 함수
   * @param buffer 원본 이미지 버퍼
   * @returns 변환된 WebP 이미지 버퍼
   */
  async convertToWebP(file: Express.Multer.File): Promise<Buffer> {
    if (
      !['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(
        file.mimetype,
      )
    ) {
      throw new BadRequestException(
        'Only JPEG, PNG, and WebP formats are supported',
      );
    }
    return await sharp(file.buffer)
      .webp({ quality: 10 }) // 품질 10/100 설정
      .toBuffer()
      .catch((err) => {
        this.logger.error('convertToWebP Error');
        this.logger.debug(err);
        throw new BadRequestException('Error converting image to Webp');
      });
  }

  /**
   * WebP 이미지를 원래 포맷으로 변환
   * @param buffer WebP 이미지 버퍼
   * @param format 변환할 이미지 포맷 (예: 'jpeg', 'png')
   * @returns 변환된 이미지 버퍼
   */
  async convertFromWebP(buffer: Buffer, format: string): Promise<Buffer> {
    if (!Object.keys(sharp.format).includes(format)) {
      throw new Error(`Unsupported format: ${format}`);
    }
    return await sharp(buffer)
      .toFormat(format as keyof FormatEnum)
      .toBuffer();
  }
}
