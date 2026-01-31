import {
  Controller,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import express from 'express';
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
import ms, { StringValue } from 'ms';
import { CustomConfigService } from '@lib/custom-config';
import { InfoteamAccountGuard } from './guards/InfoteamAccount.guard';
import { GetInfoteamAccountUser } from './decorators/getInfoteamAccountUser.decorator';
import * as infoteamAccount from '@lib/infoteam-account';
import { JwtGuard } from './guards/jwt.guard';

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
  @ApiOAuth2(['email', 'profile', 'openid'], 'oauth2')
  @ApiOkResponse({ description: 'Return jwt token' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiInternalServerErrorResponse({ description: 'Internal Server Error' })
  @Post('login')
  @UseGuards(InfoteamAccountGuard)
  async login(
    @GetInfoteamAccountUser() user: infoteamAccount.IdTokenPayloadType,
    @Res({ passthrough: true }) res: express.Response,
  ): Promise<JwtToken> {
    const { access_token, refresh_token, consent_required } =
      await this.authService.login(user);
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
  @ApiBearerAuth('jwt')
  @ApiCreatedResponse({ type: JwtToken, description: 'Return jwt token' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiInternalServerErrorResponse({ description: 'Internal Server Error' })
  @Post('refresh')
  async refreshToken(@Req() req: express.Request): Promise<JwtToken> {
    const refreshToken = req.cookies['refresh_token'] as string | undefined;
    if (!refreshToken) throw new UnauthorizedException();
    const { access_token, consent_required } =
      await this.authService.refresh(refreshToken);
    return { access_token, consent_required };
  }

  @ApiOperation({
    summary: 'Logout',
    description: 'Logout the user from the cookie and idp',
  })
  @ApiBearerAuth('jwt')
  @ApiCreatedResponse({ description: 'Return jwt token' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiInternalServerErrorResponse({ description: 'Internal Server Error' })
  @ApiBearerAuth('jwt')
  @Post('logout')
  @UseGuards(JwtGuard)
  async logout(
    @Req() req: express.Request,
    @Res({ passthrough: true }) res: express.Response,
  ): Promise<void> {
    const refreshToken = req.cookies['refresh_token'] as string;
    res.clearCookie('refresh_token');
    return this.authService.logout(refreshToken);
  }
}
