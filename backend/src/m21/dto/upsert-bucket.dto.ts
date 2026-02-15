import {
  IsString,
  IsOptional,
  IsBoolean,
  MaxLength,
  MinLength,
  IsNotEmpty,
  IsUUID,
} from 'class-validator';

/**
 * DTO for creating or updating a storage bucket
 */
export class M21UpsertBucketDto {
  @IsString()
  @IsNotEmpty({ message: 'Bucket name is required' })
  @MinLength(2, { message: 'Name must be at least 2 characters' })
  @MaxLength(100, { message: 'Name must not exceed 100 characters' })
  name!: string;

  @IsString()
  @IsNotEmpty({ message: 'S3 bucket name is required' })
  @MinLength(3, { message: 'S3 bucket must be at least 3 characters' })
  @MaxLength(63, { message: 'S3 bucket must not exceed 63 characters' })
  s3_bucket!: string;

  @IsString()
  @IsNotEmpty({ message: 'S3 region is required' })
  @MaxLength(50, { message: 'S3 region must not exceed 50 characters' })
  s3_region!: string;

  @IsString()
  @IsNotEmpty({ message: 'Access key is required' })
  access_key!: string;

  @IsString()
  @IsNotEmpty({ message: 'Secret key is required' })
  secret_key!: string;

  @IsBoolean()
  @IsOptional()
  is_active?: boolean;
}

/**
 * DTO for updating an existing storage bucket
 */
export class M21UpdateBucketDto {
  @IsString()
  @IsOptional()
  @MinLength(2, { message: 'Name must be at least 2 characters' })
  @MaxLength(100, { message: 'Name must not exceed 100 characters' })
  name?: string;

  @IsString()
  @IsOptional()
  @MinLength(3, { message: 'S3 bucket must be at least 3 characters' })
  @MaxLength(63, { message: 'S3 bucket must not exceed 63 characters' })
  s3_bucket?: string;

  @IsString()
  @IsOptional()
  @MaxLength(50, { message: 'S3 region must not exceed 50 characters' })
  s3_region?: string;

  @IsString()
  @IsOptional()
  access_key?: string;

  @IsString()
  @IsOptional()
  secret_key?: string;

  @IsBoolean()
  @IsOptional()
  is_active?: boolean;
}

/**
 * Response DTO for a storage bucket (without sensitive keys)
 */
export interface M21StorageBucketDto {
  id: string;
  name: string;
  s3_bucket: string;
  s3_region: string;
  is_active: boolean;
  created_by_id: string | null;
  created_at: Date;
  updated_at: Date;
}

/**
 * Response DTO for paginated bucket list
 */
export interface M21StorageBucketsResponseDto {
  buckets: M21StorageBucketDto[];
  total: number;
  offset: number;
  limit: number;
}

/**
 * Response DTO for single bucket operations
 */
export interface M21StorageBucketResponseDto {
  bucket: M21StorageBucketDto;
  message?: string;
}

/**
 * Query DTO for listing buckets
 */
export class M21ListBucketsQueryDto {
  @IsOptional()
  @IsUUID()
  created_by_id?: string;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;

  @IsOptional()
  offset?: number;

  @IsOptional()
  limit?: number;
}
