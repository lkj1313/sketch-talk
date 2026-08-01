export type DrawingTool = "PEN" | "ERASER";

export interface DrawingPoint {
  x: number;
  y: number;
}

export interface DrawingStroke {
  roundId: string;
  strokeId: string;
  tool: DrawingTool;
  color: string;
  width: number;
  points: DrawingPoint[];
}

export interface DrawingClearRequest {
  roundId: string;
}

export interface DrawingSyncEvent {
  roundId: string;
  strokes: DrawingStroke[];
}
