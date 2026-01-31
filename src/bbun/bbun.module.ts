import { Module } from '@nestjs/common';
import { BbunController } from './bbun.controller';
import { BbunService } from './bbun.service';
import { UserModule } from 'src/user/user.module';

@Module({
  imports: [UserModule],
  controllers: [BbunController],
  providers: [BbunService],
})
export class BbunModule {}
