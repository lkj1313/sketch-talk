import type { RefreshResponse } from '@sketch-talk/contracts';

export class RefreshResponseDto implements RefreshResponse {
  accessToken: string;

  constructor(accessToken: string) {
    this.accessToken = accessToken;
  }
}
