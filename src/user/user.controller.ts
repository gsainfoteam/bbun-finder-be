import {
  Body,
  Controller,
  Get,
  UseGuards,
  UsePipes,
  ValidationPipe,
  Patch,
  Delete,
  Post,
} from '@nestjs/common';
import { UserService } from './user.service';
import {
  ApiInternalServerErrorResponse,
  ApiOAuth2,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { UserRegistrationDto } from './dto/res/userInfoRes.dto';
import { UpdateUserDto } from './dto/req/updateUser.dto';
import { BbunUserResDto, BbunUserResListDto } from './dto/res/bbunUser.dto';

@ApiTags('user')
@ApiOAuth2(['openid', 'email', 'profile', 'student_'], 'oauth2')
@Controller('user')
@UsePipes(ValidationPipe)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @ApiOperation({
    summary: '뻔라인스케이트 회원가입',
    description: 'register Bbun user',
  })
  @ApiOkResponse({ description: 'user registration completed' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiInternalServerErrorResponse({ description: 'Internal Server Error' })
  @Post('')
  async registerUser(): Promise<UserRegistrationDto> {
    return await this.userService.registerUser();
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
}
