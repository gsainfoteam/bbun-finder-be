import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateDataDto {
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
