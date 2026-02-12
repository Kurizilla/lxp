import { IsArray, IsString, ArrayMinSize, IsOptional } from 'class-validator';

export class TerminateSessionsDto {
  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(1)
  session_ids: string[];
}

export class TerminateUserSessionsDto {
  @IsOptional()
  @IsString()
  exclude_session_id?: string;
}
