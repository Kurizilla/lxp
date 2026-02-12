import {
  Injectable,
  CanActivate,
  ExecutionContext,
} from '@nestjs/common';
import { CurrentUserPayload } from '../decorators/current-user.decorator';

/**
 * JWT Auth Guard - Stub implementation for development
 * In production, this would validate JWT tokens via @nestjs/passport
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();

    // Stub: Extract user from header or use mock user for development
    const authHeader = request.headers.authorization;

    if (!authHeader) {
      // For development/testing, inject a mock user
      request.user = this.getMockUser();
      return true;
    }

    // In production, validate JWT token here
    // For now, inject mock user
    request.user = this.getMockUser();
    return true;
  }

  private getMockUser(): CurrentUserPayload {
    return {
      userId: BigInt(1),
      email: 'test@example.com',
      roles: ['user'],
    };
  }
}
