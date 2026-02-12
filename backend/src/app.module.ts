import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { PrismaModule } from './prisma';
import { NotificationModule } from './modules/m01-establecimiento/notification';
import { AnnouncementModule } from './modules/m01-establecimiento/announcement';
import { EventsModule } from './modules/m01-establecimiento/events';

@Module({
  imports: [
    EventEmitterModule.forRoot(),
    PrismaModule,
    NotificationModule,
    AnnouncementModule,
    EventsModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
