import { Test, TestingModule } from '@nestjs/testing';
import { EmailProcessor, EmailJobData } from './email.processor';
import { Job } from 'bull';

describe('EmailProcessor', () => {
  let processor: EmailProcessor;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [EmailProcessor],
    }).compile();

    processor = module.get<EmailProcessor>(EmailProcessor);
  });

  describe('handlePasswordReset', () => {
    it('should process password reset email job', async () => {
      const jobData: EmailJobData = {
        to: 'test@example.com',
        subject: 'Password Reset Request',
        template: 'password_reset',
        context: {
          first_name: 'Test',
          reset_token: 'token-123',
          reset_url: 'http://localhost:3000/reset?token=token-123',
        },
      };

      const mockJob = { data: jobData } as Job<EmailJobData>;

      const result = await processor.handlePasswordReset(mockJob);

      expect(result).toEqual({
        success: true,
        email: 'test@example.com',
      });
    });
  });

  describe('handleWelcomeEmail', () => {
    it('should process welcome email job', async () => {
      const jobData: EmailJobData = {
        to: 'new@example.com',
        subject: 'Welcome to our platform',
        template: 'welcome',
        context: {
          first_name: 'New User',
        },
      };

      const mockJob = { data: jobData } as Job<EmailJobData>;

      const result = await processor.handleWelcomeEmail(mockJob);

      expect(result).toEqual({
        success: true,
        email: 'new@example.com',
      });
    });
  });
});
