import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { Request } from 'express';
import { AuthService, RequestMetadata } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { AuthenticatedUser } from './jwt.strategy';
import {
  M01LoginDto,
  M01LoginResponseDto,
  M01GoogleLoginDto,
  M01GoogleLoginResponseDto,
  M01ForgotPasswordDto,
  M01ForgotPasswordResponseDto,
  M01SessionsResponseDto,
  M01DeleteSessionResponseDto,
} from '../dto';

/**
 * Extended Express Request with authenticated user
 */
interface AuthenticatedRequest extends Request {
  user: AuthenticatedUser;
}

/**
 * Controller for authentication endpoints
 */
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * POST /auth/login
   * Authenticate user with email and password
   */
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() dto: M01LoginDto,
    @Req() req: Request,
  ): Promise<M01LoginResponseDto> {
    const metadata: RequestMetadata = {
      ip_address: this.getIpAddress(req),
      user_agent: req.headers['user-agent'],
    };

    return this.authService.login(dto, metadata);
  }

  /**
   * POST /auth/google-login
   * Authenticate user with Google OAuth
   */
  @Post('google-login')
  @HttpCode(HttpStatus.OK)
  async googleLogin(
    @Body() dto: M01GoogleLoginDto,
    @Req() req: Request,
  ): Promise<M01GoogleLoginResponseDto> {
    const metadata: RequestMetadata = {
      ip_address: this.getIpAddress(req),
      user_agent: req.headers['user-agent'],
    };

    return this.authService.googleLogin(dto, metadata);
  }

  /**
   * POST /auth/forgot-password
   * Initiate password reset flow
   */
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  async forgotPassword(
    @Body() dto: M01ForgotPasswordDto,
  ): Promise<M01ForgotPasswordResponseDto> {
    return this.authService.forgotPassword(dto);
  }

  /**
   * GET /auth/sessions
   * List all active sessions for the authenticated user
   */
  @Get('sessions')
  @UseGuards(JwtAuthGuard)
  async getSessions(
    @Req() req: AuthenticatedRequest,
  ): Promise<M01SessionsResponseDto> {
    return this.authService.getSessions(req.user);
  }

  /**
   * DELETE /auth/sessions/:id
   * Revoke a specific session
   */
  @Delete('sessions/:id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async deleteSession(
    @Param('id') sessionId: string,
    @Req() req: AuthenticatedRequest,
  ): Promise<M01DeleteSessionResponseDto> {
    return this.authService.deleteSession(sessionId, req.user);
  }

  /**
   * Extract client IP address from request
   */
  private getIpAddress(req: Request): string | undefined {
    const forwarded = req.headers['x-forwarded-for'];
    if (forwarded) {
      const ips = (Array.isArray(forwarded) ? forwarded[0] : forwarded).split(',');
      return ips[0].trim();
    }
    return req.socket?.remoteAddress;
  }
}
