import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
  UsePipes,
  ValidationPipe,
  UseInterceptors,
  UploadedFile,
  NotFoundException,
} from '@nestjs/common';
import { LoginDto } from './dto/req/login.dto';
import { Request, Response, Express } from 'express';
import { JwtToken } from './dto/res/jwtToken.dto';
import { UserService } from './user.service';
import {
  ApiCreatedResponse,
  ApiInternalServerErrorResponse,
  ApiOAuth2,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { LogoutDto } from './dto/req/logout.dto';
import { IdPGuard } from './guard/idp.guard';
import { User } from '@prisma/client';
import { GetUser } from './decorator/get-user.decorator';
import { UserInfoRes } from './dto/res/userInfoRes.dto';
import { GetIdPUser } from './decorator/get-idp-user.decorator';
import { UserInfo } from '@lib/infoteam-idp/types/userInfo.type';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';

@ApiTags('user')
@ApiOAuth2(['email', 'profile', 'openid'], 'oauth2')
@Controller('user')
@UsePipes(ValidationPipe)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @ApiOperation({
    summary: 'Login with idp',
    description:
      'idp redirect to this endpoint with code, then this endpoint return jwt token to users',
  })
  @ApiOkResponse({ type: JwtToken, description: 'Return jwt token' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiInternalServerErrorResponse({ description: 'Internal Server Error' })
  @Get('login')
  async loginByIdP(
    @Query() { code, type }: LoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<JwtToken> {
    const { refresh_token, ...token } = await this.userService.login({
      code,
      type:
        type ??
        ((req.headers['user-agent'] as string).includes('Dart')
          ? 'flutter'
          : 'web'),
    });
    res.cookie('refresh_token', refresh_token, {
      httpOnly: true,
      sameSite: 'none',
      secure: true,
    });
    return { ...token };
  }

  @ApiOperation({
    summary: 'Refresh token',
    description: 'Refresh the access token from idp',
  })
  @ApiCreatedResponse({ type: JwtToken, description: 'Return jwt token' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiInternalServerErrorResponse({ description: 'Internal Server Error' })
  @Post('refresh')
  async refreshToken(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<JwtToken> {
    const refreshToken = req.cookies['refresh_token'];
    if (!refreshToken) throw new UnauthorizedException();
    const { refresh_token, ...token } =
      await this.userService.refresh(refreshToken);
    if (refresh_token) {
      res.cookie('refresh_token', refresh_token, {
        httpOnly: true,
        sameSite: 'none',
        secure: true,
      });
    }
    return { ...token };
  }

  @ApiOperation({
    summary: 'Logout',
    description: 'Logout the user from the cookie and idp',
  })
  @ApiCreatedResponse({ description: 'Return jwt token' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiInternalServerErrorResponse({ description: 'Internal Server Error' })
  @Post('logout')
  async logout(
    @Body() { access_token }: LogoutDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<void> {
    const refreshToken = req.cookies['refresh_token'];
    if (!refreshToken) throw new UnauthorizedException();
    res.clearCookie('refresh_token');
    return this.userService.logout(access_token, refreshToken);
  }

  @ApiOperation({
    summary: 'post consent',
    description: 'post consent to the user',
  })
  @ApiCreatedResponse({ description: 'update consent true' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiInternalServerErrorResponse({ description: 'Internal Server Error' })
  @Post('consent')
  @UseGuards(IdPGuard)
  async setConsent(@GetUser() user: User): Promise<void> {
    return this.userService.setConsent(user);
  }

  @ApiOperation({
    summary: 'get user info',
    description: 'get user info',
  })
  @ApiOkResponse({ type: UserInfoRes, description: 'Return user info' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiInternalServerErrorResponse({ description: 'Internal Server Error' })
  @Get('info')
  @UseGuards(IdPGuard)
  async getUserInfo(@GetIdPUser() user: UserInfo): Promise<UserInfoRes> {
    return user;
  }

  @ApiOperation({
    summary: 'get bbunline people',
    description: 'get users with the same last four digits of their student ID',
  })
  @ApiOkResponse({ description: 'Return users info' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiInternalServerErrorResponse({ description: 'Internal Server Error' })
  @Get('bbunline')
  @UseGuards(IdPGuard)
  async findBbunUserWithStudentNumber(
    @GetUser() user: UserInfo,
  ): Promise<User[]> {
    return this.userService.findUserByMatchingSN(user.studentNumber);
  }

  @ApiOperation({
    summary: 'upload profileImage',
    description: 'upload profileImage to convert with Base64',
  })
  @ApiOkResponse({ description: 'upload profileimage complete' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiInternalServerErrorResponse({ description: 'Internal Server Error' })
  @Post('profile/image')
  @UseGuards(IdPGuard)
  @UseInterceptors(
    FileInterceptor('profileImage', {
      storage: diskStorage({
        destination: './uploads', // 임시 저장 폴더
        filename: (req, file, cb) => {
          cb(null, `${Date.now()}${extname(file.originalname)}`);
        },
      }),
    }),
  )
  async uploadImage(
    @GetUser() user: UserInfo,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new NotFoundException("There's no file");
    }
    await this.userService.uploadProfileImage(user.uuid, file);
    return { message: 'Profile image uploaded successfully' };
  }

  @ApiOperation({
    summary: 'Get profileImage',
    description: 'Get profileImage to convert with Base64',
  })
  @ApiOkResponse({ description: 'Get profileImage complete' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiInternalServerErrorResponse({ description: 'Internal Server Error' })
  @Get('profile/image')
  @UseGuards(IdPGuard)
  async getProfileImage(@GetUser() user: UserInfo) {
    return this.userService.getProfileImage(user.uuid);
  }

  // @ApiOperation({
  //   summary: 'register bbunlineskate',
  //   description: 'register bbunlineskate with changing isBbunRegistered ',
  // })
  // @ApiOkResponse({
  //   description: 'Return registeration',
  // })
  // @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  // @ApiInternalServerErrorResponse({ description: 'Internal Server Error' })
  // @Post('bbun')
  // @UseGuards(IdPGuard)
  // async registerBbun(@GetUser() user: User, @Body() create,): Promise<void> {
  //   return this.userService.setConsent(user);
  // }
}
