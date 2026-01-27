import {
  Body,
  Controller,
  Get,
  Post,
  UseGuards,
  UsePipes,
  ValidationPipe,
  Patch,
  Delete,
  Param,
} from '@nestjs/common';
import { UserService } from './user.service';
import {
  ApiInternalServerErrorResponse,
  ApiOAuth2,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiBody,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { JwtGuard } from 'src/auth/guard/jwt.guard';
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
    summary: 'get user info from IdP',
    description: 'get user info from IdP',
    deprecated: true,
  })
  @ApiOkResponse({ type: UserInfoRes, description: 'Return user info' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiInternalServerErrorResponse({ description: 'Internal Server Error' })
  @Get('idp')
  @UseGuards(JwtGuard)
  async getUserInfoIdP(@GetIdPUser() user: UserInfo): Promise<UserInfoRes> {
    return user;
  }

  @ApiOperation({
    summary: '뻔라인스케이트 회원탈퇴',
    description: 'delete Bbun user',
  })
  @ApiOkResponse({ description: 'delete user completed' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiInternalServerErrorResponse({ description: 'Internal Server Error' })
  @Delete('')
  @UseGuards(JwtGuard)
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
  @UseGuards(JwtGuard)
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
  @UseGuards(JwtGuard)
  async findBbunUserWithStudentNumber(
    @GetUser() user: UserInfo,
  ): Promise<BbunUserResListDto> {
    return await this.userService.findUserByMatchingSN(user.studentNumber);
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
  @UseGuards(JwtGuard)
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
  @UseGuards(JwtGuard)
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
  @UseGuards(JwtGuard)
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
  @UseGuards(JwtGuard)
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
  @UseGuards(JwtGuard)
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
