import { IsString, IsObject } from 'class-validator';

export class MonitoredCreateDto {
  @IsString()
  establishmentId: string;

  @IsObject()
  metrics: Record<string, number>;
}
