import { Module } from '@nestjs/common';
import { InscriptionController } from './inscription.controller';
import { InscriptionService } from './inscription.service';

@Module({
  controllers: [InscriptionController],
  providers: [InscriptionService],
  exports: [InscriptionService],
})
export class InscriptionModule {}
