import type { GuestSessionResponse } from '@sketch-talk/contracts';

export class GuestSessionResponseDto implements GuestSessionResponse {
  expiresAt: string;

  constructor(expiresAt: Date) {
    this.expiresAt = expiresAt.toISOString();
  }
}
