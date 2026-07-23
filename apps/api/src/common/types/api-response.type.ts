export interface ApiMeta {
  total: number;
  page: number;
  pageSize: number;
  hasNext: boolean;
}

export interface ControllerResponse<T> {
  data: T;
  meta?: ApiMeta;
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
