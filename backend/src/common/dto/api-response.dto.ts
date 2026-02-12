export class ApiErrorResponseDto {
  code: string;
  message: string;
  details?: Record<string, any>;

  constructor(code: string, message: string, details?: Record<string, any>) {
    this.code = code;
    this.message = message;
    this.details = details;
  }
}

export class ApiSuccessResponseDto<T> {
  data: T;
  message?: string;

  constructor(data: T, message?: string) {
    this.data = data;
    this.message = message;
  }
}
