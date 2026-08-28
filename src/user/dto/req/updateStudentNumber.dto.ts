import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Matches } from 'class-validator';

export class UpdateStudentNumberDto {
  @ApiProperty({
    example: '20261234',
    description:
      'Student number used only for staging test. Use different full numbers with the same last 4 digits.',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d+$/, {
    message: 'studentNumber must contain only numbers',
  })
  studentNumber!: string;
}
