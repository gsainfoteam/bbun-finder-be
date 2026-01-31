import { CustomConfigService } from '@lib/custom-config';
import { Controller, Get } from '@nestjs/common';
import {
  ApiInternalServerErrorResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';

@ApiTags('app')
@Controller()
export class AppController {
  private readonly apiVersion: string;
  private readonly publishedAt: string;
  constructor(private readonly customConfigService: CustomConfigService) {
    this.apiVersion = this.customConfigService.API_VERSION;
    this.publishedAt = new Date().toISOString();
  }

  @ApiOperation({
    summary: 'Get information about the service',
    description: '현재 서버의 기본적인 정보를 확인할 수 있습니다.',
  })
  @ApiOkResponse({
    description: '성공',
    example: {
      name: 'bbun',
      version: 'v2.0.0',
      publishedAt: new Date().toISOString(),
    },
  })
  @ApiInternalServerErrorResponse({
    description: '서버에 문제가 생김',
  })
  @Get()
  info() {
    return {
      name: 'bbun',
      version: this.apiVersion,
      publishedAt: this.publishedAt,
    };
  }
}
