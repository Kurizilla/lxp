import { IsString, IsOptional, MaxLength, MinLength, IsObject } from 'class-validator';

/**
 * DTO for assistant query request
 * Used for context-aware AI assistant queries
 */
export class M01AssistantQueryDto {
  @IsString()
  @MinLength(1, { message: 'Query must not be empty' })
  @MaxLength(4096, { message: 'Query must not exceed 4096 characters' })
  query!: string;

  @IsString()
  @IsOptional()
  @MaxLength(64, { message: 'Module must not exceed 64 characters' })
  module?: string;

  @IsString()
  @IsOptional()
  @MaxLength(128, { message: 'Route must not exceed 128 characters' })
  route?: string;

  @IsObject()
  @IsOptional()
  context?: Record<string, unknown>;
}

/**
 * Response DTO for assistant query
 */
export interface M01AssistantQueryResponseDto {
  response: string;
  module?: string;
  route?: string;
  timestamp: string;
}
