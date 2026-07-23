import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';
import { COMMON_ERROR } from '../constants/common-error';
import { AppException } from '../exceptions/app.exception';
import { ApiErrorResponse } from '../types/api-response.type';
import { AppError } from '../types/app-error.type';

type ExceptionBody = {
  code?: unknown;
  message?: unknown;
};

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse<Response>();
    const statusCode =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;
    const error = this.resolveError(exception, statusCode);

    if (!(exception instanceof HttpException)) {
      const stack = exception instanceof Error ? exception.stack : undefined;
      this.logger.error('처리되지 않은 서버 오류가 발생했습니다.', stack);
    }

    const body: ApiErrorResponse = {
      success: false,
      statusCode,
      error: {
        code: error.code,
        message: error.message,
      },
    };

    response.status(statusCode).json(body);
  }

  private resolveError(exception: unknown, statusCode: number): AppError {
    if (exception instanceof AppException) {
      const exceptionBody = exception.getResponse();

      if (this.isExceptionBody(exceptionBody)) {
        const code =
          typeof exceptionBody.code === 'string'
            ? exceptionBody.code
            : this.getDefaultError(statusCode).code;
        const message =
          typeof exceptionBody.message === 'string'
            ? exceptionBody.message
            : this.getDefaultError(statusCode).message;

        return { statusCode, code, message };
      }
    }

    return this.getDefaultError(statusCode);
  }

  private isExceptionBody(value: unknown): value is ExceptionBody {
    return typeof value === 'object' && value !== null;
  }

  private getDefaultError(statusCode: number): AppError {
    switch (statusCode) {
      case 400:
        return COMMON_ERROR.BAD_REQUEST;
      case 401:
        return COMMON_ERROR.UNAUTHORIZED;
      case 403:
        return COMMON_ERROR.FORBIDDEN;
      case 404:
        return COMMON_ERROR.NOT_FOUND;
      case 409:
        return COMMON_ERROR.CONFLICT;
      case 429:
        return COMMON_ERROR.TOO_MANY_REQUESTS;
      default:
        return COMMON_ERROR.INTERNAL_SERVER_ERROR;
    }
  }
}
