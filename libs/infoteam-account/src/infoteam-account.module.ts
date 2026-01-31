import { Module } from '@nestjs/common';
import { InfoteamAccountService } from './infoteam-account.service';
import { HttpModule } from '@nestjs/axios';
import { CustomConfigModule } from '@lib/custom-config';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [HttpModule, JwtModule, CustomConfigModule],
  providers: [InfoteamAccountService],
  exports: [InfoteamAccountService],
})
export class InfoteamAccountModule {}
