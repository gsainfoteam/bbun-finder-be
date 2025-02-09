import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length } from 'class-validator';

export class CreateTempUserDto {
  @ApiProperty({
    description: 'User name',
    example: 'John Doe',
  })
  @IsString()
  name: string;

  @ApiProperty({
    description: 'User email id',
    example: 'johnDoe@gm.gist.ac.kr',
  })
  @IsString()
  email: string;

  @ApiProperty({
    description: 'Student number',
    example: '20212345',
  })
  @IsString()
  @Length(8, 8, { message: '학번은 정확히 8자리여야 합니다.' })
  studentNumber: string;
}
