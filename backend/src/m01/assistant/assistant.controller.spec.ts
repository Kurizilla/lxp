import { Test, TestingModule } from '@nestjs/testing';
import { AssistantController } from './assistant.controller';
import { AssistantService } from './assistant.service';
import { AuthenticatedUser } from '../auth/jwt.strategy';
import { Request } from 'express';

interface AuthenticatedRequest extends Request {
  user: AuthenticatedUser;
}

describe('AssistantController', () => {
  let controller: AssistantController;
  let assistantService: jest.Mocked<AssistantService>;

  const mockUser: AuthenticatedUser = {
    id: 'user-123',
    email: 'test@example.com',
    first_name: 'Test',
    last_name: 'User',
    session_id: 'session-123',
  };

  const mockRequest = {
    user: mockUser,
  } as AuthenticatedRequest;

  const mockQueryResponse = {
    response: 'Test response [Query received: "test query"]',
    module: 'auth',
    route: '/auth/login',
    timestamp: '2026-02-14T20:00:00.000Z',
  };

  beforeEach(async () => {
    const mockAssistantService = {
      query: jest.fn().mockResolvedValue(mockQueryResponse),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AssistantController],
      providers: [
        { provide: AssistantService, useValue: mockAssistantService },
      ],
    }).compile();

    controller = module.get<AssistantController>(AssistantController);
    assistantService = module.get(AssistantService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('query', () => {
    it('should return assistant response for a query', async () => {
      const queryDto = {
        query: 'test query',
        module: 'auth',
        route: '/auth/login',
      };

      const result = await controller.query(queryDto, mockRequest);

      expect(result).toEqual(mockQueryResponse);
      expect(assistantService.query).toHaveBeenCalledWith(
        queryDto,
        'test@example.com',
      );
    });

    it('should handle query without module and route', async () => {
      const queryDto = {
        query: 'general question',
      };

      await controller.query(queryDto, mockRequest);

      expect(assistantService.query).toHaveBeenCalledWith(
        queryDto,
        'test@example.com',
      );
    });

    it('should handle query with context', async () => {
      const queryDto = {
        query: 'test query',
        module: 'admin',
        context: { page: 'dashboard' },
      };

      await controller.query(queryDto, mockRequest);

      expect(assistantService.query).toHaveBeenCalledWith(
        queryDto,
        'test@example.com',
      );
    });
  });
});
