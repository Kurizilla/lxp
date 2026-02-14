import {
  Controller,
  Post,
  Body,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AuthenticatedUser } from '../auth/jwt.strategy';
import { AssistantService } from './assistant.service';
import {
  M01AssistantQueryDto,
  M01AssistantQueryResponseDto,
} from '../dto/assistant-query.dto';

/**
 * Extended Express Request with authenticated user
 */
interface AuthenticatedRequest extends Request {
  user: AuthenticatedUser;
}

/**
 * Controller for AI assistant context-aware queries
 * Requires JWT authentication
 */
@Controller('assistant')
@UseGuards(JwtAuthGuard)
export class AssistantController {
  constructor(private readonly assistantService: AssistantService) {}

  /**
   * POST /assistant/query
   * Process a context-aware assistant query
   */
  @Post('query')
  @HttpCode(HttpStatus.OK)
  async query(
    @Body() dto: M01AssistantQueryDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<M01AssistantQueryResponseDto> {
    return this.assistantService.query(dto, req.user.email);
  }
}
