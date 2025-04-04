import {
  Controller,
  Delete,
  Get,
  NotFoundException,
  Patch,
  Post,
  Res,
  StreamableFile,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import {
  ApiBody,
  ApiConsumes,
  ApiInternalServerErrorResponse,
  ApiOAuth2,
  ApiOkResponse,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { ImageService } from './image.service';
import { IdPGuard } from 'src/user/guard/idp.guard';
import { FileInterceptor } from '@nestjs/platform-express';
import { GetUser } from 'src/user/decorator/get-user.decorator';
import { UserInfo } from '@lib/infoteam-idp/types/userInfo.type';
import { Response } from 'express';

@ApiTags('image')
@ApiOAuth2(['openid', 'email', 'profile', 'student_'], 'oauth2')
@Controller('user/image')
@UsePipes(ValidationPipe)
export class ImageController {
  constructor(private readonly imageService: ImageService) {}

  @ApiOperation({
    summary: ' 프로필 이미지 업로드(Webp, 10MB로 제한)',
    description: 'upload profileImage to store as Webp format',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    required: true,
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiOkResponse({ description: 'upload profileimage complete' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiInternalServerErrorResponse({ description: 'Internal Server Error' })
  @Patch('')
  @UseGuards(IdPGuard)
  @UseInterceptors(
    FileInterceptor('file', { limits: { fileSize: 10 * 1024 * 1024 } }),
  ) // 10MB 제한
  async uploadImagewithWebp(
    @GetUser() user: UserInfo,
    @UploadedFile() file: Express.Multer.File,
  ) {
    await this.imageService.uploadProfileWebpImage(user.uuid, file);
    return { message: 'Profile image uploaded successfully' };
  }

  @ApiOperation({
    summary: '프로필 이미지 가져오기 (Webp)',
    description: 'Returns the profile image in WebP format ',
  })
  @ApiOkResponse({
    description: 'Profile image retrieved successfully',
    content: {
      'image/webp': {
        schema: {
          type: 'string',
          format: 'binrary',
        },
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiInternalServerErrorResponse({ description: 'Internal Server Error' })
  @Get('')
  @UseGuards(IdPGuard)
  async getProfileWebpImage(
    @GetUser() user: UserInfo,
  ): Promise<StreamableFile> {
    const webpBuffer = await this.imageService.getProfileWebpImage(user.uuid);
    const safeFileName = encodeURIComponent(user.name).replace(/%20/g, '_');
    const fileName = `${safeFileName}.webp`;

    return new StreamableFile(webpBuffer, {
      type: 'image/webp',
      disposition: `inline; filename="${fileName}"`,
    });
  }

  @ApiOperation({
    summary: '프로필 이미지 삭제',
    description: 'Delete profile image(change to null)',
  })
  @ApiOkResponse({ description: 'Delete profileImage complete' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiInternalServerErrorResponse({ description: 'Internal Server Error' })
  @Delete('')
  @UseGuards(IdPGuard)
  async deleteProfileImage(
    @GetUser() user: UserInfo,
  ): Promise<{ message: string }> {
    return this.imageService.deleteProfileImage(user.uuid);
  }

  @ApiOperation({
    summary: '프로필 이미지 가져오기(webp & base64 encoding)',
    description: 'Get profileImage with .webp & base64 encoding string',
  })
  @ApiOkResponse({ description: 'Get profileImage complete' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiInternalServerErrorResponse({ description: 'Internal Server Error' })
  @Get('base64')
  @UseGuards(IdPGuard)
  async getProfileWebpImageToBase64(@GetUser() user: UserInfo) {
    return await this.imageService.getProfileWebImageToBase64(user.uuid);
  }

  @ApiOperation({
    summary: '프로필 이미지 업로드(사진파일 채로 받기, 10MB로 제한)',
    description: 'upload profileImage to convert with Base64',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    required: true,
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Profile image uploaded successfully',
  })
  @ApiOkResponse({ description: 'upload profileimage complete' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiInternalServerErrorResponse({ description: 'Internal Server Error' })
  @Patch('original')
  @UseGuards(IdPGuard)
  @UseInterceptors(
    FileInterceptor('file', { limits: { fileSize: 10 * 1024 * 1024 } }),
  ) // 10MB 제한
  async uploadImagewithOriginal(
    @GetUser() user: UserInfo,
    @UploadedFile() file: Express.Multer.File,
  ) {
    await this.imageService.uploadProfileImage(user.uuid, file);
    return { message: 'Profile image uploaded successfully' };
  }

  @ApiOperation({
    summary: '프로필 이미지 가져오기(사진 파일 통째로 보기)',
    description: 'Get profileImage with .png/.jpeg/.jpg ',
  })
  @ApiOkResponse({
    description: 'Profile image retrieved successfully',
    content: {
      'image/webp': {
        schema: {
          type: 'string',
          format: 'binrary',
        },
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiInternalServerErrorResponse({ description: 'Internal Server Error' })
  @Get('original')
  @UseGuards(IdPGuard)
  async getProfileImage(@GetUser() user: UserInfo) {
    return this.imageService.getOriginalProfileImage(user.uuid, 'png');
  }

  @ApiTags('test')
  @ApiOperation({
    summary: 'Convert Image to WebP',
    description: 'Uploads an image and converts it to WebP format',
  })
  @ApiConsumes('multipart/form-data') // 파일 업로드 지원
  @ApiBody({
    required: true,
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'WebP image returned successfully',
    content: {
      'image/webp': {
        schema: {
          type: 'string',
          format: 'binrary',
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid file format or size' })
  @ApiResponse({ status: 404, description: 'No file provided' })
  @Post('covert-image')
  @UseInterceptors(
    FileInterceptor('file', { limits: { fileSize: 5 * 1024 * 1024 } }),
  ) // 5MB로 제한
  async convertImage(
    @UploadedFile() file: Express.Multer.File,
    @Res() res: Response,
  ) {
    if (!file) {
      throw new NotFoundException('No file provided');
    }

    const webpBuffer = await this.imageService.convertToWebP(file);

    //변환된 이미지 반환
    res.setHeader('Content-Type', 'image/webp');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="coverted.webp"`,
    );
    res.send(webpBuffer);
  }
}
