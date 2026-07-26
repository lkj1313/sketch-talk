export interface ApiMeta {
  total: number;
  page: number;
  pageSize: number;
  hasNext: boolean;
}

export interface ApiSuccessResponse<T> {
  success: true;
  statusCode: number;
  data: T;
  meta?: ApiMeta;
}

export interface ApiErrorResponse {
  success: false;
  statusCode: number;
  error: {
    code: string;
    message: string;
  };
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;
