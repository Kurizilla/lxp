import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../common/prisma';
import {
  M01LoginDto,
  M01LoginResponseDto,
  M01GoogleLoginDto,
  M01GoogleLoginResponseDto,
  M01ForgotPasswordDto,
  M01ForgotPasswordResponseDto,
  M01SessionDto,
  M01SessionsResponseDto,
  M01DeleteSessionResponseDto,
} from '../dto';
import { EMAIL_QUEUE } from './email.processor';
import { JwtPayload, AuthenticatedUser } from './jwt.strategy';
import { randomBytes } from 'crypto';

/**
 * Request metadata for session creation
 */
export interface RequestMetadata {
  ip_address?: string;
  user_agent?: string;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly JWT_EXPIRES_IN = 24 * 60 * 60; // 24 hours in seconds
  private readonly SESSION_EXPIRES_IN = 7 * 24 * 60 * 60 * 1000; // 7 days in ms

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    @InjectQueue(EMAIL_QUEUE) private readonly emailQueue: Queue,
  ) {}

  /**
   * Authenticate user with email and password
   */
  async login(
    dto: M01LoginDto,
    metadata: RequestMetadata,
  ): Promise<M01LoginResponseDto> {
    // Find user by email
    const user = await this.prisma.m01_users.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (!user.is_active) {
      throw new UnauthorizedException('Account is inactive');
    }

    if (!user.password_hash) {
      throw new UnauthorizedException(
        'Password login not available for this account. Please use SSO.',
      );
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(dto.password, user.password_hash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // Create session and generate JWT
    const session = await this.createSession(user.id, metadata);
    const token = this.generateJwt(user.id, user.email, session.id);

    this.logger.log(`User ${user.email} logged in successfully`);

    return {
      access_token: token,
      token_type: 'Bearer',
      expires_in: this.JWT_EXPIRES_IN,
      user: {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
      },
    };
  }

  /**
   * Authenticate or register user with Google OAuth
   */
  async googleLogin(
    dto: M01GoogleLoginDto,
    metadata: RequestMetadata,
  ): Promise<M01GoogleLoginResponseDto> {
    // In production, verify the Google ID token with Google's API
    // For now, we decode the mock token structure
    const googleUserData = this.decodeGoogleToken(dto.id_token);

    let user = await this.prisma.m01_users.findFirst({
      where: {
        OR: [
          { google_id: googleUserData.sub },
          { email: googleUserData.email.toLowerCase() },
        ],
      },
    });

    let isNewUser = false;

    if (!user) {
      // Create new user
      user = await this.prisma.m01_users.create({
        data: {
          email: googleUserData.email.toLowerCase(),
          google_id: googleUserData.sub,
          first_name: googleUserData.given_name,
          last_name: googleUserData.family_name,
          is_active: true,
        },
      });
      isNewUser = true;

      // Queue welcome email
      await this.emailQueue.add('send_welcome', {
        to: user.email,
        subject: 'Welcome to our platform',
        template: 'welcome',
        context: { first_name: user.first_name },
      });

      this.logger.log(`New user created via Google: ${user.email}`);
    } else {
      // Update Google ID if not set
      if (!user.google_id) {
        await this.prisma.m01_users.update({
          where: { id: user.id },
          data: { google_id: googleUserData.sub },
        });
      }

      if (!user.is_active) {
        throw new UnauthorizedException('Account is inactive');
      }
    }

    // Create session and generate JWT
    const session = await this.createSession(user.id, metadata);
    const token = this.generateJwt(user.id, user.email, session.id);

    this.logger.log(`User ${user.email} logged in via Google`);

    return {
      access_token: token,
      token_type: 'Bearer',
      expires_in: this.JWT_EXPIRES_IN,
      user: {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        google_id: user.google_id,
      },
      is_new_user: isNewUser,
    };
  }

  /**
   * Initiate password reset flow
   */
  async forgotPassword(
    dto: M01ForgotPasswordDto,
  ): Promise<M01ForgotPasswordResponseDto> {
    const user = await this.prisma.m01_users.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    // Always return success to prevent email enumeration
    if (!user || !user.is_active || !user.password_hash) {
      this.logger.warn(
        `Password reset requested for non-existent or SSO account: ${dto.email}`,
      );
      return {
        message:
          'If an account exists with this email, you will receive password reset instructions.',
      };
    }

    // Generate reset token
    const resetToken = randomBytes(32).toString('hex');

    // Queue email job
    await this.emailQueue.add('send_password_reset', {
      to: user.email,
      subject: 'Password Reset Request',
      template: 'password_reset',
      context: {
        first_name: user.first_name,
        reset_token: resetToken,
        reset_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`,
      },
    });

    this.logger.log(`Password reset email queued for: ${user.email}`);

    return {
      message:
        'If an account exists with this email, you will receive password reset instructions.',
    };
  }

  /**
   * Get all sessions for the authenticated user
   */
  async getSessions(
    user: AuthenticatedUser,
  ): Promise<M01SessionsResponseDto> {
    const sessions = await this.prisma.m01_user_sessions.findMany({
      where: {
        user_id: user.id,
        revoked_at: null,
        expires_at: { gte: new Date() },
      },
      orderBy: { created_at: 'desc' },
    });

    const sessionDtos: M01SessionDto[] = sessions.map((session) => ({
      id: session.id,
      ip_address: session.ip_address,
      user_agent: session.user_agent,
      created_at: session.created_at,
      expires_at: session.expires_at,
      is_current: session.id === user.session_id,
    }));

    return {
      sessions: sessionDtos,
      total: sessionDtos.length,
    };
  }

  /**
   * Delete (revoke) a specific session
   */
  async deleteSession(
    sessionId: string,
    user: AuthenticatedUser,
  ): Promise<M01DeleteSessionResponseDto> {
    const session = await this.prisma.m01_user_sessions.findFirst({
      where: {
        id: sessionId,
        user_id: user.id,
      },
    });

    if (!session) {
      throw new NotFoundException('Session not found');
    }

    if (session.revoked_at) {
      throw new BadRequestException('Session is already revoked');
    }

    await this.prisma.m01_user_sessions.update({
      where: { id: sessionId },
      data: { revoked_at: new Date() },
    });

    this.logger.log(`Session ${sessionId} revoked for user ${user.email}`);

    return {
      message: 'Session successfully revoked',
      session_id: sessionId,
    };
  }

  /**
   * Create a new session for a user
   */
  private async createSession(
    userId: string,
    metadata: RequestMetadata,
  ) {
    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + this.SESSION_EXPIRES_IN);

    return this.prisma.m01_user_sessions.create({
      data: {
        user_id: userId,
        token,
        ip_address: metadata.ip_address || null,
        user_agent: metadata.user_agent || null,
        expires_at: expiresAt,
      },
    });
  }

  /**
   * Generate JWT token
   */
  private generateJwt(userId: string, email: string, sessionId: string): string {
    const payload: JwtPayload = {
      sub: userId,
      email,
      session_id: sessionId,
    };

    return this.jwtService.sign(payload);
  }

  /**
   * Decode Google ID token (mock implementation)
   * In production, use Google's tokeninfo endpoint or library
   */
  private decodeGoogleToken(idToken: string): {
    sub: string;
    email: string;
    given_name?: string;
    family_name?: string;
  } {
    // For development/testing, expect a base64 encoded JSON
    try {
      const decoded = Buffer.from(idToken, 'base64').toString('utf-8');
      const data = JSON.parse(decoded);

      if (!data.sub || !data.email) {
        throw new BadRequestException('Invalid Google ID token');
      }

      return {
        sub: data.sub,
        email: data.email,
        given_name: data.given_name,
        family_name: data.family_name,
      };
    } catch {
      throw new BadRequestException('Invalid Google ID token format');
    }
  }
}
