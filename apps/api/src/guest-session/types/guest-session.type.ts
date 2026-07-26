import { GuestSessionResponseDto } from '@/guest-session/dto/guest-session-response.dto';

export interface IssuedGuestSession {
  result: GuestSessionResponseDto;
  guestToken: string;
}
