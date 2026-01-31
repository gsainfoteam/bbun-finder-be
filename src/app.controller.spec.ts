/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { CustomConfigModule } from '@lib/custom-config';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      imports: [CustomConfigModule],
      controllers: [AppController],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('root', () => {
    it('should return service information', () => {
      expect(appController.info()).toEqual({
        name: 'bbun',
        version: expect.any(String),
        publishedAt: expect.any(String),
      });
    });
  });
});
