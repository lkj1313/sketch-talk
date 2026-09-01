import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from '@/app.controller';
import { AppService } from '@/app.service';
import { AuthModule } from '@/auth/auth.module';
import { GuestSessionModule } from '@/guest-session/guest-session.module';
import { GameRecordsModule } from '@/game-records/game-records.module';
import { PrismaModule } from '@/prisma/prisma.module';
import { RealtimeModule } from '@/realtime/realtime.module';
import { RoomsModule } from '@/rooms/rooms.module';
import { WordsModule } from '@/words/words.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    EventEmitterModule.forRoot(),
    ScheduleModule.forRoot(),
    PrismaModule,
    AuthModule,
    GuestSessionModule,
    GameRecordsModule,
    RoomsModule,
    RealtimeModule,
    WordsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
