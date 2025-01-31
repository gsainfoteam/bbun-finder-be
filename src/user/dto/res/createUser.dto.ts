import { IsBoolean, IsDate, IsString } from 'class-validator';

export class RegisterBbunUser {
  @IsString()
  uuid: string;
  @IsString()
  name: string;
  @IsString()
  studentNumber: string;
  @IsString()
  email: string;
  @IsBoolean()
  consent: boolean;

  @IsDate()
  createdAt: Date;
  @IsDate()
  updatedAt: Date;
}
