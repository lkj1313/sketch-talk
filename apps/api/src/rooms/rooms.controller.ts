import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { CurrentActor } from '@/auth/decorators/current-actor.decorator';
import { ActorGuard } from '@/auth/guards/actor.guard';
import type { RequestActor } from '@/auth/types/request-actor.type';
import type { ControllerResponse } from '@/common/types/api-response.type';
import { CreateRoomDto } from '@/rooms/dto/create-room.dto';
import { RoomResponseDto } from '@/rooms/dto/room-response.dto';
import { RoomsService } from '@/rooms/rooms.service';

@Controller('rooms')
export class RoomsController {
  constructor(private readonly roomsService: RoomsService) {}

  @UseGuards(ActorGuard)
  @Post()
  async create(
    @CurrentActor() actor: RequestActor,
    @Body() dto: CreateRoomDto,
  ): Promise<ControllerResponse<RoomResponseDto>> {
    const room = await this.roomsService.create(actor, dto);

    return { data: room };
  }
}
