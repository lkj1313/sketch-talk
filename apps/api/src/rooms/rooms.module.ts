import { Module } from '@nestjs/common';
import { AuthModule } from '@/auth/auth.module';
import { GamesModule } from '@/games/games.module';
import { RoomsController } from '@/rooms/rooms.controller';
import { RoomsService } from '@/rooms/rooms.service';

@Module({
  imports: [AuthModule, GamesModule],
  controllers: [RoomsController],
  providers: [RoomsService],
  exports: [RoomsService],
})
export class RoomsModule {}
