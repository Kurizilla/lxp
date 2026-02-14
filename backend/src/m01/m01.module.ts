import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { BullModule } from '@nestjs/bull';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PrismaModule } from '../common/prisma';
import { AuthController } from './auth/auth.controller';
import { AuthService } from './auth/auth.service';
import { JwtStrategy } from './auth/jwt.strategy';
import { EmailProcessor, EMAIL_QUEUE } from './auth/email.processor';
import { AdminController } from './admin/admin.controller';
import { AdminService } from './admin/admin.service';
import { M01AbilityFactory } from './casl/m01-ability.factory';
import { M01AdminGuard } from './guards/m01-admin.guard';

@Module({
  imports: [
    PrismaModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET') || 'default-secret-change-in-production',
        signOptions: {
          expiresIn: configService.get<string>('JWT_EXPIRES_IN') || '24h',
        },
      }),
      inject: [ConfigService],
    }),
    BullModule.registerQueue({
      name: EMAIL_QUEUE,
    }),
  ],
  controllers: [AuthController, AdminController],
  providers: [
    AuthService,
    JwtStrategy,
    EmailProcessor,
    AdminService,
    M01AbilityFactory,
    M01AdminGuard,
  ],
  exports: [AuthService, M01AbilityFactory],
})
export class M01Module {}
