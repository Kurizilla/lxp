import { Test, TestingModule } from '@nestjs/testing';
import { AssistantService } from './assistant.service';
import { M01AssistantQueryDto } from '../dto/assistant-query.dto';

describe('AssistantService', () => {
  let service: AssistantService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AssistantService],
    }).compile();

    service = module.get<AssistantService>(AssistantService);
  });

  describe('processQuery', () => {
    it('should return default stub response for basic query', async () => {
      const dto: M01AssistantQueryDto = {
        query: 'Hello, how are you?',
      };

      const result = await service.processQuery(dto, 'user@example.com');

      expect(result.response).toContain('[Stub]');
      expect(result.response).toContain('Hello, how are you?');
      expect(result.metadata?.processed_at).toBeInstanceOf(Date);
      expect(result.metadata?.context_used).toBe(false);
      expect(result.suggestions).toHaveLength(3);
    });

    it('should return classroom-specific response when route includes classroom', async () => {
      const dto: M01AssistantQueryDto = {
        query: 'How do I add students?',
        route: '/teacher/classrooms',
      };

      const result = await service.processQuery(dto, 'teacher@example.com');

      expect(result.response).toContain('[Stub]');
      expect(result.response).toContain('aulas');
      expect(result.route).toBe('/teacher/classrooms');
      expect(result.metadata?.context_used).toBe(true);
    });

    it('should return admin-specific response when route includes admin', async () => {
      const dto: M01AssistantQueryDto = {
        query: 'How do I manage users?',
        route: '/admin/users',
      };

      const result = await service.processQuery(dto, 'admin@example.com');

      expect(result.response).toContain('[Stub]');
      expect(result.response).toContain('administración');
      expect(result.metadata?.context_used).toBe(true);
    });

    it('should return module-specific response for m01 module', async () => {
      const dto: M01AssistantQueryDto = {
        query: 'What is this module?',
        module: 'm01',
      };

      const result = await service.processQuery(dto, 'user@example.com');

      expect(result.response).toContain('[Stub]');
      expect(result.response).toContain('autenticación');
      expect(result.module).toBe('m01');
      expect(result.metadata?.context_used).toBe(true);
    });

    it('should return subject-specific response when route includes subject', async () => {
      const dto: M01AssistantQueryDto = {
        query: 'How do I create a subject?',
        route: '/admin/subjects',
      };

      const result = await service.processQuery(dto, 'admin@example.com');

      expect(result.response).toContain('[Stub]');
      expect(result.response).toContain('materias');
    });

    it('should return notification-specific response when route includes notification', async () => {
      const dto: M01AssistantQueryDto = {
        query: 'How do I send notifications?',
        route: '/notifications',
      };

      const result = await service.processQuery(dto, 'user@example.com');

      expect(result.response).toContain('[Stub]');
      expect(result.response).toContain('notificaciones');
    });

    it('should use context flag when context object is provided', async () => {
      const dto: M01AssistantQueryDto = {
        query: 'Show me details',
        context: { current_page: 'dashboard' },
      };

      const result = await service.processQuery(dto, 'user@example.com');

      expect(result.metadata?.context_used).toBe(true);
    });

    it('should return content module response when module is content', async () => {
      const dto: M01AssistantQueryDto = {
        query: 'How do I upload files?',
        module: 'content',
      };

      const result = await service.processQuery(dto, 'teacher@example.com');

      expect(result.response).toContain('[Stub]');
      expect(result.response).toContain('contenido');
    });

    it('should return classroom suggestions when route is classroom', async () => {
      const dto: M01AssistantQueryDto = {
        query: 'Help me',
        route: '/classrooms/123',
      };

      const result = await service.processQuery(dto, 'teacher@example.com');

      expect(result.suggestions).toContain('¿Cómo agregar estudiantes a un aula?');
    });

    it('should return admin suggestions when route is admin', async () => {
      const dto: M01AssistantQueryDto = {
        query: 'Help me',
        route: '/admin/dashboard',
      };

      const result = await service.processQuery(dto, 'admin@example.com');

      expect(result.suggestions).toContain('¿Cómo crear un nuevo usuario?');
    });
  });
});
