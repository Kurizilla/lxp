import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  UseGuards,
  Request,
  Param,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard, Public, Roles, RolesGuard } from './auth.guard';
import {
  LoginDto,
  RegisterDto,
  PasswordRecoveryRequestDto,
  PasswordResetDto,
  GoogleAuthDto,
  MonitoredCreateDto,
} from '../dto';

interface AuthenticatedRequest extends Request {
  user: {
    userId: string;
    email: string;
    role: string;
  };
  ip?: string;
  headers: {
    'user-agent'?: string;
  } & Headers;
}

@Controller('v1/modules/m01/est-auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Public()
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Public()
  @Post('password-recovery')
  @HttpCode(HttpStatus.OK)
  async requestPasswordRecovery(@Body() dto: PasswordRecoveryRequestDto) {
    return this.authService.requestPasswordRecovery(dto);
  }

  @Public()
  @Post('password-reset')
  @HttpCode(HttpStatus.OK)
  async resetPassword(@Body() dto: PasswordResetDto) {
    return this.authService.resetPassword(dto);
  }

  @Public()
  @Post('google')
  @HttpCode(HttpStatus.OK)
  async googleAuth(@Body() dto: GoogleAuthDto) {
    return this.authService.googleAuth(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getCurrentUser(@Request() req: AuthenticatedRequest) {
    const user = await this.authService.validateUser(BigInt(req.user.userId));
    return { data: user };
  }

  @UseGuards(JwtAuthGuard)
  @Post('sessions')
  @HttpCode(HttpStatus.CREATED)
  async createSession(@Request() req: AuthenticatedRequest) {
    const token = await this.authService.createSession(
      BigInt(req.user.userId),
      req.ip,
      req.headers['user-agent'],
    );
    return { data: { token } };
  }

  @UseGuards(JwtAuthGuard)
  @Get('sessions')
  async getUserSessions(@Request() req: AuthenticatedRequest) {
    const sessions = await this.authService.getUserSessions(BigInt(req.user.userId));
    return {
      data: sessions.map((session) => ({
        id: session.id.toString(),
        ipAddress: session.ip_address,
        userAgent: session.user_agent,
        createdAt: session.created_at,
        expiresAt: session.expires_at,
        lastActivity: session.last_activity,
      })),
    };
  }

  @UseGuards(JwtAuthGuard)
  @Delete('sessions/:token')
  @HttpCode(HttpStatus.NO_CONTENT)
  async revokeSession(@Param('token') token: string) {
    await this.authService.revokeSession(token);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('sessions')
  @HttpCode(HttpStatus.NO_CONTENT)
  async revokeAllSessions(@Request() req: AuthenticatedRequest) {
    await this.authService.revokeAllUserSessions(BigInt(req.user.userId));
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(@Request() req: AuthenticatedRequest) {
    // Invalidate all sessions for the user
    await this.authService.revokeAllUserSessions(BigInt(req.user.userId));
  }
}

@Controller('v1/modules/m01/est-monitored')
@UseGuards(JwtAuthGuard, RolesGuard)
export class MonitoredController {
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Roles('admin', 'monitor')
  async create(@Body() dto: MonitoredCreateDto, @Request() req: AuthenticatedRequest) {
    // Stub implementation for monitored create endpoint
    // This endpoint creates monitoring records for establishments
    return {
      data: {
        id: Date.now().toString(),
        establishmentId: dto.establishmentId,
        metrics: dto.metrics,
        createdBy: req.user.userId,
        createdAt: new Date().toISOString(),
      },
    };
  }
}
