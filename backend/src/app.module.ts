import { Module } from '@nestjs/common';
import { M01EstablecimientoModule } from './modules/m01-establecimiento';

@Module({
  imports: [M01EstablecimientoModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
