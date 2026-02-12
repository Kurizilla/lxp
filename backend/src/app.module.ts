import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './common/auth/auth.module';
import { M01EstablecimientoModule } from './modules/m01-establecimiento/m01-establecimiento.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    M01EstablecimientoModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
