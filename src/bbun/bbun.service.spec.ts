import { Test, TestingModule } from '@nestjs/testing';
import { BbunService } from './bbun.service';

describe('BbunService', () => {
  let service: BbunService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [BbunService],
    }).compile();

    service = module.get<BbunService>(BbunService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
