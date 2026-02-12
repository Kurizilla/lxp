import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { WinstonModule } from 'nest-winston';
import * as winston from 'winston';
import { PrismaModule } from './common/prisma/prisma.module';
import { M01EstablecimientoModule } from './modules/m01-establecimiento/m01-establecimiento.module';
import { JwtAuthGuard } from './modules/m01-establecimiento/auth/auth.guard';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    WinstonModule.forRoot({
      transports: [
        new winston.transports.Console({
          format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
        }),
      ],
      level: process.env.LOG_LEVEL || 'info',
    }),
    PrismaModule,
    M01EstablecimientoModule,
  ],
  controllers: [],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
