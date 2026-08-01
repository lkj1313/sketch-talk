import { RealtimeRateLimitService } from '@/realtime/realtime-rate-limit.service';

describe('RealtimeRateLimitService', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-08-01T00:00:00.000Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('설정된 시간 구간의 요청 횟수를 초과하면 거부한다', () => {
    const service = new RealtimeRateLimitService();
    const rule = { limit: 2, windowMs: 1_000 };

    expect(service.consume('socket-id', 'drawing:stroke', rule)).toBe(true);
    expect(service.consume('socket-id', 'drawing:stroke', rule)).toBe(true);
    expect(service.consume('socket-id', 'drawing:stroke', rule)).toBe(false);
  });

  it('제한 시간이 지나면 다시 요청을 허용한다', () => {
    const service = new RealtimeRateLimitService();
    const rule = { limit: 1, windowMs: 1_000 };
    service.consume('socket-id', 'game:message', rule);

    jest.advanceTimersByTime(1_001);

    expect(service.consume('socket-id', 'game:message', rule)).toBe(true);
  });

  it('소켓 연결이 종료되면 해당 요청 기록을 제거한다', () => {
    const service = new RealtimeRateLimitService();
    const rule = { limit: 1, windowMs: 1_000 };
    service.consume('socket-id', 'drawing:clear', rule);

    service.clearSocket('socket-id');

    expect(service.consume('socket-id', 'drawing:clear', rule)).toBe(true);
  });
});
