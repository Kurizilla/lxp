import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';

/**
 * RFC7807 Problem Details response format
 */
interface ProblemDetails {
  type: string;
  title: string;
  status: number;
  detail?: string;
  instance?: string;
  [key: string]: unknown;
}

/**
 * Exception filter that formats all HTTP exceptions as RFC7807 Problem Details
 */
@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest();
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    const problemDetails: ProblemDetails = {
      type: this.getTypeFromStatus(status),
      title: this.getTitleFromStatus(status),
      status,
      instance: request.url,
    };

    // Extract detail from exception response
    if (typeof exceptionResponse === 'string') {
      problemDetails.detail = exceptionResponse;
    } else if (typeof exceptionResponse === 'object') {
      const responseObj = exceptionResponse as Record<string, unknown>;
      if (responseObj.message) {
        problemDetails.detail = Array.isArray(responseObj.message)
          ? responseObj.message.join(', ')
          : String(responseObj.message);
      }
      // Include validation errors if present
      if (responseObj.errors) {
        problemDetails.errors = responseObj.errors;
      }
    }

    response.status(status).json(problemDetails);
  }

  private getTypeFromStatus(status: number): string {
    const typeMap: Record<number, string> = {
      [HttpStatus.BAD_REQUEST]: 'https://httpstatuses.com/400',
      [HttpStatus.UNAUTHORIZED]: 'https://httpstatuses.com/401',
      [HttpStatus.FORBIDDEN]: 'https://httpstatuses.com/403',
      [HttpStatus.NOT_FOUND]: 'https://httpstatuses.com/404',
      [HttpStatus.CONFLICT]: 'https://httpstatuses.com/409',
      [HttpStatus.UNPROCESSABLE_ENTITY]: 'https://httpstatuses.com/422',
      [HttpStatus.INTERNAL_SERVER_ERROR]: 'https://httpstatuses.com/500',
    };
    return typeMap[status] || `https://httpstatuses.com/${status}`;
  }

  private getTitleFromStatus(status: number): string {
    const titleMap: Record<number, string> = {
      [HttpStatus.BAD_REQUEST]: 'Bad Request',
      [HttpStatus.UNAUTHORIZED]: 'Unauthorized',
      [HttpStatus.FORBIDDEN]: 'Forbidden',
      [HttpStatus.NOT_FOUND]: 'Not Found',
      [HttpStatus.CONFLICT]: 'Conflict',
      [HttpStatus.UNPROCESSABLE_ENTITY]: 'Unprocessable Entity',
      [HttpStatus.INTERNAL_SERVER_ERROR]: 'Internal Server Error',
    };
    return titleMap[status] || 'Error';
  }
}
