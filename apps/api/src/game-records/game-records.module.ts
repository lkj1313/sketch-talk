import { Module } from '@nestjs/common';
import { AuthModule } from '@/auth/auth.module';
import { GameRecordsController } from '@/game-records/game-records.controller';
import { GameRecordsService } from '@/game-records/game-records.service';

@Module({
  imports: [AuthModule],
  controllers: [GameRecordsController],
  providers: [GameRecordsService],
})
export class GameRecordsModule {}
