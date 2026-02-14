import { Injectable, Logger } from '@nestjs/common';
import {
  M01AssistantQueryDto,
  M01AssistantQueryResponseDto,
} from '../dto/assistant-query.dto';

/**
 * Service for AI assistant context-aware queries
 * Provides stub responses based on module/route context
 */
@Injectable()
export class AssistantService {
  private readonly logger = new Logger(AssistantService.name);

  /**
   * Module-specific response templates
   */
  private readonly moduleResponses: Record<string, string> = {
    auth: 'For authentication-related questions, please refer to your account settings or contact support.',
    admin: 'Administrative functions are restricted to authorized personnel. Please contact your system administrator.',
    teacher: 'Teacher resources are available in the Teacher Dashboard. Check your assigned classrooms for more details.',
    org: 'Organization and institution management can be found in the organizational settings section.',
    default: 'I can help you with various questions about the system. Please provide more context about what you need assistance with.',
  };

  /**
   * Route-specific response templates
   */
  private readonly routeResponses: Record<string, string> = {
    '/auth/login': 'To log in, use your registered email and password. If you forgot your password, use the forgot password feature.',
    '/auth/sessions': 'Your active sessions show all devices where you are currently logged in. You can revoke any session for security.',
    '/admin/users': 'The users management section allows you to view, create, and modify user accounts.',
    '/admin/config': 'System configuration settings control global behavior of the application.',
    '/teacher/classrooms': 'Your classrooms section shows all classes assigned to you. You can manage students and materials here.',
  };

  /**
   * Process a context-aware assistant query
   * Returns stub response based on module and route context
   */
  async query(
    dto: M01AssistantQueryDto,
    userEmail: string,
  ): Promise<M01AssistantQueryResponseDto> {
    this.logger.log(
      `Assistant query from ${userEmail}: module=${dto.module || 'none'}, route=${dto.route || 'none'}`,
    );

    let response: string;

    // First check for route-specific response
    if (dto.route && this.routeResponses[dto.route]) {
      response = this.routeResponses[dto.route];
    }
    // Then check for module-specific response
    else if (dto.module && this.moduleResponses[dto.module]) {
      response = this.moduleResponses[dto.module];
    }
    // Default response
    else {
      response = this.moduleResponses.default;
    }

    // Append the original query echo for testing purposes
    response = `${response} [Query received: "${dto.query.substring(0, 100)}${dto.query.length > 100 ? '...' : ''}"]`;

    this.logger.log(`Assistant response generated for ${userEmail}`);

    return {
      response,
      module: dto.module,
      route: dto.route,
      timestamp: new Date().toISOString(),
    };
  }
}
