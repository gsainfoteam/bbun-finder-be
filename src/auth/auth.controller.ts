import {
  Controller,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
  UsePipes,
  ValidationPipe,
  Patch,
  Body,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { JwtToken } from './dto/res/jwtToken.dto';
import { AuthService } from './auth.service';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiInternalServerErrorResponse,
  ApiOAuth2,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { JwtGuard } from './guard/jwt.guard';
import ms, { StringValue } from 'ms';
import { CustomConfigService } from '@lib/custom-config';
import { BbunUserResDto } from 'src/user/dto/res/bbunUser.dto';
import { UserInfo } from '@lib/infoteam-idp/types/userInfo.type';
import { registerUserDto } from 'src/user/dto/req/createUser.dto';
import { GetUser } from 'src/user/decorator/get-user.decorator';

@ApiTags('auth')
@Controller('auth')
@UsePipes(ValidationPipe)
export class AuthController {
  private readonly refreshTokenExpire: number;
  constructor(
    private readonly authService: AuthService,
    private readonly customConfigService: CustomConfigService,
  ) {
    this.refreshTokenExpire = ms(
      customConfigService.REFRESH_TOKEN_EXPIRE as StringValue,
    );
  }

  @ApiOperation({
    summary: 'Login',
    description: 'Issue JWT token(bbunline) for user',
  })
  @ApiOkResponse({ description: 'Return jwt token' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiInternalServerErrorResponse({ description: 'Internal Server Error' })
  @ApiOAuth2(['email', 'profile', 'openid'], 'oauth2')
  @Post('login')
  async login(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<JwtToken> {
    const auth = req.headers['authorization'];
    if (!auth) throw new UnauthorizedException();

    const { access_token, refresh_token, consent_required } =
      await this.authService.login(auth);
    res.cookie('refresh_token', refresh_token, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      expires: new Date(Date.now() + this.refreshTokenExpire),
      path: '/auth',
    });
    return { access_token, consent_required };
  }

  @ApiOperation({
    summary: 'Refresh token',
    description: 'Refresh the access token from idp',
  })
  @ApiCreatedResponse({ type: JwtToken, description: 'Return jwt token' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiInternalServerErrorResponse({ description: 'Internal Server Error' })
  @Post('refresh')
  async refreshToken(@Req() req: Request): Promise<JwtToken> {
    const refreshToken = req.cookies['refresh_token'];
    if (!refreshToken) throw new UnauthorizedException();
    const { access_token, consent_required } =
      await this.authService.refresh(refreshToken);
    return { access_token, consent_required };
  }

  @ApiOperation({
    summary: 'Logout',
    description: 'Logout the user from the cookie and idp',
  })
  @ApiCreatedResponse({ description: 'Return jwt token' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiInternalServerErrorResponse({ description: 'Internal Server Error' })
  @ApiBearerAuth('jwt')
  @Post('logout')
  @UseGuards(JwtGuard)
  async logout(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<void> {
    const refreshToken = req.cookies['refresh_token'];
    res.clearCookie('refresh_token');
    return this.authService.logout(refreshToken);
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
  @Patch('register')
  @UseGuards(JwtGuard)
  async registerUser(
    @GetUser() user: UserInfo,
    @Body() selection_info: registerUserDto,
  ): Promise<BbunUserResDto> {
    return this.authService.registerUser(user, selection_info);
  }
}
