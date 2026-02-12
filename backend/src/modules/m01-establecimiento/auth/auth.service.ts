import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import { PrismaService } from '../../../common/prisma/prisma.service';
import {
  LoginDto,
  RegisterDto,
  PasswordRecoveryRequestDto,
  PasswordResetDto,
  GoogleAuthDto,
  AuthResponseDto,
  TokenResponseDto,
  UserResponseDto,
} from '../dto';

const SALT_ROUNDS = 10;
const TOKEN_EXPIRY_SECONDS = 3600; // 1 hour
const REFRESH_TOKEN_EXPIRY_SECONDS = 604800; // 7 days
const PASSWORD_RESET_EXPIRY_MS = 3600000; // 1 hour

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async login(loginDto: LoginDto): Promise<AuthResponseDto> {
    const { email, password } = loginDto;

    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user || !user.password_hash) {
      throw new UnauthorizedException({
        code: 'INVALID_CREDENTIALS',
        message: 'Invalid email or password',
      });
    }

    if (!user.is_active) {
      throw new UnauthorizedException({
        code: 'ACCOUNT_DISABLED',
        message: 'Account is disabled',
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password_hash);

    if (!isPasswordValid) {
      throw new UnauthorizedException({
        code: 'INVALID_CREDENTIALS',
        message: 'Invalid email or password',
      });
    }

    // Update last login
    await this.prisma.user.update({
      where: { id: user.id },
      data: { last_login_at: new Date() },
    });

    return this.generateAuthResponse(user);
  }

  async register(registerDto: RegisterDto): Promise<AuthResponseDto> {
    const { email, password, name } = registerDto;

    // Check if user already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException({
        code: 'EMAIL_EXISTS',
        message: 'Email already registered',
      });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    // Create user
    const user = await this.prisma.user.create({
      data: {
        email,
        password_hash: passwordHash,
        name,
      },
    });

    return this.generateAuthResponse(user);
  }

  async requestPasswordRecovery(
    dto: PasswordRecoveryRequestDto,
  ): Promise<{ message: string }> {
    const { email } = dto;

    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    // Always return success to prevent email enumeration
    if (!user) {
      return { message: 'If the email exists, a recovery link has been sent' };
    }

    // Generate reset token
    const resetToken = randomBytes(32).toString('hex');
    const resetExpires = new Date(Date.now() + PASSWORD_RESET_EXPIRY_MS);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        password_reset_token: resetToken,
        password_reset_expires: resetExpires,
      },
    });

    // TODO: Send email with reset token
    // In production, integrate with email service

    return { message: 'If the email exists, a recovery link has been sent' };
  }

  async resetPassword(dto: PasswordResetDto): Promise<{ message: string }> {
    const { token, newPassword } = dto;

    const user = await this.prisma.user.findFirst({
      where: {
        password_reset_token: token,
        password_reset_expires: {
          gt: new Date(),
        },
      },
    });

    if (!user) {
      throw new BadRequestException({
        code: 'INVALID_TOKEN',
        message: 'Invalid or expired reset token',
      });
    }

    const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        password_hash: passwordHash,
        password_reset_token: null,
        password_reset_expires: null,
      },
    });

    return { message: 'Password successfully reset' };
  }

  async googleAuth(dto: GoogleAuthDto): Promise<AuthResponseDto> {
    // Stub implementation for Google SSO
    // In production, verify the idToken with Google's OAuth2 API
    const { idToken } = dto;

    // This is a stub - in production you would:
    // 1. Verify the idToken with Google
    // 2. Extract user info (email, googleId, name)
    // 3. Create or find user
    // 4. Return auth response

    // For now, throw an error indicating SSO is not fully implemented
    throw new BadRequestException({
      code: 'SSO_NOT_CONFIGURED',
      message: 'Google SSO is not fully configured. Please use email/password login.',
      details: { idToken: idToken ? 'provided' : 'missing' },
    });
  }

  async createSession(
    userId: bigint,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<string> {
    const token = randomBytes(64).toString('hex');
    const expiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRY_SECONDS * 1000);

    await this.prisma.session.create({
      data: {
        user_id: userId,
        token,
        ip_address: ipAddress,
        user_agent: userAgent,
        expires_at: expiresAt,
      },
    });

    return token;
  }

  async validateSession(token: string): Promise<{ userId: bigint } | null> {
    const session = await this.prisma.session.findUnique({
      where: { token },
    });

    if (!session || session.expires_at < new Date()) {
      return null;
    }

    return { userId: session.user_id };
  }

  async revokeSession(token: string): Promise<void> {
    await this.prisma.session.deleteMany({
      where: { token },
    });
  }

  async revokeAllUserSessions(userId: bigint): Promise<void> {
    await this.prisma.session.deleteMany({
      where: { user_id: userId },
    });
  }

  async getUserSessions(userId: bigint) {
    return this.prisma.session.findMany({
      where: { user_id: userId },
      select: {
        id: true,
        ip_address: true,
        user_agent: true,
        created_at: true,
        expires_at: true,
      },
    });
  }

  async validateUser(userId: bigint) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.is_active) {
      return null;
    }

    return {
      id: user.id.toString(),
      email: user.email,
      name: user.name,
      role: user.role,
    };
  }

  private generateAuthResponse(user: {
    id: bigint;
    email: string;
    name: string | null;
    role: string;
  }): AuthResponseDto {
    const payload = {
      sub: user.id.toString(),
      email: user.email,
      role: user.role,
    };

    const accessToken = this.jwtService.sign(payload);

    const tokenResponse: TokenResponseDto = {
      accessToken,
      expiresIn: TOKEN_EXPIRY_SECONDS,
      tokenType: 'Bearer',
    };

    const userResponse: UserResponseDto = {
      id: user.id.toString(),
      email: user.email,
      name: user.name ?? undefined,
      role: user.role,
    };

    return {
      token: tokenResponse,
      user: userResponse,
    };
  }
}
