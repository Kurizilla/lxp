import { IsEnum, IsNotEmpty, IsNumber, IsString } from 'class-validator';
import { NotificationType, Priority } from '../../../../common/enums';

export class CreateNotificationDto {
  @IsNumber()
  @IsNotEmpty()
  userId: number;

  @IsEnum(NotificationType)
  @IsNotEmpty()
  type: NotificationType;

  @IsEnum(Priority)
  @IsNotEmpty()
  priority: Priority;

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  message: string;
}
