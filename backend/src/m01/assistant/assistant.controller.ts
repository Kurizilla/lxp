import {
  Controller,
  Post,
  Body,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AssistantService } from './assistant.service';
import {
  M01AssistantQueryDto,
  M01AssistantQueryResponseDto,
} from '../dto/assistant-query.dto';

/**
 * Request interface with authenticated user
 */
interface AuthenticatedRequest {
  user: {
    id: string;
    email: string;
    first_name: string | null;
    last_name: string | null;
    session_id: string;
  };
}

/**
 * Controller for assistant query endpoint
 * Provides context-aware AI assistant responses
 */
@Controller('assistant')
@UseGuards(JwtAuthGuard)
export class AssistantController {
  constructor(private readonly assistantService: AssistantService) {}

  /**
   * POST /assistant/query
   * Process a query and return context-aware stub response
   */
  @Post('query')
  @HttpCode(HttpStatus.OK)
  async query(
    @Body() dto: M01AssistantQueryDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<M01AssistantQueryResponseDto> {
    return this.assistantService.processQuery(dto, req.user.email);
  }
}
