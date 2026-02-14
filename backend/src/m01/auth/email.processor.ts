import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';

/**
 * Email job data interface
 */
export interface EmailJobData {
  to: string;
  subject: string;
  template: string;
  context: Record<string, unknown>;
}

/**
 * Queue name for email jobs
 */
export const EMAIL_QUEUE = 'm01_email_queue';

/**
 * Processor for handling email queue jobs
 */
@Processor(EMAIL_QUEUE)
export class EmailProcessor {
  private readonly logger = new Logger(EmailProcessor.name);

  @Process('send_password_reset')
  async handlePasswordReset(job: Job<EmailJobData>) {
    this.logger.log(`Processing password reset email for: ${job.data.to}`);

    // In production, integrate with email service (SendGrid, SES, etc.)
    // For now, just log the email details
    this.logger.log(`Email job processed:`, {
      to: job.data.to,
      subject: job.data.subject,
      template: job.data.template,
    });

    return { success: true, email: job.data.to };
  }

  @Process('send_welcome')
  async handleWelcomeEmail(job: Job<EmailJobData>) {
    this.logger.log(`Processing welcome email for: ${job.data.to}`);

    // In production, integrate with email service
    this.logger.log(`Welcome email job processed:`, {
      to: job.data.to,
      subject: job.data.subject,
    });

    return { success: true, email: job.data.to };
  }
}
