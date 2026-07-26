import { Module } from '@nestjs/common';
import { GuestSessionController } from '@/guest-session/guest-session.controller';
import { GuestSessionService } from '@/guest-session/guest-session.service';

@Module({
  controllers: [GuestSessionController],
  providers: [GuestSessionService],
})
export class GuestSessionModule {}
