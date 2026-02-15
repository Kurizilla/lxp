import {
  IsString,
  IsOptional,
  IsUUID,
  IsNotEmpty,
  IsInt,
  Min,
  IsBoolean,
  MaxLength,
} from 'class-validator';

/**
 * DTO for creating an annotation on a recording
 */
export class M21CreateAnnotationDto {
  @IsUUID('4', { message: 'Invalid observation recording ID' })
  @IsNotEmpty({ message: 'Observation recording ID is required' })
  observation_recording_id!: string;

  @IsInt({ message: 'Timestamp must be an integer' })
  @Min(0, { message: 'Timestamp must be positive' })
  timestamp_seconds!: number;

  @IsString()
  @IsNotEmpty({ message: 'Annotation text is required' })
  @MaxLength(2000, { message: 'Annotation text must not exceed 2000 characters' })
  text!: string;

  @IsBoolean()
  @IsOptional()
  is_ai_suggestion?: boolean;
}

/**
 * DTO for updating an annotation
 */
export class M21UpdateAnnotationDto {
  @IsInt({ message: 'Timestamp must be an integer' })
  @Min(0, { message: 'Timestamp must be positive' })
  @IsOptional()
  timestamp_seconds?: number;

  @IsString()
  @IsOptional()
  @MaxLength(2000, { message: 'Annotation text must not exceed 2000 characters' })
  text?: string;
}

/**
 * Response DTO for an annotation
 */
export interface M21AnnotationDto {
  id: string;
  observation_recording_id: string;
  reviewer_id: string | null;
  timestamp_seconds: number;
  text: string;
  is_ai_suggestion: boolean;
  created_at: Date;
  updated_at: Date;
}

/**
 * Response DTO for paginated annotation list
 */
export interface M21AnnotationsResponseDto {
  annotations: M21AnnotationDto[];
  total: number;
  offset: number;
  limit: number;
}

/**
 * Response DTO for single annotation operations
 */
export interface M21AnnotationResponseDto {
  annotation: M21AnnotationDto;
  message?: string;
}

/**
 * Query DTO for listing annotations
 */
export class M21ListAnnotationsQueryDto {
  @IsOptional()
  @IsUUID('4', { message: 'Invalid observation recording ID' })
  observation_recording_id?: string;

  @IsOptional()
  @IsUUID('4', { message: 'Invalid reviewer ID' })
  reviewer_id?: string;

  @IsOptional()
  @IsBoolean()
  is_ai_suggestion?: boolean;

  @IsOptional()
  offset?: number;

  @IsOptional()
  limit?: number;
}
