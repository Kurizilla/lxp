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
import { SelectionController } from './selection/selection.controller';
import { SelectionService } from './selection/selection.service';
import { AssistantController } from './assistant/assistant.controller';
import { AssistantService } from './assistant/assistant.service';

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
  controllers: [SelectionController, AssistantController],
  providers: [SelectionService, AssistantService],
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
    SelectionService,
    AssistantService,
  ],
})
export class M01EstablecimientoModule {}
