import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { ADMIN_CONFIG_UPDATED_EVENT, AdminConfigUpdatedPayload } from '../announcement/announcement.service';

@Injectable()
export class AdminConfigListener {
  @OnEvent(ADMIN_CONFIG_UPDATED_EVENT)
  handleAdminConfigUpdated(payload: AdminConfigUpdatedPayload) {
    // Log the event for observability
    console.log(`[AdminConfigListener] Event received: ${payload.key}`, payload.value);

    // In a real implementation, this could:
    // 1. Broadcast to connected WebSocket clients
    // 2. Push to a message queue (BullMQ)
    // 3. Invalidate caches
    // 4. Trigger notifications to other services
  }
}
