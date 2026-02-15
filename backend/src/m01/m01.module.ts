import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { BullModule } from '@nestjs/bull';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PrismaModule } from '../common/prisma';
import { AuthController } from './auth/auth.controller';
import { AuthService } from './auth/auth.service';
import { JwtStrategy } from './auth/jwt.strategy';
import { EmailProcessor, EMAIL_QUEUE } from './auth/email.processor';
import { AdminController } from './admin/admin.controller';
import { AdminService } from './admin/admin.service';
import { TeacherController } from './teacher/teacher.controller';
import { TeacherService } from './teacher/teacher.service';
import { OrgController } from './org/org.controller';
import { OrgService } from './org/org.service';
import { NotificationsController } from './notifications/notifications.controller';
import { NotificationsService } from './notifications/notifications.service';
import { AssistantController } from './assistant/assistant.controller';
import { AssistantService } from './assistant/assistant.service';
import { M01AbilityFactory } from './casl/m01-ability.factory';
import { M01AdminGuard } from './guards/m01-admin.guard';
import { M01TeacherGuard } from './guards/m01-teacher.guard';

@Module({
  imports: [
    PrismaModule,
    EventEmitterModule.forRoot(),
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
  controllers: [AuthController, AdminController, TeacherController, OrgController, NotificationsController, AssistantController],
  providers: [
    AuthService,
    JwtStrategy,
    EmailProcessor,
    AdminService,
    TeacherService,
    OrgService,
    NotificationsService,
    AssistantService,
    M01AbilityFactory,
    M01AdminGuard,
    M01TeacherGuard,
  ],
  exports: [AuthService, M01AbilityFactory, OrgService, NotificationsService, AssistantService],
})
export class M01Module {}
