import { ApiProperty } from '@nestjs/swagger';

export class BbunUserResDto {
  @ApiProperty({
    description: 'User uuid',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  uuid: string;

  @ApiProperty({
    description: 'User name',
    example: 'John Doe',
  })
  name: string;

  @ApiProperty({
    description: 'Student number',
    example: '20212345',
  })
  studentNumber: string;

  @ApiProperty({
    description: 'User email id',
    example: 'johnDoe@gm.gist.ac.kr',
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
  isBbunRegistered: boolean;

  @ApiProperty({
    description: 'user department',
    example: '기초교육학부',
  })
  department: string | null;

  @ApiProperty({
    description: 'user MBTI',
    example: 'INFJ',
  })
  MBTI: string | null;

  @ApiProperty({
    description: 'user insta ID',
    example: 'infoteam_gist',
  })
  insta_ID: string | null;

  @ApiProperty({
    description: 'user registration',
    example:
      '안녕하세요, 지스트의 학부생들을 위한 서비스를 제공하고 있는 인포팀입니다',
  })
  description: string | null;

  @ApiProperty({
    description: 'user profileImage',
    example: 'UklGRmouAABXRUJQVlA4IF4uAACw2QCdAS...',
  })
  profileImage: string | null;

  constructor(partial: Partial<BbunUserResDto>) {
    Object.assign(this, partial);
  }
}

export class BbunUserResListDto {
  @ApiProperty({
    type: [BbunUserResDto],
    isArray: true,
  })
  list: BbunUserResDto[];
}
