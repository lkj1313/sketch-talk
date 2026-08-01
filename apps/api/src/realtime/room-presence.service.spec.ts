import { ROOM_RECONNECT_GRACE_PERIOD_MS } from '@/realtime/constants/room-presence.constants';
import { RoomPresenceService } from '@/realtime/room-presence.service';

describe('RoomPresenceService', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('재접속 유예 시간이 지나면 퇴장 처리를 실행한다', async () => {
    const service = new RoomPresenceService();
    const leave = jest.fn().mockResolvedValue(undefined);
    service.scheduleLeave('participant-id', leave);

    await jest.advanceTimersByTimeAsync(ROOM_RECONNECT_GRACE_PERIOD_MS);

    expect(leave).toHaveBeenCalledTimes(1);
  });

  it('유예 시간 안에 재접속하면 예약된 퇴장을 취소한다', async () => {
    const service = new RoomPresenceService();
    const leave = jest.fn().mockResolvedValue(undefined);
    service.scheduleLeave('participant-id', leave);

    service.cancelLeave('participant-id');
    await jest.advanceTimersByTimeAsync(ROOM_RECONNECT_GRACE_PERIOD_MS);

    expect(leave).not.toHaveBeenCalled();
  });
});
