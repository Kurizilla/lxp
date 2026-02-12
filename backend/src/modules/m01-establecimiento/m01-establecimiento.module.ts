import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [AuthModule],
  exports: [AuthModule],
})
export class M01EstablecimientoModule {}
