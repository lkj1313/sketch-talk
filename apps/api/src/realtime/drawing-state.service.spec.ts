import type { DrawingStroke } from '@sketch-talk/contracts';
import { DrawingStateService } from '@/realtime/drawing-state.service';

describe('DrawingStateService', () => {
  const roundId = '123e4567-e89b-42d3-a456-426614174000';
  const stroke: DrawingStroke = {
    roundId,
    strokeId: '123e4567-e89b-42d3-a456-426614174001',
    tool: 'PEN',
    color: '#000000',
    width: 5,
    points: [{ x: 0.1, y: 0.2 }],
  };

  it('현재 라운드의 그림 선을 순서대로 저장한다', () => {
    const service = new DrawingStateService();

    expect(service.appendStroke(stroke)).toBe(true);
    expect(service.getSyncEvent(roundId)).toEqual({
      roundId,
      strokes: [stroke],
    });
  });

  it('전체 지우기 후 빈 그림 기록을 반환한다', () => {
    const service = new DrawingStateService();
    service.appendStroke(stroke);

    service.clearRound(roundId);

    expect(service.getSyncEvent(roundId)).toEqual({
      roundId,
      strokes: [],
    });
  });
});
