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
  ApiBearerAuth,
  ApiInternalServerErrorResponse,
  ApiOAuth2,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { JwtGuard } from 'src/auth/guards/jwt.guard';
import { GetUser } from 'src/auth/decorators/getUser.decorator';
import { InfoteamAccountGuard } from 'src/auth/guards/InfoteamAccount.guard';
import { GetInfoteamAccountUser } from 'src/auth/decorators/getInfoteamAccountUser.decorator';
import * as infoteamAccount from '@lib/infoteam-account';
import { Prisma } from 'generated/prisma/client';
import { UserResDto } from './dto/res/userRes.dto';
import { UpdateDataDto } from './dto/req/updateData.dto';

@ApiTags('user')
@Controller('user')
@UsePipes(ValidationPipe)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @ApiOperation({
    summary: '뻔라인스케이트 회원가입',
    description: 'register Bbun user',
  })
  @ApiOAuth2(['email', 'profile', 'openid'], 'oauth2')
  @ApiOkResponse({ description: 'user registration completed' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiInternalServerErrorResponse({ description: 'Internal Server Error' })
  @Post('')
  @UseGuards(InfoteamAccountGuard)
  async registerUser(
    @GetInfoteamAccountUser() user: infoteamAccount.IdTokenPayloadType,
  ): Promise<void> {
    return await this.userService.registerUser(user);
  }

  @ApiOperation({
    summary: '유저 자기자신의 정보 조회',
    description: "get bbunlineskate user's own information ",
  })
  @ApiBearerAuth('jwt')
  @ApiOkResponse({ type: UserResDto, description: 'Return user info' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiInternalServerErrorResponse({ description: 'Internal Server Error' })
  @Get('')
  @UseGuards(JwtGuard)
  getUserInfoBbun(@GetUser() user: Prisma.UserModel): UserResDto {
    return user;
  }

  @ApiOperation({
    summary: '유저의 선택정보 업데이트',
    description:
      'update selection information(all information except data from IdP)',
  })
  @ApiBearerAuth('jwt')
  @ApiOkResponse({
    type: UserResDto,
    description: 'update user info and return it',
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiInternalServerErrorResponse({ description: 'Internal Server Error' })
  @Patch('')
  @UseGuards(JwtGuard)
  async updateUserInfo(
    @GetUser() user: Prisma.UserModel,
    @Body() selection_info: UpdateDataDto,
  ): Promise<UserResDto> {
    return this.userService.updateUserInfo(user.uuid, selection_info);
  }

  @ApiOperation({
    summary: '뻔라인스케이트 회원탈퇴',
    description: 'delete Bbun user',
  })
  @ApiBearerAuth('jwt')
  @ApiOkResponse({ description: 'delete user completed' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiInternalServerErrorResponse({ description: 'Internal Server Error' })
  @Delete('')
  @UseGuards(JwtGuard)
  async deleteUser(@GetUser() user: Prisma.UserModel): Promise<void> {
    return await this.userService.deleteUser(user);
  }
}
