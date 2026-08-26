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

  it('애플리케이션이 종료되면 예약된 퇴장 처리를 모두 취소한다', async () => {
    const service = new RoomPresenceService();
    const firstLeave = jest.fn().mockResolvedValue(undefined);
    const secondLeave = jest.fn().mockResolvedValue(undefined);
    service.scheduleLeave('first-participant-id', firstLeave);
    service.scheduleLeave('second-participant-id', secondLeave);

    service.onModuleDestroy();
    await jest.advanceTimersByTimeAsync(ROOM_RECONNECT_GRACE_PERIOD_MS);

    expect(firstLeave).not.toHaveBeenCalled();
    expect(secondLeave).not.toHaveBeenCalled();
  });
});
