import { HttpException } from '@nestjs/common';
import { AppError } from '@/common/types/app-error.type';

export class AppException extends HttpException {
  constructor(error: AppError) {
    super(
      {
        code: error.code,
        message: error.message,
      },
      error.statusCode,
    );
  }
}
