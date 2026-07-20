import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ERRORS } from '../Errors';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger('ExceptionFilter');

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | string[] = ERRORS.INTERNAL_SERVER_ERROR;
    let error = ERRORS.INTERNAL_SERVER_ERROR;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const body = exception.getResponse();
      if (typeof body === 'string') {
        message = body;
      } else if (typeof body === 'object' && body !== null) {
        message = (body as any).message ?? exception.message;
        error = (body as any).error ?? exception.name;
      }
    } else if (exception instanceof Error) {
      this.logger.error(`${ERRORS.UNHANDLED_EXCEPTION}: ${exception.message}`, exception.stack);
    } else {
      this.logger.error(`${ERRORS.UNHANDLED_NON_ERR_EXCEPTION}: ${JSON.stringify(exception)}`);
    }

    if (status === HttpStatus.INTERNAL_SERVER_ERROR) {
      message = ERRORS.INTERNAL_SERVER_ERROR;
      error = ERRORS.INTERNAL_SERVER_ERROR;
    }

    response.status(status).json({
      statusCode: status,
      error,
      message,
      path: request.url,
      timestamp: new Date().toISOString(),
    });
  }
}
