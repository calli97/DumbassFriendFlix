import { Catch, ArgumentsHost, HttpException, Logger } from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';

@Catch()
export class LoggingExceptionFilter extends BaseExceptionFilter {
  private readonly logger = new Logger('ExceptionFilter');

  catch(exception: unknown, host: ArgumentsHost): void {
    const req = host.switchToHttp().getRequest();
    const label = `${req.method} ${req.url}`;

    if (exception instanceof HttpException) {
      if (exception.getStatus() >= 500) {
        this.logger.error(exception.stack ?? exception.message, label);
      }
    } else {
      this.logger.error(
        exception instanceof Error ? exception.stack : String(exception),
        label,
      );
    }

    super.catch(exception, host);
  }
}
