import { Test, TestingModule } from '@nestjs/testing';
import { InfoteamAccountService } from './infoteam-account.service';
import { HttpModule } from '@nestjs/axios';
import { JwtModule } from '@nestjs/jwt';
import { CustomConfigModule } from '@lib/custom-config';

describe('InfoteamAccountService', () => {
  let service: InfoteamAccountService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [HttpModule, JwtModule, CustomConfigModule],
      providers: [InfoteamAccountService],
    }).compile();

    service = module.get<InfoteamAccountService>(InfoteamAccountService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
