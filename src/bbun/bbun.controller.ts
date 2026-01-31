import { Controller, Get, UseGuards } from '@nestjs/common';
import {
  ApiInternalServerErrorResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { BbunService } from './bbun.service';
import { JwtGuard } from 'src/auth/guards/jwt.guard';
import { GetUser } from 'src/auth/decorators/getUser.decorator';
import { Prisma } from 'generated/prisma/client';
import { UserListResDto } from './dto/res/UserListRes.dto';

@ApiTags('bbun')
@Controller('bbun')
export class BbunController {
  constructor(private readonly bbunService: BbunService) {}

  @ApiOperation({
    summary: '유저의 뻔라인 조회',
    description:
      'get users with the same last four digits of their student ID(including the user himself)',
  })
  @ApiOkResponse({ type: UserListResDto, description: 'Return users info' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiInternalServerErrorResponse({ description: 'Internal Server Error' })
  @Get('')
  @UseGuards(JwtGuard)
  async findBbunUserWithStudentNumber(
    @GetUser() user: Prisma.UserModel,
  ): Promise<UserListResDto> {
    return await this.bbunService.findUserByMatchingSN(user.studentNumber);
  }
}
