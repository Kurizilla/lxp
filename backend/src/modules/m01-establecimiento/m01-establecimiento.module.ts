import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user';
import { RoleModule } from './role';
import { PermissionModule } from './permission';
import { SessionModule } from './session';
import { EstablishmentModule } from './establishment/establishment.module';
import { SubjectModule } from './subject/subject.module';
import { ClassroomModule } from './classroom/classroom.module';
import { InscriptionModule } from './inscription/inscription.module';

@Module({
  imports: [
    AuthModule,
    UserModule,
    RoleModule,
    PermissionModule,
    SessionModule,
    EstablishmentModule,
    SubjectModule,
    ClassroomModule,
    InscriptionModule,
  ],
  exports: [
    AuthModule,
    UserModule,
    RoleModule,
    PermissionModule,
    SessionModule,
    EstablishmentModule,
    SubjectModule,
    ClassroomModule,
    InscriptionModule,
  ],
})
export class M01EstablecimientoModule {}
