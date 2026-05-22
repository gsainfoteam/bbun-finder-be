import { Injectable } from '@nestjs/common';
import { UserResDto } from '../user/dto/res/userRes.dto';
import { UserRepository } from '../user/user.repository';

@Injectable()
export class BbunService {
  constructor(private readonly userRepository: UserRepository) {}

  //유저의 뻔라인 조회
  async findUserByMatchingSN(
    studentNumber: string,
  ): Promise<{ total: number; list: UserResDto[] }> {
    const users = await this.userRepository.findUserByMatchingSN(
      studentNumber,
      true,
    );

    return {
      total: users.length,
      list: users,
    };
  }
}
