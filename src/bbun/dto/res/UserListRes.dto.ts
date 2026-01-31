import { ApiProperty } from '@nestjs/swagger';
import { UserResDto } from 'src/user/dto/res/userRes.dto';

export class UserListResDto {
  @ApiProperty({
    type: [UserResDto],
    isArray: true,
  })
  total: number;
  list: UserResDto[];
}
