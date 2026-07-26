import type { GetRoomsQuery, RoomListStatus } from '@sketch-talk/contracts';
import { Type } from 'class-transformer';
import { IsIn, IsInt, Max, Min } from 'class-validator';
import { RoomStatus } from '@/generated/prisma/client';

export class GetRoomsQueryDto implements GetRoomsQuery {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize = 20;

  @IsIn([RoomStatus.WAITING, RoomStatus.PLAYING])
  status: RoomListStatus = RoomStatus.WAITING;
}
