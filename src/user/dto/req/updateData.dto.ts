import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength, IsEnum } from 'class-validator';
import { Transform } from 'class-transformer';
import { Department, Mbti } from 'generated/prisma/enums';

export class UpdateDataDto {
  @ApiProperty({
    description: 'User department',
    example: '기초교육학부',
    required: false,
    nullable: true,
  })
  @IsOptional()
  @Transform(({ value }) => normalizeOptionalEnum(value))
  @IsEnum(Department)
  department?: Department;

  @ApiProperty({
    description: 'User MBTI',
    example: 'ENFJ',
    required: false,
    nullable: true,
  })
  @IsOptional()
  @Transform(({ value }) => normalizeOptionalEnum(value))
  @IsEnum(Mbti)
  MBTI?: Mbti;

  @ApiProperty({
    description: 'User insta ID',
    example: 'infoteam_gist',
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsString()
  instaId?: string;

  @ApiProperty({
    description: 'User short introduction',
    example:
      '안녕하세요, 지스트의 학부생들을 위한 서비스를 제공하고 있는 인포팀입니다.',
    required: false,
    nullable: true,
  })
  @IsOptional()
  @MaxLength(300, { message: '자기소개는 최대 300자까지 입력할 수 있습니다.' })
  @IsString()
  description?: string;
}

function normalizeOptionalEnum(v: unknown) {
  if (v === null) return null;
  if (v === undefined) return undefined;
  if (typeof v !== 'string') return v;

  const s = v.trim();
  if (!s || s === '선택해주세요') return undefined;

  return s.toUpperCase();
}
