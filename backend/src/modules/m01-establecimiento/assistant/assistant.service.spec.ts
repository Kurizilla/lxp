import { Test, TestingModule } from '@nestjs/testing';
import { AssistantService } from './assistant.service';

describe('AssistantService', () => {
  let service: AssistantService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AssistantService],
    }).compile();

    service = module.get<AssistantService>(AssistantService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('query', () => {
    it('should return contextual response with metadata', async () => {
      const result = await service.query(BigInt(1), {
        query: 'How do I check attendance?',
      });

      expect(result).toHaveProperty('response');
      expect(result).toHaveProperty('context');
      expect(result).toHaveProperty('metadata');
      expect(result.metadata.isStub).toBe(true);
    });

    it('should include institution context when provided', async () => {
      const result = await service.query(BigInt(1), {
        query: 'How do I check attendance?',
        institutionId: 1,
      });

      expect(result.context.institutionId).toBe(1);
    });

    it('should include classroom context when provided', async () => {
      const result = await service.query(BigInt(1), {
        query: 'How do I check attendance?',
        institutionId: 1,
        classroomId: 2,
      });

      expect(result.context.institutionId).toBe(1);
      expect(result.context.classroomId).toBe(2);
    });

    it('should return attendance-related response for attendance query', async () => {
      const result = await service.query(BigInt(1), {
        query: 'Cómo registro la asistencia?',
      });

      expect(result.response.toLowerCase()).toContain('asistencia');
    });

    it('should return grades-related response for grades query', async () => {
      const result = await service.query(BigInt(1), {
        query: 'Cómo ingreso las calificaciones?',
      });

      expect(result.response.toLowerCase()).toContain('calificaciones');
    });
  });
});
