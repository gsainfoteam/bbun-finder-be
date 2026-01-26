import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
// import { IdPGuard, IdPOptionalGuard } from './guard/idp.guard';
// import { IdPStrategy } from './guard/idp.strategy';
// import { IdPOptionalStrategy } from './guard/idpOptional.strategy';
import { UserController } from './user.controller';
import { UserRepository } from './user.repository';
import { UserService } from './user.service';
import { PrismaModule } from '@lib/prisma';
import { InfoteamIdpModule } from '@lib/infoteam-idp';
import { LoggerModule } from '@lib/logger';
import { CustomConfigModule } from '@lib/custom-config';
import { ImageModule } from 'src/image/image.module';
import { EmailModule } from 'src/email/email.module';
import { JwtGuard, JwtOptionalGuard } from 'src/auth/guard/jwt.guard';
import { JwtStrategy } from 'src/auth/guard/jwt.strategy';
import { JwtOptionalStrategy } from 'src/auth/guard/jwtOptional.strategy';
import { AnonymousStrategy } from 'src/auth/guard/anonymous.strategy';

@Module({
  imports: [
    EmailModule,
    ImageModule,
    HttpModule,
    CustomConfigModule,
    PrismaModule,
    InfoteamIdpModule,
    LoggerModule,
  ],
  providers: [
    UserService,
    UserRepository,
    JwtGuard,
    JwtOptionalGuard,
    JwtStrategy,
    JwtOptionalStrategy,
    AnonymousStrategy,
  ],
  controllers: [UserController],
  exports: [UserService, JwtOptionalGuard, JwtGuard],
})
export class UserModule {}
