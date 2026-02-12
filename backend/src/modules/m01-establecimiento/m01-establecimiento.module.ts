import { Module } from '@nestjs/common';
import { UserModule } from './user';
import { RoleModule } from './role';
import { PermissionModule } from './permission';
import { SessionModule } from './session';

@Module({
  imports: [UserModule, RoleModule, PermissionModule, SessionModule],
  exports: [UserModule, RoleModule, PermissionModule, SessionModule],
})
export class M01EstablecimientoModule {}
