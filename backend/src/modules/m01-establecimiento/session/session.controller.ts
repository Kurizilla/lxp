import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { SessionService } from './session.service';
import {
  SessionResponseDto,
  SessionFilterDto,
  TerminateSessionsDto,
  TerminateUserSessionsDto,
} from './dto';
import { PaginatedResponseDto } from '../../../common/dto';
import { JwtAuthGuard, RolesGuard, Roles } from '../auth/auth.guard';

@Controller('api/v1/modules/m01/sessions')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SessionController {
  constructor(private readonly sessionService: SessionService) {}

  @Get()
  @Roles('admin_nacional')
  async findAll(
    @Query() filter: SessionFilterDto,
  ): Promise<PaginatedResponseDto<SessionResponseDto>> {
    return this.sessionService.findAll(filter);
  }

  @Get('active')
  @Roles('admin_nacional')
  async getActiveSessions(): Promise<PaginatedResponseDto<SessionResponseDto>> {
    return this.sessionService.getActiveSessions();
  }

  @Get('stats')
  @Roles('admin_nacional')
  async getSessionStats(): Promise<{ total: number; active: number; expired: number }> {
    return this.sessionService.getSessionStats();
  }

  @Get('user/:userId')
  @Roles('admin_nacional')
  async findByUserId(@Param('userId') userId: string): Promise<SessionResponseDto[]> {
    return this.sessionService.findByUserId(userId);
  }

  @Get(':id')
  @Roles('admin_nacional')
  async findOne(@Param('id') id: string): Promise<SessionResponseDto> {
    return this.sessionService.findOne(id);
  }

  @Delete(':id')
  @Roles('admin_nacional')
  @HttpCode(HttpStatus.NO_CONTENT)
  async terminate(@Param('id') id: string): Promise<void> {
    return this.sessionService.terminate(id);
  }

  @Post('terminate')
  @Roles('admin_nacional')
  async terminateMultiple(
    @Body() dto: TerminateSessionsDto,
  ): Promise<{ terminated_count: number }> {
    return this.sessionService.terminateMultiple(dto);
  }

  @Post('terminate/user/:userId')
  @Roles('admin_nacional')
  async terminateUserSessions(
    @Param('userId') userId: string,
    @Body() dto?: TerminateUserSessionsDto,
  ): Promise<{ terminated_count: number }> {
    return this.sessionService.terminateUserSessions(userId, dto);
  }

  @Post('terminate/all')
  @Roles('admin_nacional')
  async terminateAllSessions(): Promise<{ terminated_count: number }> {
    return this.sessionService.terminateAllSessions();
  }

  @Post('cleanup')
  @Roles('admin_nacional')
  async cleanupExpiredSessions(): Promise<{ cleaned_count: number }> {
    return this.sessionService.cleanupExpiredSessions();
  }
}
