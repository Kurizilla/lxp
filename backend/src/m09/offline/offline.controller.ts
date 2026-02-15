import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Body,
  Query,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../../m01/auth/jwt-auth.guard';
import { AuthenticatedUser } from '../../m01/auth/jwt.strategy';
import { OfflineService } from './offline.service';
import {
  M09PushSyncDto,
  M09PullSyncDto,
  M09ResolveConflictDto,
  M09BulkResolveConflictsDto,
  M09ConflictsQueryDto,
  M09PushSyncResponseDto,
  M09PullSyncResponseDto,
  M09ResolveConflictResponseDto,
  M09BulkResolveConflictsResponseDto,
  M09ConflictsResponseDto,
  M09SyncStatusResponseDto,
} from '../dto/offline-sync.dto';

/**
 * Extended Express Request with authenticated user
 */
interface AuthenticatedRequest extends Request {
  user: AuthenticatedUser;
}

/**
 * Controller for offline sync endpoints
 * Provides bidirectional sync with version conflict detection
 * All endpoints require JWT authentication
 */
@Controller('m09/offline')
@UseGuards(JwtAuthGuard)
export class OfflineController {
  constructor(private readonly offlineService: OfflineService) {}

  /**
   * POST /m09/offline/push
   * Push offline operations to server (client -> server sync)
   * Detects version conflicts and returns conflicts for resolution
   */
  @Post('push')
  @HttpCode(HttpStatus.OK)
  async pushSync(
    @Body() dto: M09PushSyncDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<M09PushSyncResponseDto> {
    return this.offlineService.pushSync(dto, req.user);
  }

  /**
   * POST /m09/offline/pull
   * Pull server changes (server -> client sync)
   * Returns changes since the last sync timestamp
   */
  @Post('pull')
  @HttpCode(HttpStatus.OK)
  async pullSync(
    @Body() dto: M09PullSyncDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<M09PullSyncResponseDto> {
    return this.offlineService.pullSync(dto, req.user);
  }

  /**
   * GET /m09/offline/status
   * Get sync status summary for the authenticated user
   */
  @Get('status')
  async getSyncStatus(
    @Req() req: AuthenticatedRequest,
  ): Promise<M09SyncStatusResponseDto> {
    return this.offlineService.getSyncStatus(req.user);
  }

  /**
   * GET /m09/offline/conflicts
   * Get pending conflicts for the authenticated user
   * Query params: status, entity_type, has_version_conflict, limit, offset
   */
  @Get('conflicts')
  async getConflicts(
    @Query() query: M09ConflictsQueryDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<M09ConflictsResponseDto> {
    return this.offlineService.getConflicts(query, req.user);
  }

  /**
   * PATCH /m09/offline/conflicts/resolve
   * Resolve a single sync conflict
   */
  @Patch('conflicts/resolve')
  @HttpCode(HttpStatus.OK)
  async resolveConflict(
    @Body() dto: M09ResolveConflictDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<M09ResolveConflictResponseDto> {
    return this.offlineService.resolveConflict(dto, req.user);
  }

  /**
   * PATCH /m09/offline/conflicts/resolve-bulk
   * Resolve multiple sync conflicts at once
   */
  @Patch('conflicts/resolve-bulk')
  @HttpCode(HttpStatus.OK)
  async bulkResolveConflicts(
    @Body() dto: M09BulkResolveConflictsDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<M09BulkResolveConflictsResponseDto> {
    return this.offlineService.bulkResolveConflicts(dto, req.user);
  }

  /**
   * DELETE /m09/offline/history
   * Clear synced operations history (for storage management)
   * Query param: before_date (ISO string) - clear operations synced before this date
   */
  @Delete('history')
  @HttpCode(HttpStatus.OK)
  async clearHistory(
    @Query('before_date') beforeDate: string | undefined,
    @Req() req: AuthenticatedRequest,
  ): Promise<{ deleted_count: number; message: string }> {
    const date = beforeDate ? new Date(beforeDate) : undefined;
    const result = await this.offlineService.clearSyncedOperations(req.user, date);
    return {
      ...result,
      message: `Cleared ${result.deleted_count} synced operations`,
    };
  }
}
