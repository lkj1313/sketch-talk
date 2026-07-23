import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Response } from 'express';
import { map, Observable } from 'rxjs';
import {
  ApiSuccessResponse,
  ControllerResponse,
} from '../types/api-response.type';

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<
  ControllerResponse<T>,
  ApiSuccessResponse<T>
> {
  intercept(
    context: ExecutionContext,
    next: CallHandler<ControllerResponse<T>>,
  ): Observable<ApiSuccessResponse<T>> {
    const response = context.switchToHttp().getResponse<Response>();

    return next.handle().pipe(
      map(({ data, meta }) => ({
        success: true,
        statusCode: response.statusCode,
        data,
        ...(meta !== undefined ? { meta } : {}),
      })),
    );
  }
}
