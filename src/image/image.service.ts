import { Loggable } from '@lib/logger';
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import sharp, { FormatEnum } from 'sharp';
import { ImageRepository } from './image.repository';

@Injectable()
@Loggable()
export class ImageService {
  private readonly logger = new Logger(ImageService.name);
  constructor(private readonly imageRepository: ImageRepository) {}

  /**
   * 프로필 이미지 업로드 (WebP 변환 후 저장)
   * @param uuid 사용자 UUID
   * @param file 업로드된 파일
   */
  async uploadProfileImage(uuid: string, file: Express.Multer.File) {
    if (!file) {
      throw new NotFoundException('파일이 제공되지 않았습니다.');
    }
    const webpImage = await this.convertToWebP(file.buffer);
    await this.imageRepository.saveProfileImage(uuid, webpImage);
  }

  /**
   * WebP 프로필 이미지 조회
   * @param uuid 사용자 UUID
   * @returns WebP 이미지 버퍼
   */
  async getProfileImageWithWebp(uuid: string): Promise<string> {
    const profileImage = await this.imageRepository.getProfileImage(uuid);
    if (!profileImage) {
      throw new NotFoundException('프로필 이미지가 존재하지 않습니다.');
    }
    return Buffer.from(profileImage).toString('base64');
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
  async convertToWebP(imagebuffer: Buffer): Promise<Buffer> {
    return await sharp(imagebuffer)
      .webp({ quality: 80 }) // 품질 80 설정
      .toBuffer();
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

  // //특정 사용자의 프로필 사진 조회
  // async getProfileImage(uuid: string): Promise<string> {
  //   const image = await this.userRepository.getProfileImage(uuid);

  //   if (!image) {
  //     throw new NotFoundException("There's no profile pictures");
  //   }

  //   return image;
  // }
}
