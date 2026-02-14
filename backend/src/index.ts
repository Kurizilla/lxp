// Main entry point for backend application
import { PrismaClient } from '@prisma/client';

// Export Prisma client instance
export const prisma = new PrismaClient();

// Export types for M01 models
export type {
  m01_users,
  m01_user_sessions,
  m01_roles,
  m01_user_roles,
  m01_permissions,
  m01_role_permissions,
  m01_institutions,
  m01_user_institutions,
  m01_subjects,
  m01_classrooms,
  m01_classroom_enrollments,
  m01_notifications,
  m01_notification_recipients,
  m01_notification_preferences,
  NotificationType,
  NotificationPriority,
  NotificationChannel,
} from '@prisma/client';
