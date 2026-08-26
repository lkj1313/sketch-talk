import { Injectable, type OnModuleDestroy } from '@nestjs/common';
import { ROOM_RECONNECT_GRACE_PERIOD_MS } from '@/realtime/constants/room-presence.constants';

@Injectable()
export class RoomPresenceService implements OnModuleDestroy {
  private readonly leaveTimers = new Map<
    string,
    ReturnType<typeof setTimeout>
  >();

  scheduleLeave(participantId: string, leave: () => Promise<void>): void {
    this.cancelLeave(participantId);

    const timer = setTimeout(() => {
      this.leaveTimers.delete(participantId);
      void leave();
    }, ROOM_RECONNECT_GRACE_PERIOD_MS);

    this.leaveTimers.set(participantId, timer);
  }

  cancelLeave(participantId: string): void {
    const timer = this.leaveTimers.get(participantId);

    if (!timer) {
      return;
    }

    clearTimeout(timer);
    this.leaveTimers.delete(participantId);
  }

  onModuleDestroy(): void {
    for (const timer of this.leaveTimers.values()) {
      clearTimeout(timer);
    }

    this.leaveTimers.clear();
  }
}
