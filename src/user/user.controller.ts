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
  Patch,
  Delete,
  Param,
} from '@nestjs/common';
import { LoginDto } from './dto/req/login.dto';
import { Request, Response } from 'express';
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
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { LogoutDto } from './dto/req/logout.dto';
import { IdPGuard } from './guard/idp.guard';
import { GetUser } from './decorator/get-user.decorator';
import { UserInfoRes, UserRegistrationDto } from './dto/res/userInfoRes.dto';
import { GetIdPUser } from './decorator/get-idp-user.decorator';
import { UserInfo } from '@lib/infoteam-idp/types/userInfo.type';
import { UpdateUserDto } from './dto/req/updateUser.dto';
import { BbunUserResDto, BbunUserResListDto } from './dto/res/bbunUser.dto';
import { CreateTempUserDto, registerUserDto } from './dto/req/createUser.dto';

@ApiTags('user')
@ApiOAuth2(['openid', 'email', 'profile', 'student_'], 'oauth2')
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
      type: type ?? 'web',
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
  @Get('idp')
  @UseGuards(IdPGuard)
  async getUserInfoIdP(@GetIdPUser() user: UserInfo): Promise<UserInfoRes> {
    return user;
  }

  @ApiOperation({
    summary: '뻔라인스케이트 회원가입',
    description:
      'register user with selection informationwith consent for personal data provision (필수 정보는 로그인할 때 idp에서 받아와서 선택정보랑 동의 여부만 true로 바꿈)',
  })
  @ApiOkResponse({
    type: BbunUserResDto,
    description: 'register user is completed, and send email to bbunline',
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiInternalServerErrorResponse({ description: 'Internal Server Error' })
  @Post('')
  @UseGuards(IdPGuard)
  async registerUser(
    @GetUser() user: UserInfo,
    @Body() selection_info: registerUserDto,
  ): Promise<BbunUserResDto> {
    return this.userService.registerUser(user, selection_info);
  }

  @ApiOperation({
    summary: '뻔라인스케이트 회원탈퇴',
    description: 'delete Bbun user',
  })
  @ApiOkResponse({ description: 'delete user completed' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiInternalServerErrorResponse({ description: 'Internal Server Error' })
  @Delete('')
  @UseGuards(IdPGuard)
  async deleteUser(@GetUser() user: UserInfo): Promise<UserRegistrationDto> {
    return await this.userService.deleteUser(user);
  }

  @ApiOperation({
    summary: '유저 자기자신의 정보 조회',
    description: "get bbunlineskate use's own information ",
  })
  @ApiOkResponse({ type: BbunUserResDto, description: 'Return user info' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiInternalServerErrorResponse({ description: 'Internal Server Error' })
  @Get('')
  @UseGuards(IdPGuard)
  async getUserInfoBbun(@GetUser() user: UserInfo): Promise<BbunUserResDto> {
    return await this.userService.getUserInfoBbun(user);
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
    summary: '유저의 선택정보 업데이트',
    description:
      'update selection information(all information except data from IdP)',
  })
  @ApiOkResponse({ description: 'update user info and return it' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiInternalServerErrorResponse({ description: 'Internal Server Error' })
  @Patch('')
  @UseGuards(IdPGuard)
  async updateUserInfo(
    @GetUser() user: UserInfo,
    @Body() selection_info: UpdateUserDto,
  ): Promise<BbunUserResDto> {
    return this.userService.updateUserInfo(user.studentNumber, selection_info);
  }

  /*
  test 용 API들
  */

  @ApiTags('test')
  @ApiOperation({
    summary: '학번으로 유저 조회(test용)',
    description: 'get bbunlineskate user info ',
  })
  @ApiOkResponse({ type: BbunUserResDto, description: 'Return user info' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiInternalServerErrorResponse({ description: 'Internal Server Error' })
  @Get('test/:studentNumber')
  @UseGuards(IdPGuard)
  async getUserInfoByStudentNumber(
    @Param('studentNumber') studentNumber: string,
  ): Promise<BbunUserResDto> {
    return await this.userService.findUserByStudentNumber(studentNumber);
  }

  @ApiTags('test')
  @ApiOperation({
    summary: '유저 생성(테스트용)',
    description:
      'make test user with selecting name, email, studentNumber(email과 studentNumber의 경우 중복이 있으면 안 되어서 만약 api 호출이 안 되면 정보를 바꾸어 보세요!) ',
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

  @ApiTags('test')
  @ApiOperation({
    summary: '뻔라인스케이트 회원가입(test 용)',
    description:
      'register user with selection informationwith consent for personal data provision (필수 정보는 로그인할 때 idp에서 받아와서 선택정보랑 동의 여부만 true로 바꿈) (test)',
  })
  @ApiOkResponse({
    type: BbunUserResDto,
    description: 'register Temp user is completed, and send email to bbunline',
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiInternalServerErrorResponse({ description: 'Internal Server Error' })
  @Patch('test/register:studentNumber')
  @UseGuards(IdPGuard)
  async registerTempUser(
    @Param('studentNumber') studentNumber: string,
    @Body() selection_info: registerUserDto,
  ): Promise<BbunUserResDto> {
    return this.userService.registerTempUser(studentNumber, selection_info);
  }

  @ApiTags('test')
  @ApiOperation({
    summary: '유저의 뻔라인스케이트 사용 동의 변경(test 용)',
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
}
