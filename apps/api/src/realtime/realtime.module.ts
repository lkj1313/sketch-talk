import { Module } from '@nestjs/common';
import { AuthModule } from '@/auth/auth.module';
import { RoomGateway } from '@/realtime/room.gateway';
import { SocketAuthService } from '@/realtime/socket-auth.service';
import { RoomsModule } from '@/rooms/rooms.module';

@Module({
  imports: [AuthModule, RoomsModule],
  providers: [RoomGateway, SocketAuthService],
})
export class RealtimeModule {}
