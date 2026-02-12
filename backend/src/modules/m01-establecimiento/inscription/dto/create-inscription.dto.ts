import { IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateInscriptionDto {
  @Type(() => Number)
  @IsNumber()
  userId: number;

  @Type(() => Number)
  @IsNumber()
  classroomId: number;
}
