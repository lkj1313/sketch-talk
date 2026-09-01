import type { MemberGameRecordResponse } from '@sketch-talk/contracts';
import { Controller, Get, UseGuards } from '@nestjs/common';
import { CurrentUser } from '@/auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import type { AccessTokenPayload } from '@/auth/types/auth-response.type';
import type { ControllerResponse } from '@/common/types/api-response.type';
import { GameRecordsService } from '@/game-records/game-records.service';

@UseGuards(JwtAuthGuard)
@Controller('users/me/game-records')
export class GameRecordsController {
  constructor(private readonly gameRecordsService: GameRecordsService) {}

  @Get()
  async getMemberRecord(
    @CurrentUser() currentUser: AccessTokenPayload,
  ): Promise<ControllerResponse<MemberGameRecordResponse>> {
    return {
      data: await this.gameRecordsService.getMemberRecord(currentUser.sub),
    };
  }
}
