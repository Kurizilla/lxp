import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import {
  M09SyncOperationType as PrismaSyncOperationType,
  M09SyncStatus as PrismaSyncStatus,
  M09ConflictResolutionStatus as PrismaConflictResolutionStatus,
  Prisma,
} from '@prisma/client';
import { PrismaService } from '../../common/prisma';
import { AuthenticatedUser } from '../../m01/auth/jwt.strategy';
import {
  M09OfflineOperationDto,
  M09PushSyncDto,
  M09PullSyncDto,
  M09ResolveConflictDto,
  M09BulkResolveConflictsDto,
  M09ConflictsQueryDto,
  M09SyncOperationType,
  M09SyncStatus,
  M09PushSyncResponseDto,
  M09PullSyncResponseDto,
  M09SyncedOperationDto,
  M09ConflictDto,
  M09ServerChangeDto,
  M09ResolveConflictResponseDto,
  M09BulkResolveConflictsResponseDto,
  M09ConflictsResponseDto,
  M09SyncStatusResponseDto,
} from '../dto/offline-sync.dto';

/**
 * Service for handling offline sync operations
 * Supports bidirectional sync with version conflict detection
 */
@Injectable()
export class OfflineService {
  private readonly logger = new Logger(OfflineService.name);
  private readonly DEFAULT_LIMIT = 50;
  private readonly MAX_LIMIT = 200;

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Push offline operations to server (client -> server sync)
   * Detects version conflicts and creates conflict records when needed
   */
  async pushSync(
    dto: M09PushSyncDto,
    user: AuthenticatedUser,
  ): Promise<M09PushSyncResponseDto> {
    const synced: M09SyncedOperationDto[] = [];
    const conflicts: M09ConflictDto[] = [];
    const failed: M09SyncedOperationDto[] = [];

    for (const operation of dto.operations) {
      try {
        const result = await this.processOperation(operation, user);
        
        if (result.hasConflict && result.conflict) {
          conflicts.push(result.conflict);
        } else if (result.synced) {
          synced.push(result.synced);
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        this.logger.error(
          `Failed to process operation for entity ${operation.entity_type}:${operation.entity_id}: ${errorMessage}`,
        );
        
        failed.push({
          id: '',
          client_operation_id: operation.client_operation_id,
          entity_type: operation.entity_type,
          entity_id: operation.entity_id || null,
          operation_type: operation.operation_type,
          status: M09SyncStatus.FAILED,
          error_message: errorMessage,
          synced_at: null,
        });
      }
    }

    const syncTimestamp = Date.now();

    this.logger.log(
      `Push sync for user ${user.email}: ${synced.length} synced, ${conflicts.length} conflicts, ${failed.length} failed`,
    );

    return {
      synced,
      conflicts,
      failed,
      sync_timestamp: syncTimestamp,
      message: `Processed ${dto.operations.length} operations`,
    };
  }

  /**
   * Process a single offline operation
   * Detects version conflicts using optimistic locking
   */
  private async processOperation(
    operation: M09OfflineOperationDto,
    user: AuthenticatedUser,
  ): Promise<{
    synced?: M09SyncedOperationDto;
    conflict?: M09ConflictDto;
    hasConflict: boolean;
  }> {
    // Map DTO enum to Prisma enum
    const operationType = operation.operation_type as unknown as PrismaSyncOperationType;

    // Create queue item for tracking
    const queueItem = await this.prisma.m09_offline_queue.create({
      data: {
        user_id: user.id,
        entity_type: operation.entity_type,
        entity_id: operation.entity_id,
        operation_type: operationType,
        payload: operation.payload as Prisma.InputJsonValue,
        client_version: operation.client_version,
        status: 'syncing' as PrismaSyncStatus,
        client_timestamp: new Date(operation.client_timestamp),
      },
    });

    // For update/delete operations, check for version conflicts
    if (
      (operation.operation_type === M09SyncOperationType.UPDATE ||
        operation.operation_type === M09SyncOperationType.DELETE) &&
      operation.entity_id
    ) {
      const conflictCheck = await this.checkVersionConflict(
        operation.entity_type,
        operation.entity_id,
        operation.client_version,
      );

      if (conflictCheck.hasConflict) {
        // Create conflict record
        const conflict = await this.prisma.m09_sync_conflicts.create({
          data: {
            queue_item_id: queueItem.id,
            user_id: user.id,
            entity_type: operation.entity_type,
            entity_id: operation.entity_id,
            client_version: operation.client_version,
            server_version: conflictCheck.serverVersion!,
            client_data: operation.payload as Prisma.InputJsonValue,
            server_data: conflictCheck.serverData as Prisma.InputJsonValue,
            has_version_conflict: true,
            conflict_details: {
              detected_at: new Date().toISOString(),
              operation_type: operation.operation_type,
            } as Prisma.InputJsonValue,
          },
        });

        // Update queue item status
        await this.prisma.m09_offline_queue.update({
          where: { id: queueItem.id },
          data: {
            status: 'conflict' as PrismaSyncStatus,
            server_version: conflictCheck.serverVersion,
          },
        });

        return {
          hasConflict: true,
          conflict: {
            id: conflict.id,
            queue_item_id: conflict.queue_item_id,
            entity_type: conflict.entity_type,
            entity_id: conflict.entity_id,
            client_version: conflict.client_version,
            server_version: conflict.server_version,
            client_data: conflict.client_data as Record<string, unknown>,
            server_data: conflict.server_data as Record<string, unknown>,
            merged_data: null,
            resolution_status: conflict.resolution_status,
            has_version_conflict: conflict.has_version_conflict,
            conflict_details: conflict.conflict_details as Record<string, unknown> | null,
            created_at: conflict.created_at,
          },
        };
      }
    }

    // No conflict - mark as synced
    const updatedQueueItem = await this.prisma.m09_offline_queue.update({
      where: { id: queueItem.id },
      data: {
        status: 'synced' as PrismaSyncStatus,
        synced_at: new Date(),
        server_version: operation.client_version, // Assume version incremented
      },
    });

    return {
      hasConflict: false,
      synced: {
        id: updatedQueueItem.id,
        client_operation_id: operation.client_operation_id,
        entity_type: updatedQueueItem.entity_type,
        entity_id: updatedQueueItem.entity_id,
        operation_type: updatedQueueItem.operation_type,
        status: updatedQueueItem.status,
        server_version: updatedQueueItem.server_version ?? undefined,
        synced_at: updatedQueueItem.synced_at,
      },
    };
  }

  /**
   * Check for version conflict by comparing client version with server version
   * This is a simplified implementation - in production, you'd query the actual entity
   */
  private async checkVersionConflict(
    entityType: string,
    entityId: string,
    clientVersion: number,
  ): Promise<{
    hasConflict: boolean;
    serverVersion?: number;
    serverData?: Record<string, unknown>;
  }> {
    // Look up the most recent synced operation for this entity
    const lastSyncedOperation = await this.prisma.m09_offline_queue.findFirst({
      where: {
        entity_type: entityType,
        entity_id: entityId,
        status: 'synced' as PrismaSyncStatus,
      },
      orderBy: { synced_at: 'desc' },
    });

    if (!lastSyncedOperation) {
      // No previous sync record - no conflict
      return { hasConflict: false };
    }

    const serverVersion = lastSyncedOperation.server_version ?? lastSyncedOperation.client_version;

    // Version conflict if client version is behind server version
    if (clientVersion < serverVersion) {
      return {
        hasConflict: true,
        serverVersion,
        serverData: lastSyncedOperation.payload as Record<string, unknown>,
      };
    }

    return { hasConflict: false };
  }

  /**
   * Pull server changes (server -> client sync)
   * Returns changes since the last sync timestamp
   */
  async pullSync(
    dto: M09PullSyncDto,
    user: AuthenticatedUser,
  ): Promise<M09PullSyncResponseDto> {
    const limit = Math.min(dto.limit || this.DEFAULT_LIMIT, this.MAX_LIMIT);
    const offset = dto.offset || 0;

    // Build where conditions
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const whereConditions: Record<string, any> = {
      user_id: user.id,
      status: 'synced' as PrismaSyncStatus,
    };

    // Filter by last sync timestamp if provided
    if (dto.last_sync_timestamp) {
      whereConditions.synced_at = {
        gt: new Date(dto.last_sync_timestamp),
      };
    }

    // Filter by entity types if provided
    if (dto.entity_types && dto.entity_types.length > 0) {
      whereConditions.entity_type = { in: dto.entity_types };
    }

    // Get total count
    const total = await this.prisma.m09_offline_queue.count({
      where: whereConditions,
    });

    // Get synced operations
    const operations = await this.prisma.m09_offline_queue.findMany({
      where: whereConditions,
      orderBy: { synced_at: 'asc' },
      skip: offset,
      take: limit + 1, // Get one extra to check if there are more
    });

    const hasMore = operations.length > limit;
    const resultOperations = hasMore ? operations.slice(0, limit) : operations;

    const changes: M09ServerChangeDto[] = resultOperations.map((op) => ({
      entity_type: op.entity_type,
      entity_id: op.entity_id || '',
      operation_type: op.operation_type,
      data: op.payload as Record<string, unknown>,
      version: op.server_version ?? op.client_version,
      updated_at: op.synced_at || op.updated_at,
    }));

    const syncTimestamp = Date.now();

    this.logger.log(
      `Pull sync for user ${user.email}: ${changes.length} changes, hasMore: ${hasMore}`,
    );

    return {
      changes,
      has_more: hasMore,
      sync_timestamp: syncTimestamp,
      total,
    };
  }

  /**
   * Get pending conflicts for the user
   */
  async getConflicts(
    query: M09ConflictsQueryDto,
    user: AuthenticatedUser,
  ): Promise<M09ConflictsResponseDto> {
    const limit = Math.min(query.limit || this.DEFAULT_LIMIT, this.MAX_LIMIT);
    const offset = query.offset || 0;

    // Build where conditions
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const whereConditions: Record<string, any> = {
      user_id: user.id,
    };

    if (query.status) {
      whereConditions.resolution_status = query.status as unknown as PrismaConflictResolutionStatus;
    }

    if (query.entity_type) {
      whereConditions.entity_type = query.entity_type;
    }

    if (query.has_version_conflict !== undefined) {
      whereConditions.has_version_conflict = query.has_version_conflict;
    }

    const total = await this.prisma.m09_sync_conflicts.count({
      where: whereConditions,
    });

    const conflictRecords = await this.prisma.m09_sync_conflicts.findMany({
      where: whereConditions,
      orderBy: { created_at: 'desc' },
      skip: offset,
      take: limit,
    });

    const conflicts: M09ConflictDto[] = conflictRecords.map((c) => ({
      id: c.id,
      queue_item_id: c.queue_item_id,
      entity_type: c.entity_type,
      entity_id: c.entity_id,
      client_version: c.client_version,
      server_version: c.server_version,
      client_data: c.client_data as Record<string, unknown>,
      server_data: c.server_data as Record<string, unknown>,
      merged_data: c.merged_data as Record<string, unknown> | null,
      resolution_status: c.resolution_status,
      has_version_conflict: c.has_version_conflict,
      conflict_details: c.conflict_details as Record<string, unknown> | null,
      created_at: c.created_at,
    }));

    return {
      conflicts,
      total,
      limit,
      offset,
    };
  }

  /**
   * Resolve a single conflict
   */
  async resolveConflict(
    dto: M09ResolveConflictDto,
    user: AuthenticatedUser,
  ): Promise<M09ResolveConflictResponseDto> {
    // Find the conflict
    const conflict = await this.prisma.m09_sync_conflicts.findUnique({
      where: { id: dto.conflict_id },
    });

    if (!conflict) {
      throw new NotFoundException(`Conflict ${dto.conflict_id} not found`);
    }

    if (conflict.user_id !== user.id) {
      throw new BadRequestException('Cannot resolve conflict for another user');
    }

    if (conflict.resolution_status !== 'pending') {
      throw new BadRequestException('Conflict has already been resolved');
    }

    // Map DTO enum to Prisma enum
    const resolutionStatus = dto.resolution as unknown as PrismaConflictResolutionStatus;

    // Update conflict with resolution
    const resolvedConflict = await this.prisma.m09_sync_conflicts.update({
      where: { id: dto.conflict_id },
      data: {
        resolution_status: resolutionStatus,
        merged_data: dto.merged_data as Prisma.InputJsonValue | undefined,
        resolved_by: user.id,
        resolved_at: new Date(),
      },
    });

    // Update the associated queue item
    await this.prisma.m09_offline_queue.update({
      where: { id: conflict.queue_item_id },
      data: {
        status: 'synced' as PrismaSyncStatus,
        synced_at: new Date(),
      },
    });

    this.logger.log(
      `Conflict ${dto.conflict_id} resolved by ${user.email} with status: ${dto.resolution}`,
    );

    return {
      conflict_id: resolvedConflict.id,
      resolution_status: resolvedConflict.resolution_status,
      resolved_at: resolvedConflict.resolved_at!,
      message: 'Conflict resolved successfully',
    };
  }

  /**
   * Resolve multiple conflicts at once
   */
  async bulkResolveConflicts(
    dto: M09BulkResolveConflictsDto,
    user: AuthenticatedUser,
  ): Promise<M09BulkResolveConflictsResponseDto> {
    const resolved: M09ResolveConflictResponseDto[] = [];
    const failed: { conflict_id: string; error: string }[] = [];

    for (const resolution of dto.resolutions) {
      try {
        const result = await this.resolveConflict(resolution, user);
        resolved.push(result);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        failed.push({
          conflict_id: resolution.conflict_id,
          error: errorMessage,
        });
      }
    }

    this.logger.log(
      `Bulk resolve conflicts for user ${user.email}: ${resolved.length} resolved, ${failed.length} failed`,
    );

    return {
      resolved,
      failed,
      message: `Resolved ${resolved.length} of ${dto.resolutions.length} conflicts`,
    };
  }

  /**
   * Get sync status summary for the user
   */
  async getSyncStatus(user: AuthenticatedUser): Promise<M09SyncStatusResponseDto> {
    const [pendingCount, syncedCount, failedCount, conflictCount, lastSynced] =
      await Promise.all([
        this.prisma.m09_offline_queue.count({
          where: { user_id: user.id, status: 'pending' as PrismaSyncStatus },
        }),
        this.prisma.m09_offline_queue.count({
          where: { user_id: user.id, status: 'synced' as PrismaSyncStatus },
        }),
        this.prisma.m09_offline_queue.count({
          where: { user_id: user.id, status: 'failed' as PrismaSyncStatus },
        }),
        this.prisma.m09_sync_conflicts.count({
          where: { user_id: user.id, resolution_status: 'pending' as PrismaConflictResolutionStatus },
        }),
        this.prisma.m09_offline_queue.findFirst({
          where: { user_id: user.id, status: 'synced' as PrismaSyncStatus },
          orderBy: { synced_at: 'desc' },
          select: { synced_at: true },
        }),
      ]);

    // Check if there's an active syncing operation
    const syncingCount = await this.prisma.m09_offline_queue.count({
      where: { user_id: user.id, status: 'syncing' as PrismaSyncStatus },
    });

    return {
      pending_count: pendingCount,
      synced_count: syncedCount,
      failed_count: failedCount,
      conflict_count: conflictCount,
      last_sync_at: lastSynced?.synced_at || null,
      is_syncing: syncingCount > 0,
    };
  }

  /**
   * Clear all synced operations older than a certain date
   * Useful for cleanup and storage management
   */
  async clearSyncedOperations(
    user: AuthenticatedUser,
    beforeDate?: Date,
  ): Promise<{ deleted_count: number }> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const whereConditions: Record<string, any> = {
      user_id: user.id,
      status: 'synced' as PrismaSyncStatus,
    };

    if (beforeDate) {
      whereConditions.synced_at = { lt: beforeDate };
    }

    const result = await this.prisma.m09_offline_queue.deleteMany({
      where: whereConditions,
    });

    this.logger.log(
      `Cleared ${result.count} synced operations for user ${user.email}`,
    );

    return { deleted_count: result.count };
  }
}
