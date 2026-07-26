import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CurrentActor } from '@/auth/decorators/current-actor.decorator';
import { ActorGuard } from '@/auth/guards/actor.guard';
import type { RequestActor } from '@/auth/types/request-actor.type';
import type { ControllerResponse } from '@/common/types/api-response.type';
import { CreateRoomDto } from '@/rooms/dto/create-room.dto';
import { GetRoomsQueryDto } from '@/rooms/dto/get-rooms-query.dto';
import { JoinRoomDto } from '@/rooms/dto/join-room.dto';
import { JoinRoomResponseDto } from '@/rooms/dto/join-room-response.dto';
import { RoomCodeParamDto } from '@/rooms/dto/room-code-param.dto';
import { RoomDetailResponseDto } from '@/rooms/dto/room-detail-response.dto';
import { RoomResponseDto } from '@/rooms/dto/room-response.dto';
import { RoomsService } from '@/rooms/rooms.service';

@Controller('rooms')
export class RoomsController {
  constructor(private readonly roomsService: RoomsService) {}

  @Get()
  async findAll(
    @Query() dto: GetRoomsQueryDto,
  ): Promise<ControllerResponse<RoomResponseDto[]>> {
    const { rooms, meta } = await this.roomsService.findAll(dto);

    return { data: rooms, meta };
  }

  @Get(':code')
  async findByCode(
    @Param() params: RoomCodeParamDto,
  ): Promise<ControllerResponse<RoomDetailResponseDto>> {
    const room = await this.roomsService.findByCode(params.code);

    return { data: room };
  }

  @UseGuards(ActorGuard)
  @Delete(':code/participants/me')
  async leave(
    @CurrentActor() actor: RequestActor,
    @Param() params: RoomCodeParamDto,
  ): Promise<ControllerResponse<null>> {
    await this.roomsService.leave(actor, params.code);

    return { data: null };
  }

  @UseGuards(ActorGuard)
  @Post(':code/participants')
  async join(
    @CurrentActor() actor: RequestActor,
    @Param() params: RoomCodeParamDto,
    @Body() dto: JoinRoomDto,
  ): Promise<ControllerResponse<JoinRoomResponseDto>> {
    const result = await this.roomsService.join(actor, params.code, dto);

    return { data: result };
  }

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
