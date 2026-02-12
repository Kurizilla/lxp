import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user';
import { RoleModule } from './role';
import { PermissionModule } from './permission';
import { SessionModule } from './session';

@Module({
  imports: [AuthModule, UserModule, RoleModule, PermissionModule, SessionModule],
  exports: [AuthModule, UserModule, RoleModule, PermissionModule, SessionModule],
})
export class M01EstablecimientoModule {}
