import {
  IsString,
  IsOptional,
  IsUUID,
  IsEnum,
  IsArray,
  IsObject,
  IsNumber,
  IsDateString,
  ValidateNested,
  Min,
  IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Sync operation type enum matching Prisma schema
 */
export enum M09SyncOperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
}

/**
 * Sync status enum matching Prisma schema
 */
export enum M09SyncStatus {
  PENDING = 'pending',
  SYNCING = 'syncing',
  SYNCED = 'synced',
  FAILED = 'failed',
  CONFLICT = 'conflict',
}

/**
 * Conflict resolution status enum matching Prisma schema
 */
export enum M09ConflictResolutionStatus {
  PENDING = 'pending',
  CLIENT_WINS = 'client_wins',
  SERVER_WINS = 'server_wins',
  MERGED = 'merged',
  DISCARDED = 'discarded',
}

/**
 * DTO for a single offline operation to be queued
 */
export class M09OfflineOperationDto {
  @IsString()
  entity_type!: string;

  @IsUUID('4', { message: 'entity_id must be a valid UUID' })
  @IsOptional()
  entity_id?: string;

  @IsEnum(M09SyncOperationType, { message: 'Invalid operation type' })
  operation_type!: M09SyncOperationType;

  @IsObject()
  payload!: Record<string, unknown>;

  @IsNumber()
  @Min(1)
  client_version!: number;

  @IsDateString()
  client_timestamp!: string;

  @IsUUID('4', { message: 'client_operation_id must be a valid UUID' })
  @IsOptional()
  client_operation_id?: string;
}

/**
 * DTO for pushing offline operations to server
 */
export class M09PushSyncDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => M09OfflineOperationDto)
  operations!: M09OfflineOperationDto[];

  @IsNumber()
  @IsOptional()
  last_sync_timestamp?: number;
}

/**
 * DTO for pulling server changes
 */
export class M09PullSyncDto {
  @IsNumber()
  @IsOptional()
  last_sync_timestamp?: number;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  entity_types?: string[];

  @IsNumber()
  @IsOptional()
  @Min(1)
  limit?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  offset?: number;
}

/**
 * DTO for resolving a sync conflict
 */
export class M09ResolveConflictDto {
  @IsUUID('4', { message: 'conflict_id must be a valid UUID' })
  conflict_id!: string;

  @IsEnum(M09ConflictResolutionStatus, { message: 'Invalid resolution status' })
  resolution!: M09ConflictResolutionStatus;

  @IsObject()
  @IsOptional()
  merged_data?: Record<string, unknown>;
}

/**
 * DTO for bulk conflict resolution
 */
export class M09BulkResolveConflictsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => M09ResolveConflictDto)
  resolutions!: M09ResolveConflictDto[];
}

/**
 * DTO for sync conflict query
 */
export class M09ConflictsQueryDto {
  @IsEnum(M09ConflictResolutionStatus, { message: 'Invalid resolution status' })
  @IsOptional()
  status?: M09ConflictResolutionStatus;

  @IsString()
  @IsOptional()
  entity_type?: string;

  @IsBoolean()
  @IsOptional()
  has_version_conflict?: boolean;

  @IsNumber()
  @IsOptional()
  @Min(1)
  limit?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  offset?: number;
}

// ============================================================================
// Response DTOs
// ============================================================================

/**
 * Response DTO for a synced operation
 */
export interface M09SyncedOperationDto {
  id: string;
  client_operation_id?: string;
  entity_type: string;
  entity_id: string | null;
  operation_type: string;
  status: string;
  server_version?: number;
  synced_at: Date | null;
  error_message?: string | null;
}

/**
 * Response DTO for push sync result
 */
export interface M09PushSyncResponseDto {
  synced: M09SyncedOperationDto[];
  conflicts: M09ConflictDto[];
  failed: M09SyncedOperationDto[];
  sync_timestamp: number;
  message: string;
}

/**
 * Response DTO for a sync conflict
 */
export interface M09ConflictDto {
  id: string;
  queue_item_id: string;
  entity_type: string;
  entity_id: string;
  client_version: number;
  server_version: number;
  client_data: Record<string, unknown>;
  server_data: Record<string, unknown>;
  merged_data: Record<string, unknown> | null;
  resolution_status: string;
  has_version_conflict: boolean;
  conflict_details: Record<string, unknown> | null;
  created_at: Date;
}

/**
 * Response DTO for server change in pull sync
 */
export interface M09ServerChangeDto {
  entity_type: string;
  entity_id: string;
  operation_type: string;
  data: Record<string, unknown>;
  version: number;
  updated_at: Date;
}

/**
 * Response DTO for pull sync result
 */
export interface M09PullSyncResponseDto {
  changes: M09ServerChangeDto[];
  has_more: boolean;
  sync_timestamp: number;
  total: number;
}

/**
 * Response DTO for conflict resolution
 */
export interface M09ResolveConflictResponseDto {
  conflict_id: string;
  resolution_status: string;
  resolved_at: Date;
  message: string;
}

/**
 * Response DTO for bulk conflict resolution
 */
export interface M09BulkResolveConflictsResponseDto {
  resolved: M09ResolveConflictResponseDto[];
  failed: { conflict_id: string; error: string }[];
  message: string;
}

/**
 * Response DTO for conflicts list
 */
export interface M09ConflictsResponseDto {
  conflicts: M09ConflictDto[];
  total: number;
  limit: number;
  offset: number;
}

/**
 * Response DTO for sync status
 */
export interface M09SyncStatusResponseDto {
  pending_count: number;
  synced_count: number;
  failed_count: number;
  conflict_count: number;
  last_sync_at: Date | null;
  is_syncing: boolean;
}
