import { Module } from '@nestjs/common';
import { AuthModule } from '@/auth/auth.module';
import { GamesModule } from '@/games/games.module';
import { DrawingStateService } from '@/realtime/drawing-state.service';
import { RealtimeRateLimitService } from '@/realtime/realtime-rate-limit.service';
import { RoomPresenceService } from '@/realtime/room-presence.service';
import { RoomGateway } from '@/realtime/room.gateway';
import { SocketAuthService } from '@/realtime/socket-auth.service';
import { RoomsModule } from '@/rooms/rooms.module';

@Module({
  imports: [AuthModule, RoomsModule, GamesModule],
  providers: [
    RoomGateway,
    SocketAuthService,
    DrawingStateService,
    RealtimeRateLimitService,
    RoomPresenceService,
  ],
})
export class RealtimeModule {}
