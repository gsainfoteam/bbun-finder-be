import { UserInfo } from '@lib/infoteam-idp/types/userInfo.type';
import { ApiProperty } from '@nestjs/swagger';

export class UserInfoRes implements UserInfo {
  @ApiProperty({
    description: 'User uuid',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  uuid: string;

  @ApiProperty({
    description: 'User email id',
    example: 'johnDoe@gm.gist.ac.kr',
  })
  email: string;

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
}

export class UserRegistrationDto {
  @ApiProperty({
    description: 'User studentNumber',
    example: '20005001',
  })
  studentNumber: string;

  @ApiProperty({
    description: 'User Registration state',
    example: true,
  })
  isBbunRegistered: boolean;
}
