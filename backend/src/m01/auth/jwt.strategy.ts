import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../common/prisma';

/**
 * JWT payload interface
 */
export interface JwtPayload {
  sub: string; // user id
  email: string;
  session_id: string;
  iat?: number;
  exp?: number;
}

/**
 * Authenticated user attached to request
 */
export interface AuthenticatedUser {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  session_id: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET') || 'default-secret-change-in-production',
    });
  }

  /**
   * Validate JWT payload and return user if valid
   */
  async validate(payload: JwtPayload): Promise<AuthenticatedUser> {
    // Verify session exists and is not revoked
    const session = await this.prisma.m01_user_sessions.findUnique({
      where: { id: payload.session_id },
      include: { user: true },
    });

    if (!session) {
      throw new UnauthorizedException('Invalid session');
    }

    if (session.revoked_at) {
      throw new UnauthorizedException('Session has been revoked');
    }

    if (new Date() > session.expires_at) {
      throw new UnauthorizedException('Session has expired');
    }

    if (!session.user.is_active) {
      throw new UnauthorizedException('User account is inactive');
    }

    return {
      id: session.user.id,
      email: session.user.email,
      first_name: session.user.first_name,
      last_name: session.user.last_name,
      session_id: session.id,
    };
  }
}
