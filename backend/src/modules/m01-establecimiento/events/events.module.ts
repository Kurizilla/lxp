import { Module } from '@nestjs/common';
import { AdminConfigListener } from './admin-config.listener';

@Module({
  providers: [AdminConfigListener],
  exports: [AdminConfigListener],
})
export class EventsModule {}
