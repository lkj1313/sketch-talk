import type { UpdateReadyRequest } from '@sketch-talk/contracts';
import { IsBoolean } from 'class-validator';

export class UpdateReadyDto implements UpdateReadyRequest {
  @IsBoolean()
  isReady!: boolean;
}
