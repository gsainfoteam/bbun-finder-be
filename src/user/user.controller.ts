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
  Patch,
  Delete,
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
  ApiBody,
  ApiConsumes,
  ApiResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { LogoutDto } from './dto/req/logout.dto';
import { IdPGuard } from './guard/idp.guard';
import { GetUser } from './decorator/get-user.decorator';
import { UserInfoRes, UserRegistrationDto } from './dto/res/userInfoRes.dto';
import { GetIdPUser } from './decorator/get-idp-user.decorator';
import { UserInfo } from '@lib/infoteam-idp/types/userInfo.type';
import { FileInterceptor } from '@nestjs/platform-express';
import { UpdateUserDto } from './dto/req/updateUser.dto';
import { BbunUserResDto, BbunUserResListDto } from './dto/res/bbunUser.dto';
import { ImageService } from 'src/image/image.service';
import { CreateTempUserDto } from './dto/req/createUser.dto';

@ApiTags('user')
@ApiOAuth2(['openid', 'email', 'profile', 'student_'], 'oauth2')
@Controller('user')
@UsePipes(ValidationPipe)
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly imageService: ImageService,
  ) {}

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
    summary: 'get user info from IdP',
    description: 'get user info from IdP',
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
    summary: '유저의 뻔라인 조회',
    description:
      'get users with the same last four digits of their student ID(including the user himself)',
  })
  @ApiOkResponse({ type: BbunUserResDto, description: 'Return users info' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiInternalServerErrorResponse({ description: 'Internal Server Error' })
  @Get('bbunline')
  @UseGuards(IdPGuard)
  async findBbunUserWithStudentNumber(
    @GetUser() user: UserInfo,
  ): Promise<BbunUserResListDto> {
    return {
      list: await this.userService.findUserByMatchingSN(user.studentNumber),
    };
  }

  @ApiOperation({
    summary: '테스트용 유저 생성',
    description: 'make test user with selecting name, ',
  })
  @ApiOkResponse({
    type: BbunUserResDto,
    description: 'Return users info that we made',
  })
  @ApiInternalServerErrorResponse({ description: 'Internal Server Error' })
  @Post('test')
  @UseGuards(IdPGuard)
  async createTempUser(
    @Body() createTempUserDto: CreateTempUserDto,
  ): Promise<BbunUserResDto> {
    return await this.userService.createTempUser(createTempUserDto);
  }

  @ApiOperation({
    summary: '유저의 선택정보와 동의 여부 업데이트',
    description:
      'update selection information and registration state(all information except data from IdP)',
  })
  @ApiOkResponse({ description: 'update user info and return it' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiInternalServerErrorResponse({ description: 'Internal Server Error' })
  @Patch('profile')
  @UseGuards(IdPGuard)
  async updateUserInfo(
    @GetUser() user: UserInfo,
    @Body() selection_info: UpdateUserDto,
  ): Promise<BbunUserResDto> {
    return this.userService.updateUserInfo(user.studentNumber, selection_info);
  }

  @ApiOperation({
    summary: '유저의 뻔라인스케이트 사용 동의 변경',
    description: 'update user isBbunRegistered',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        isBbunRegistered: {
          type: 'boolean',
          example: true, // Swagger에서 기본적으로 true가 보이도록 설정
          description: '뻔라인스케이트 사용 동의 여부 (true 또는 false)',
        },
      },
    },
  })
  @ApiOkResponse({ description: 'update user isRegistered' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiInternalServerErrorResponse({ description: 'Internal Server Error' })
  @Patch('profile/register')
  @UseGuards(IdPGuard)
  async updateIsBbunRegistered(
    @GetUser() user: UserInfo,
    @Body('isBbunRegistered') isBbunRegistered: boolean,
  ): Promise<UserRegistrationDto> {
    return await this.userService.updateIsBbunRegistered({
      studentNumber: user.studentNumber,
      isBbunRegistered: isBbunRegistered,
    });
  }

  @ApiOperation({
    summary: '프로필 이미지 업로드',
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
  @Patch('profile/image')
  @UseGuards(IdPGuard)
  @UseInterceptors(FileInterceptor('file'))
  async uploadImage(
    @GetUser() user: UserInfo,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new NotFoundException("There's no file");
    }
    await this.imageService.uploadProfileImage(user.uuid, file);
    return { message: 'Profile image uploaded successfully' };
  }

  @ApiOperation({
    summary: '프로필 이미지 가져오기(webp & base64 encoding)',
    description: 'Get profileImage with .webp & base64 encoding string',
  })
  @ApiOkResponse({ description: 'Get profileImage complete' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiInternalServerErrorResponse({ description: 'Internal Server Error' })
  @Get('profile/image')
  @UseGuards(IdPGuard)
  async getProfileImageWithWebp(@GetUser() user: UserInfo) {
    return this.imageService.getProfileImageWithWebp(user.uuid);
  }

  @ApiOperation({
    summary: '프로필 이미지 가져오기(original)',
    description: 'Get profileImage with .png/.jpeg/.jpg ',
  })
  @ApiOkResponse({ description: 'Profile image retrieved successfully' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiInternalServerErrorResponse({ description: 'Internal Server Error' })
  @Get('profile/image/original')
  @UseGuards(IdPGuard)
  async getProfileImage(@GetUser() user: UserInfo) {
    return this.imageService.getOriginalProfileImage(user.uuid, 'png');
  }

  @ApiOperation({
    summary: '프로필 이미지 삭제',
    description: 'Delete profile image(change to null)',
  })
  @ApiOkResponse({ description: 'Delete profileImage complete' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiInternalServerErrorResponse({ description: 'Internal Server Error' })
  @Delete('profile/image')
  @UseGuards(IdPGuard)
  async deleteProfileImage(
    @GetUser() user: UserInfo,
  ): Promise<{ message: string }> {
    return this.imageService.deleteProfileImage(user.uuid);
  }
}
