import { Injectable } from '@nestjs/common';
import type { DrawingStroke, DrawingSyncEvent } from '@sketch-talk/contracts';
import { DRAWING_HISTORY_MAX_POINTS } from '@/realtime/constants/drawing.constants';

type DrawingHistory = {
  strokes: DrawingStroke[];
  pointCount: number;
};

@Injectable()
export class DrawingStateService {
  private readonly histories = new Map<string, DrawingHistory>();

  appendStroke(stroke: DrawingStroke): boolean {
    const history = this.histories.get(stroke.roundId) ?? {
      strokes: [],
      pointCount: 0,
    };

    if (
      history.pointCount + stroke.points.length >
      DRAWING_HISTORY_MAX_POINTS
    ) {
      return false;
    }

    history.strokes.push(stroke);
    history.pointCount += stroke.points.length;
    this.histories.set(stroke.roundId, history);
    return true;
  }

  getSyncEvent(roundId: string): DrawingSyncEvent {
    return {
      roundId,
      strokes: [...(this.histories.get(roundId)?.strokes ?? [])],
    };
  }

  clearRound(roundId: string): void {
    this.histories.delete(roundId);
  }
}
