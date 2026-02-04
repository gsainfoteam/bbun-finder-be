import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { Department, Mbti } from 'generated/prisma/enums';

export class registerUserDto {
  @ApiProperty({
    description: 'User department',
    example: 'GS, EC와 같은 해당 전공의 전공과목 코드',
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => normalizeOptionalEnum(value))
  @IsEnum(Department)
  department?: Department;

  @ApiProperty({
    description: 'User MBTI',
    example: 'ENFJ(대문자)',
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => normalizeOptionalEnum(value))
  @IsEnum(Mbti)
  MBTI?: Mbti;

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

function normalizeOptionalEnum(v: unknown) {
  if (v === null || v === undefined) return undefined;
  if (typeof v !== 'string') return v;

  const s = v.trim();
  if (!s || s === '선택해주세요') return undefined;

  return s.toUpperCase();
}
