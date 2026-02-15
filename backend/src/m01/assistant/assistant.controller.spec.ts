import { Test, TestingModule } from '@nestjs/testing';
import { AssistantController } from './assistant.controller';
import { AssistantService } from './assistant.service';
import { M01AssistantQueryResponseDto } from '../dto/assistant-query.dto';

describe('AssistantController', () => {
  let controller: AssistantController;
  let assistantService: jest.Mocked<AssistantService>;

  const mockRequest = {
    user: {
      id: 'user-123',
      email: 'user@example.com',
      first_name: 'Test',
      last_name: 'User',
      session_id: 'session-123',
    },
  };

  const mockQueryResponse: M01AssistantQueryResponseDto = {
    response: '[Stub] Test response',
    route: '/test',
    module: 'm01',
    suggestions: ['Suggestion 1', 'Suggestion 2'],
    metadata: {
      processed_at: new Date(),
      context_used: true,
    },
  };

  beforeEach(async () => {
    const mockAssistantService = {
      processQuery: jest.fn().mockResolvedValue(mockQueryResponse),
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
    it('should process query and return response', async () => {
      const dto = {
        query: 'Test query',
        route: '/test',
        module: 'm01',
      };

      const result = await controller.query(dto, mockRequest);

      expect(result).toEqual(mockQueryResponse);
      expect(assistantService.processQuery).toHaveBeenCalledWith(
        dto,
        'user@example.com',
      );
    });

    it('should process query with minimal input', async () => {
      const dto = {
        query: 'Simple query',
      };

      await controller.query(dto, mockRequest);

      expect(assistantService.processQuery).toHaveBeenCalledWith(
        dto,
        'user@example.com',
      );
    });

    it('should process query with full context', async () => {
      const dto = {
        query: 'Full context query',
        route: '/classrooms/123',
        module: 'm01',
        classroom_id: 'classroom-uuid',
        subject_id: 'subject-uuid',
        context: { page: 'details' },
      };

      await controller.query(dto, mockRequest);

      expect(assistantService.processQuery).toHaveBeenCalledWith(
        dto,
        'user@example.com',
      );
    });
  });
});
