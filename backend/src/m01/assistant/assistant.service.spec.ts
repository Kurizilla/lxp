import { Test, TestingModule } from '@nestjs/testing';
import { AssistantService } from './assistant.service';

describe('AssistantService', () => {
  let service: AssistantService;

  const userEmail = 'test@example.com';

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AssistantService],
    }).compile();

    service = module.get<AssistantService>(AssistantService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('query', () => {
    it('should return default response for query without module or route', async () => {
      const queryDto = {
        query: 'How do I use this system?',
      };

      const result = await service.query(queryDto, userEmail);

      expect(result.response).toContain('I can help you with various questions');
      expect(result.response).toContain('How do I use this system?');
      expect(result.timestamp).toBeDefined();
      expect(result.module).toBeUndefined();
      expect(result.route).toBeUndefined();
    });

    it('should return auth module response for auth module', async () => {
      const queryDto = {
        query: 'How do I login?',
        module: 'auth',
      };

      const result = await service.query(queryDto, userEmail);

      expect(result.response).toContain('authentication-related questions');
      expect(result.response).toContain('How do I login?');
      expect(result.module).toBe('auth');
    });

    it('should return admin module response for admin module', async () => {
      const queryDto = {
        query: 'How do I manage users?',
        module: 'admin',
      };

      const result = await service.query(queryDto, userEmail);

      expect(result.response).toContain('Administrative functions');
      expect(result.module).toBe('admin');
    });

    it('should return teacher module response for teacher module', async () => {
      const queryDto = {
        query: 'How do I view my classes?',
        module: 'teacher',
      };

      const result = await service.query(queryDto, userEmail);

      expect(result.response).toContain('Teacher resources');
      expect(result.module).toBe('teacher');
    });

    it('should return org module response for org module', async () => {
      const queryDto = {
        query: 'How do I manage institutions?',
        module: 'org',
      };

      const result = await service.query(queryDto, userEmail);

      expect(result.response).toContain('Organization and institution');
      expect(result.module).toBe('org');
    });

    it('should return route-specific response for known route', async () => {
      const queryDto = {
        query: 'How do I sign in?',
        route: '/auth/login',
      };

      const result = await service.query(queryDto, userEmail);

      expect(result.response).toContain('To log in');
      expect(result.response).toContain('email and password');
      expect(result.route).toBe('/auth/login');
    });

    it('should prioritize route response over module response', async () => {
      const queryDto = {
        query: 'Tell me about config',
        module: 'admin',
        route: '/admin/config',
      };

      const result = await service.query(queryDto, userEmail);

      expect(result.response).toContain('System configuration settings');
      expect(result.module).toBe('admin');
      expect(result.route).toBe('/admin/config');
    });

    it('should truncate long queries in response', async () => {
      const longQuery = 'a'.repeat(150);
      const queryDto = {
        query: longQuery,
      };

      const result = await service.query(queryDto, userEmail);

      expect(result.response).toContain('...');
      expect(result.response.length).toBeLessThan(longQuery.length + 200);
    });

    it('should include timestamp in response', async () => {
      const queryDto = {
        query: 'test query',
      };

      const result = await service.query(queryDto, userEmail);

      expect(result.timestamp).toBeDefined();
      expect(new Date(result.timestamp)).toBeInstanceOf(Date);
    });

    it('should handle context in query', async () => {
      const queryDto = {
        query: 'test query',
        context: { page: 'dashboard', section: 'overview' },
      };

      const result = await service.query(queryDto, userEmail);

      expect(result).toBeDefined();
      expect(result.response).toBeDefined();
    });
  });
});
