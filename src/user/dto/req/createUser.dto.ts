import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, Length, MaxLength } from 'class-validator';

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

export class registerUserDto {
  @ApiProperty({
    description: 'User department',
    example: '기초교육학부',
    required: false,
  })
  @IsOptional()
  @IsString()
  department?: string;

  @ApiProperty({
    description: 'User MBTI',
    example: 'ENFJ',
    required: false,
  })
  @IsOptional()
  @IsString()
  MBTI?: string;

  @ApiProperty({
    description: 'User insta ID',
    example: 'infoteam_gist',
    required: false,
  })
  @IsOptional()
  @IsString()
  insta_ID?: string;

  @ApiProperty({
    description: 'User short introduction',
    example:
      '안녕하세요, 지스트의 학부생들을 위한 서비스를 제공하고 있는 인포팀입니다.',
    required: false,
  })
  @IsOptional()
  @MaxLength(300, { message: '자기소개는 최대 300자까지 입력할 수 있습니다.' })
  @IsString()
  description?: string;
}
