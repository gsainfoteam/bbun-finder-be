import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Department, Mbti, Prisma } from 'generated/prisma/client';

export class UserResDto implements Prisma.UserModel {
  @ApiProperty({
    description: 'user name',
    example: 'John Doe',
  })
  name: string;

  @ApiProperty({
    description: 'user uuid',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  uuid: string;
  @ApiProperty({
    description: 'user student number',
    example: '20212345',
  })
  studentNumber: string;

  @ApiProperty({
    description: 'user email',
    example: 'john Doe@gm.gist.ac.kr',
  })
  email: string;

  @ApiProperty({
    description: 'created time',
    example: '2024-02-20T09:00:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'updated time',
    example: '2024-02-20T09:00:00.000Z',
  })
  updatedAt: Date;

  @ApiProperty({
    description: 'deleted time',
    example: '2024-02-20T09:00:00.000Z',
  })
  deletedAt: Date | null;

  @ApiProperty({
    description: 'user registration',
    example: true,
  })
  consent: boolean;

  @ApiPropertyOptional({
    description: 'user department',
    example: '기초교육학부',
  })
  department: Department | null;

  @ApiPropertyOptional({
    description: 'user MBTI',
    example: 'INTJ',
  })
  MBTI: Mbti | null;

  @ApiPropertyOptional({
    description: 'user insta ID',
    example: 'infoteam_gist',
  })
  instaId: string | null;

  @ApiPropertyOptional({
    description: 'user description',
    example: 'Hello, I am a student at GIST.',
  })
  description: string | null;

  @ApiPropertyOptional({
    description: 'user profile image URL',
    example: 'https://example.com/profile.jpg',
  })
  profileImageUrl: string | null;
}
