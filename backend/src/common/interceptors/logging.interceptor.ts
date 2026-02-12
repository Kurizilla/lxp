import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Inject } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { trace, SpanStatusCode } from '@opentelemetry/api';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(@Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url, body, user } = request;
    const className = context.getClass().name;
    const handlerName = context.getHandler().name;
    const startTime = Date.now();

    const tracer = trace.getTracer('m01-establecimiento');
    const span = tracer.startSpan(`${className}.${handlerName}`);

    span.setAttributes({
      'http.method': method,
      'http.url': url,
      'user.id': user?.userId?.toString() || 'anonymous',
    });

    this.logger.info('Incoming request', {
      method,
      url,
      className,
      handlerName,
      userId: user?.userId?.toString() || 'anonymous',
      body: this.sanitizeBody(body),
    });

    return next.handle().pipe(
      tap({
        next: (_data) => {
          const duration = Date.now() - startTime;
          span.setStatus({ code: SpanStatusCode.OK });
          span.setAttribute('http.response_time_ms', duration);
          span.end();

          this.logger.info('Request completed', {
            method,
            url,
            className,
            handlerName,
            duration,
            statusCode: 200,
          });
        },
        error: (error) => {
          const duration = Date.now() - startTime;
          span.setStatus({ code: SpanStatusCode.ERROR, message: error.message });
          span.recordException(error);
          span.end();

          this.logger.error('Request failed', {
            method,
            url,
            className,
            handlerName,
            duration,
            error: error.message,
            stack: error.stack,
          });
        },
      }),
    );
  }

  private sanitizeBody(body: any): any {
    if (!body) return body;
    const sanitized = { ...body };
    const sensitiveFields = ['password', 'password_hash', 'token', 'accessToken', 'refreshToken'];
    for (const field of sensitiveFields) {
      if (sanitized[field]) {
        sanitized[field] = '[REDACTED]';
      }
    }
    return sanitized;
  }
}
