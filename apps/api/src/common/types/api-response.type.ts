import type { ApiMeta } from '@sketch-talk/contracts';

export type {
  ApiErrorResponse,
  ApiMeta,
  ApiResponse,
  ApiSuccessResponse,
} from '@sketch-talk/contracts';

export interface ControllerResponse<T> {
  data: T;
  meta?: ApiMeta;
}
