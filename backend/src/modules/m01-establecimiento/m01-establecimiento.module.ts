import { Module } from '@nestjs/common';
import { EstablishmentModule } from './establishment/establishment.module';
import { SubjectModule } from './subject/subject.module';
import { ClassroomModule } from './classroom/classroom.module';
import { InscriptionModule } from './inscription/inscription.module';

@Module({
  imports: [
    EstablishmentModule,
    SubjectModule,
    ClassroomModule,
    InscriptionModule,
  ],
  exports: [
    EstablishmentModule,
    SubjectModule,
    ClassroomModule,
    InscriptionModule,
  ],
})
export class M01EstablecimientoModule {}
