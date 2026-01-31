import { CustomConfigModule } from '@lib/custom-config';
import { EmailModule } from '@lib/email';
import { PrismaModule } from '@lib/prisma';
import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { UserRepository } from './user.repository';

@Module({
  imports: [PrismaModule, EmailModule, CustomConfigModule],
  controllers: [UserController],
  providers: [UserService, UserRepository],
  exports: [UserRepository],
})
export class UserModule {}
