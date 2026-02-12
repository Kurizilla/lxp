import { IsBoolean, IsOptional } from 'class-validator';

export class CreateNotificationPreferenceDto {
  @IsBoolean()
  @IsOptional()
  emailEnabled?: boolean;

  @IsBoolean()
  @IsOptional()
  inAppEnabled?: boolean;

  @IsBoolean()
  @IsOptional()
  pushEnabled?: boolean;
}

export class UpdateNotificationPreferenceDto {
  @IsBoolean()
  @IsOptional()
  emailEnabled?: boolean;

  @IsBoolean()
  @IsOptional()
  inAppEnabled?: boolean;

  @IsBoolean()
  @IsOptional()
  pushEnabled?: boolean;
}
