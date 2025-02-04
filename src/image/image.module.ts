import { Module } from '@nestjs/common';
import { ImageService } from './image.service';
import { LoggerModule } from '@lib/logger';
import { PrismaModule } from '@lib/prisma';
import { ImageRepository } from './image.repository';

@Module({
  imports: [PrismaModule, LoggerModule],
  providers: [ImageRepository, ImageService],
  exports: [ImageRepository, ImageService],
})
export class ImageModule {}
