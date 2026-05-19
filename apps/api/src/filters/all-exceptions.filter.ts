import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus, Logger } from "@nestjs/common";
import type { Response } from "express";

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger("ExceptionFilter");

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = "Internal server error";
    let code = "INTERNAL_ERROR";

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse() as any;
      message = typeof res === "string" ? res : (res.message || res.error || message);
      code = this.getErrorCode(status);
    } else if (exception instanceof Error) {
      // In production, mask internal error details
      if (process.env.NODE_ENV === "production") {
        message = "An unexpected error occurred";
      } else {
        message = exception.message;
      }
    }

    // Log the error with context
    this.logger.error(
      `${request.method} ${request.url} → ${status}: ${message}`,
      exception instanceof Error ? exception.stack : undefined,
    );

    response.status(status).json({
      success: false,
      data: null,
      error: {
        code,
        message: Array.isArray(message) ? message[0] : message,
        retryable: status >= 500,
      },
    });
  }

  private getErrorCode(status: number): string {
    switch (status) {
      case 400: return "BAD_REQUEST";
      case 401: return "UNAUTHORIZED";
      case 403: return "FORBIDDEN";
      case 404: return "NOT_FOUND";
      case 409: return "CONFLICT";
      case 422: return "VALIDATION_ERROR";
      case 429: return "RATE_LIMITED";
      default: return status >= 500 ? "INTERNAL_ERROR" : "CLIENT_ERROR";
    }
  }
}
