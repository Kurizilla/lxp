import {
  IsString,
  IsOptional,
  IsUUID,
  IsObject,
  MaxLength,
  MinLength,
} from 'class-validator';

/**
 * DTO for querying the assistant
 * Supports context-aware responses based on route/module
 */
export class M01AssistantQueryDto {
  @IsString()
  @MinLength(1, { message: 'Query cannot be empty' })
  @MaxLength(2000, { message: 'Query must not exceed 2000 characters' })
  query!: string;

  @IsString()
  @IsOptional()
  @MaxLength(100, { message: 'Route must not exceed 100 characters' })
  route?: string;

  @IsString()
  @IsOptional()
  @MaxLength(50, { message: 'Module must not exceed 50 characters' })
  module?: string;

  @IsUUID('4', { message: 'classroom_id must be a valid UUID' })
  @IsOptional()
  classroom_id?: string;

  @IsUUID('4', { message: 'subject_id must be a valid UUID' })
  @IsOptional()
  subject_id?: string;

  @IsObject()
  @IsOptional()
  context?: Record<string, unknown>;
}

/**
 * Response DTO for assistant query
 */
export interface M01AssistantQueryResponseDto {
  response: string;
  route?: string;
  module?: string;
  suggestions?: string[];
  metadata?: {
    processed_at: Date;
    context_used: boolean;
  };
}
