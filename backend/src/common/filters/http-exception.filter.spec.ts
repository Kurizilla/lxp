import { HttpException, HttpStatus } from '@nestjs/common';
import { HttpExceptionFilter } from './http-exception.filter';

describe('HttpExceptionFilter', () => {
  let filter: HttpExceptionFilter;
  let mockResponse: any;
  let mockRequest: any;
  let mockHost: any;

  beforeEach(() => {
    filter = new HttpExceptionFilter();

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    mockRequest = {
      url: '/test/endpoint',
    };

    mockHost = {
      switchToHttp: jest.fn().mockReturnValue({
        getResponse: jest.fn().mockReturnValue(mockResponse),
        getRequest: jest.fn().mockReturnValue(mockRequest),
      }),
    };
  });

  it('should format exception as RFC7807 Problem Details', () => {
    const exception = new HttpException('Bad Request', HttpStatus.BAD_REQUEST);

    filter.catch(exception, mockHost);

    expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    expect(mockResponse.json).toHaveBeenCalledWith({
      type: 'https://httpstatuses.com/400',
      title: 'Bad Request',
      status: 400,
      instance: '/test/endpoint',
      detail: 'Bad Request',
    });
  });

  it('should handle object response with message', () => {
    const exception = new HttpException(
      { message: 'Validation failed', statusCode: 400 },
      HttpStatus.BAD_REQUEST,
    );

    filter.catch(exception, mockHost);

    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        detail: 'Validation failed',
      }),
    );
  });

  it('should handle array of messages', () => {
    const exception = new HttpException(
      { message: ['Error 1', 'Error 2'] },
      HttpStatus.BAD_REQUEST,
    );

    filter.catch(exception, mockHost);

    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        detail: 'Error 1, Error 2',
      }),
    );
  });

  it('should include errors if present in response', () => {
    const exception = new HttpException(
      { message: 'Validation error', errors: { field: 'Invalid' } },
      HttpStatus.UNPROCESSABLE_ENTITY,
    );

    filter.catch(exception, mockHost);

    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        errors: { field: 'Invalid' },
      }),
    );
  });

  it('should handle UNAUTHORIZED status', () => {
    const exception = new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);

    filter.catch(exception, mockHost);

    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'https://httpstatuses.com/401',
        title: 'Unauthorized',
        status: 401,
      }),
    );
  });

  it('should handle NOT_FOUND status', () => {
    const exception = new HttpException('Not Found', HttpStatus.NOT_FOUND);

    filter.catch(exception, mockHost);

    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'https://httpstatuses.com/404',
        title: 'Not Found',
        status: 404,
      }),
    );
  });

  it('should handle INTERNAL_SERVER_ERROR status', () => {
    const exception = new HttpException(
      'Internal error',
      HttpStatus.INTERNAL_SERVER_ERROR,
    );

    filter.catch(exception, mockHost);

    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'https://httpstatuses.com/500',
        title: 'Internal Server Error',
        status: 500,
      }),
    );
  });
});
