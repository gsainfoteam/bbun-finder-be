import { Test, TestingModule } from '@nestjs/testing';
import { BbunController } from './bbun.controller';

describe('BbunController', () => {
  let controller: BbunController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BbunController],
    }).compile();

    controller = module.get<BbunController>(BbunController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
