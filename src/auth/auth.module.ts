import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AuthRepository } from './auth.repository';
import { PrismaModule } from '@lib/prisma';
import { CustomConfigModule, CustomConfigService } from '@lib/custom-config';
import { InfoteamAccountModule } from '@lib/infoteam-account';
import { InfoteamAccountStrategy } from './guards/InfoteamAccount.strategy';
import { InfoteamAccountGuard } from './guards/InfoteamAccount.guard';
import { RedisModule } from '@lib/redis';
import { JwtModule } from '@nestjs/jwt';
import ms, { StringValue } from 'ms';
import { JwtStrategy } from './guards/jwt.strategy';
import { JwtGuard } from './guards/jwt.guard';

@Module({
  imports: [
    PrismaModule,
    CustomConfigModule,
    InfoteamAccountModule,
    RedisModule,
    JwtModule.registerAsync({
      imports: [CustomConfigModule],
      inject: [CustomConfigService],
      useFactory: (customConfigService: CustomConfigService) => ({
        secret: customConfigService.JWT_SECRET,
        signOptions: {
          expiresIn: ms(customConfigService.JWT_EXPIRE as StringValue) / 1000,
          algorithm: 'HS256',
          audience: customConfigService.JWT_AUDIENCE,
          issuer: customConfigService.JWT_ISSUER,
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    AuthRepository,
    InfoteamAccountStrategy,
    InfoteamAccountGuard,
    JwtStrategy,
    JwtGuard,
  ],
  exports: [InfoteamAccountGuard, JwtGuard],
})
export class AuthModule {}
