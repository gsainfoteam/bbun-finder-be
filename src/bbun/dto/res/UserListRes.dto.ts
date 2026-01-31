import { ApiProperty } from '@nestjs/swagger';
import { UserResDto } from 'src/user/dto/res/userRes.dto';

export class UserListResDto {
  @ApiProperty({
    description: 'Total number of users',
    example: 10,
  })
  total: number;

  @ApiProperty({
    type: [UserResDto],
    isArray: true,
  })
  list: UserResDto[];
}
