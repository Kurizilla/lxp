-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('system', 'announcement', 'reminder', 'alert', 'message');

-- CreateEnum
CREATE TYPE "NotificationPriority" AS ENUM ('low', 'normal', 'high', 'urgent');

-- CreateEnum
CREATE TYPE "NotificationChannel" AS ENUM ('in_app', 'email', 'push', 'sms');

-- CreateEnum
CREATE TYPE "M09CalendarEventType" AS ENUM ('class_session', 'assignment_due', 'exam', 'meeting', 'holiday', 'custom');

-- CreateEnum
CREATE TYPE "M09RecurrencePattern" AS ENUM ('none', 'daily', 'weekly', 'biweekly', 'monthly');

-- CreateEnum
CREATE TYPE "M09ClassSessionState" AS ENUM ('scheduled', 'waiting', 'active', 'paused', 'ended', 'cancelled');

-- CreateEnum
CREATE TYPE "M09WhiteboardElementType" AS ENUM ('stroke', 'text', 'shape', 'image', 'sticky_note');

-- CreateEnum
CREATE TYPE "M09SyncOperationType" AS ENUM ('create', 'update', 'delete');

-- CreateEnum
CREATE TYPE "M09SyncStatus" AS ENUM ('pending', 'syncing', 'synced', 'failed', 'conflict');

-- CreateEnum
CREATE TYPE "M09ConflictResolutionStatus" AS ENUM ('pending', 'client_wins', 'server_wins', 'merged', 'discarded');

-- CreateTable
CREATE TABLE "m01_users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT,
    "google_id" TEXT,
    "first_name" TEXT,
    "last_name" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "m01_users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "m01_user_sessions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revoked_at" TIMESTAMP(3),

    CONSTRAINT "m01_user_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "m01_roles" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "is_system" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "m01_roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "m01_user_roles" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "role_id" TEXT NOT NULL,
    "granted_by" TEXT,
    "granted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "m01_user_roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "m01_permissions" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "resource" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "m01_permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "m01_role_permissions" (
    "id" TEXT NOT NULL,
    "role_id" TEXT NOT NULL,
    "permission_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "m01_role_permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "m01_institutions" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "address" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "m01_institutions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "m01_user_institutions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "institution_id" TEXT NOT NULL,
    "role_context" TEXT,
    "joined_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "m01_user_institutions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "m01_subjects" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "grade" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "m01_subjects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "m01_classrooms" (
    "id" TEXT NOT NULL,
    "institution_id" TEXT NOT NULL,
    "subject_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "section" TEXT,
    "academic_year" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "m01_classrooms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "m01_classroom_enrollments" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "classroom_id" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'student',
    "enrolled_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dropped_at" TIMESTAMP(3),

    CONSTRAINT "m01_classroom_enrollments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "m01_notifications" (
    "id" TEXT NOT NULL,
    "sender_id" TEXT,
    "type" "NotificationType" NOT NULL DEFAULT 'system',
    "priority" "NotificationPriority" NOT NULL DEFAULT 'normal',
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "data" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "m01_notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "m01_notification_recipients" (
    "id" TEXT NOT NULL,
    "notification_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "read_at" TIMESTAMP(3),
    "dismissed_at" TIMESTAMP(3),

    CONSTRAINT "m01_notification_recipients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "m01_notification_preferences" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "channel" "NotificationChannel" NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "m01_notification_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "m09_calendars" (
    "id" TEXT NOT NULL,
    "classroom_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "timezone" TEXT NOT NULL DEFAULT 'UTC',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "m09_calendars_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "m09_calendar_events" (
    "id" TEXT NOT NULL,
    "calendar_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "event_type" "M09CalendarEventType" NOT NULL DEFAULT 'custom',
    "start_time" TIMESTAMP(3) NOT NULL,
    "end_time" TIMESTAMP(3) NOT NULL,
    "all_day" BOOLEAN NOT NULL DEFAULT false,
    "recurrence_pattern" "M09RecurrencePattern" NOT NULL DEFAULT 'none',
    "recurrence_end" TIMESTAMP(3),
    "location" TEXT,
    "color" TEXT,
    "metadata" JSONB,
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "m09_calendar_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "m09_class_sessions" (
    "id" TEXT NOT NULL,
    "classroom_id" TEXT NOT NULL,
    "event_id" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "state" "M09ClassSessionState" NOT NULL DEFAULT 'scheduled',
    "scheduled_start" TIMESTAMP(3) NOT NULL,
    "scheduled_end" TIMESTAMP(3),
    "actual_start" TIMESTAMP(3),
    "actual_end" TIMESTAMP(3),
    "host_id" TEXT,
    "join_code" TEXT,
    "max_participants" INTEGER,
    "settings" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "m09_class_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "m09_class_session_participants" (
    "id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'student',
    "joined_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "left_at" TIMESTAMP(3),
    "is_present" BOOLEAN NOT NULL DEFAULT true,
    "hand_raised" BOOLEAN NOT NULL DEFAULT false,
    "metadata" JSONB,

    CONSTRAINT "m09_class_session_participants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "m09_class_session_state_logs" (
    "id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "previous_state" "M09ClassSessionState",
    "new_state" "M09ClassSessionState" NOT NULL,
    "changed_by" TEXT,
    "reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "m09_class_session_state_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "m09_whiteboards" (
    "id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT 'Main Whiteboard',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "background" TEXT,
    "width" INTEGER NOT NULL DEFAULT 1920,
    "height" INTEGER NOT NULL DEFAULT 1080,
    "settings" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "m09_whiteboards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "m09_whiteboard_elements" (
    "id" TEXT NOT NULL,
    "whiteboard_id" TEXT NOT NULL,
    "element_type" "M09WhiteboardElementType" NOT NULL,
    "content" JSONB NOT NULL,
    "position_x" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "position_y" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "width" DOUBLE PRECISION,
    "height" DOUBLE PRECISION,
    "rotation" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "z_index" INTEGER NOT NULL DEFAULT 0,
    "style" JSONB,
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "m09_whiteboard_elements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "m09_offline_queue" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT,
    "operation_type" "M09SyncOperationType" NOT NULL,
    "payload" JSONB NOT NULL,
    "client_version" INTEGER NOT NULL DEFAULT 1,
    "server_version" INTEGER,
    "status" "M09SyncStatus" NOT NULL DEFAULT 'pending',
    "error_message" TEXT,
    "retry_count" INTEGER NOT NULL DEFAULT 0,
    "client_timestamp" TIMESTAMP(3) NOT NULL,
    "synced_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "m09_offline_queue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "m09_sync_conflicts" (
    "id" TEXT NOT NULL,
    "queue_item_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "client_version" INTEGER NOT NULL,
    "server_version" INTEGER NOT NULL,
    "client_data" JSONB NOT NULL,
    "server_data" JSONB NOT NULL,
    "merged_data" JSONB,
    "resolution_status" "M09ConflictResolutionStatus" NOT NULL DEFAULT 'pending',
    "resolved_by" TEXT,
    "resolved_at" TIMESTAMP(3),
    "has_version_conflict" BOOLEAN NOT NULL DEFAULT true,
    "conflict_details" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "m09_sync_conflicts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "m01_users_email_key" ON "m01_users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "m01_users_google_id_key" ON "m01_users"("google_id");

-- CreateIndex
CREATE INDEX "m01_users_email_idx" ON "m01_users"("email");

-- CreateIndex
CREATE INDEX "m01_users_google_id_idx" ON "m01_users"("google_id");

-- CreateIndex
CREATE INDEX "m01_users_is_active_idx" ON "m01_users"("is_active");

-- CreateIndex
CREATE UNIQUE INDEX "m01_user_sessions_token_key" ON "m01_user_sessions"("token");

-- CreateIndex
CREATE INDEX "m01_user_sessions_user_id_idx" ON "m01_user_sessions"("user_id");

-- CreateIndex
CREATE INDEX "m01_user_sessions_token_idx" ON "m01_user_sessions"("token");

-- CreateIndex
CREATE INDEX "m01_user_sessions_expires_at_idx" ON "m01_user_sessions"("expires_at");

-- CreateIndex
CREATE UNIQUE INDEX "m01_roles_name_key" ON "m01_roles"("name");

-- CreateIndex
CREATE INDEX "m01_roles_name_idx" ON "m01_roles"("name");

-- CreateIndex
CREATE INDEX "m01_user_roles_user_id_idx" ON "m01_user_roles"("user_id");

-- CreateIndex
CREATE INDEX "m01_user_roles_role_id_idx" ON "m01_user_roles"("role_id");

-- CreateIndex
CREATE UNIQUE INDEX "m01_user_roles_user_id_role_id_key" ON "m01_user_roles"("user_id", "role_id");

-- CreateIndex
CREATE UNIQUE INDEX "m01_permissions_name_key" ON "m01_permissions"("name");

-- CreateIndex
CREATE INDEX "m01_permissions_name_idx" ON "m01_permissions"("name");

-- CreateIndex
CREATE INDEX "m01_permissions_resource_idx" ON "m01_permissions"("resource");

-- CreateIndex
CREATE UNIQUE INDEX "m01_permissions_resource_action_key" ON "m01_permissions"("resource", "action");

-- CreateIndex
CREATE INDEX "m01_role_permissions_role_id_idx" ON "m01_role_permissions"("role_id");

-- CreateIndex
CREATE INDEX "m01_role_permissions_permission_id_idx" ON "m01_role_permissions"("permission_id");

-- CreateIndex
CREATE UNIQUE INDEX "m01_role_permissions_role_id_permission_id_key" ON "m01_role_permissions"("role_id", "permission_id");

-- CreateIndex
CREATE UNIQUE INDEX "m01_institutions_code_key" ON "m01_institutions"("code");

-- CreateIndex
CREATE INDEX "m01_institutions_code_idx" ON "m01_institutions"("code");

-- CreateIndex
CREATE INDEX "m01_institutions_is_active_idx" ON "m01_institutions"("is_active");

-- CreateIndex
CREATE INDEX "m01_user_institutions_user_id_idx" ON "m01_user_institutions"("user_id");

-- CreateIndex
CREATE INDEX "m01_user_institutions_institution_id_idx" ON "m01_user_institutions"("institution_id");

-- CreateIndex
CREATE UNIQUE INDEX "m01_user_institutions_user_id_institution_id_key" ON "m01_user_institutions"("user_id", "institution_id");

-- CreateIndex
CREATE UNIQUE INDEX "m01_subjects_code_key" ON "m01_subjects"("code");

-- CreateIndex
CREATE INDEX "m01_subjects_code_idx" ON "m01_subjects"("code");

-- CreateIndex
CREATE INDEX "m01_subjects_grade_idx" ON "m01_subjects"("grade");

-- CreateIndex
CREATE INDEX "m01_subjects_is_active_idx" ON "m01_subjects"("is_active");

-- CreateIndex
CREATE INDEX "m01_classrooms_institution_id_idx" ON "m01_classrooms"("institution_id");

-- CreateIndex
CREATE INDEX "m01_classrooms_subject_id_idx" ON "m01_classrooms"("subject_id");

-- CreateIndex
CREATE INDEX "m01_classrooms_is_active_idx" ON "m01_classrooms"("is_active");

-- CreateIndex
CREATE INDEX "m01_classroom_enrollments_user_id_idx" ON "m01_classroom_enrollments"("user_id");

-- CreateIndex
CREATE INDEX "m01_classroom_enrollments_classroom_id_idx" ON "m01_classroom_enrollments"("classroom_id");

-- CreateIndex
CREATE INDEX "m01_classroom_enrollments_role_idx" ON "m01_classroom_enrollments"("role");

-- CreateIndex
CREATE UNIQUE INDEX "m01_classroom_enrollments_user_id_classroom_id_key" ON "m01_classroom_enrollments"("user_id", "classroom_id");

-- CreateIndex
CREATE INDEX "m01_notifications_sender_id_idx" ON "m01_notifications"("sender_id");

-- CreateIndex
CREATE INDEX "m01_notifications_type_idx" ON "m01_notifications"("type");

-- CreateIndex
CREATE INDEX "m01_notifications_priority_idx" ON "m01_notifications"("priority");

-- CreateIndex
CREATE INDEX "m01_notifications_created_at_idx" ON "m01_notifications"("created_at");

-- CreateIndex
CREATE INDEX "m01_notification_recipients_notification_id_idx" ON "m01_notification_recipients"("notification_id");

-- CreateIndex
CREATE INDEX "m01_notification_recipients_user_id_idx" ON "m01_notification_recipients"("user_id");

-- CreateIndex
CREATE INDEX "m01_notification_recipients_read_at_idx" ON "m01_notification_recipients"("read_at");

-- CreateIndex
CREATE UNIQUE INDEX "m01_notification_recipients_notification_id_user_id_key" ON "m01_notification_recipients"("notification_id", "user_id");

-- CreateIndex
CREATE INDEX "m01_notification_preferences_user_id_idx" ON "m01_notification_preferences"("user_id");

-- CreateIndex
CREATE INDEX "m01_notification_preferences_type_idx" ON "m01_notification_preferences"("type");

-- CreateIndex
CREATE INDEX "m01_notification_preferences_channel_idx" ON "m01_notification_preferences"("channel");

-- CreateIndex
CREATE UNIQUE INDEX "m01_notification_preferences_user_id_type_channel_key" ON "m01_notification_preferences"("user_id", "type", "channel");

-- CreateIndex
CREATE UNIQUE INDEX "m09_calendars_classroom_id_key" ON "m09_calendars"("classroom_id");

-- CreateIndex
CREATE INDEX "m09_calendars_classroom_id_idx" ON "m09_calendars"("classroom_id");

-- CreateIndex
CREATE INDEX "m09_calendars_is_active_idx" ON "m09_calendars"("is_active");

-- CreateIndex
CREATE INDEX "m09_calendars_created_at_idx" ON "m09_calendars"("created_at");

-- CreateIndex
CREATE INDEX "m09_calendar_events_calendar_id_idx" ON "m09_calendar_events"("calendar_id");

-- CreateIndex
CREATE INDEX "m09_calendar_events_start_time_idx" ON "m09_calendar_events"("start_time");

-- CreateIndex
CREATE INDEX "m09_calendar_events_end_time_idx" ON "m09_calendar_events"("end_time");

-- CreateIndex
CREATE INDEX "m09_calendar_events_event_type_idx" ON "m09_calendar_events"("event_type");

-- CreateIndex
CREATE INDEX "m09_calendar_events_created_by_idx" ON "m09_calendar_events"("created_by");

-- CreateIndex
CREATE INDEX "m09_calendar_events_created_at_idx" ON "m09_calendar_events"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "m09_class_sessions_join_code_key" ON "m09_class_sessions"("join_code");

-- CreateIndex
CREATE INDEX "m09_class_sessions_classroom_id_idx" ON "m09_class_sessions"("classroom_id");

-- CreateIndex
CREATE INDEX "m09_class_sessions_event_id_idx" ON "m09_class_sessions"("event_id");

-- CreateIndex
CREATE INDEX "m09_class_sessions_state_idx" ON "m09_class_sessions"("state");

-- CreateIndex
CREATE INDEX "m09_class_sessions_scheduled_start_idx" ON "m09_class_sessions"("scheduled_start");

-- CreateIndex
CREATE INDEX "m09_class_sessions_host_id_idx" ON "m09_class_sessions"("host_id");

-- CreateIndex
CREATE INDEX "m09_class_sessions_join_code_idx" ON "m09_class_sessions"("join_code");

-- CreateIndex
CREATE INDEX "m09_class_sessions_created_at_idx" ON "m09_class_sessions"("created_at");

-- CreateIndex
CREATE INDEX "m09_class_session_participants_session_id_idx" ON "m09_class_session_participants"("session_id");

-- CreateIndex
CREATE INDEX "m09_class_session_participants_user_id_idx" ON "m09_class_session_participants"("user_id");

-- CreateIndex
CREATE INDEX "m09_class_session_participants_is_present_idx" ON "m09_class_session_participants"("is_present");

-- CreateIndex
CREATE INDEX "m09_class_session_participants_joined_at_idx" ON "m09_class_session_participants"("joined_at");

-- CreateIndex
CREATE UNIQUE INDEX "m09_class_session_participants_session_id_user_id_key" ON "m09_class_session_participants"("session_id", "user_id");

-- CreateIndex
CREATE INDEX "m09_class_session_state_logs_session_id_idx" ON "m09_class_session_state_logs"("session_id");

-- CreateIndex
CREATE INDEX "m09_class_session_state_logs_created_at_idx" ON "m09_class_session_state_logs"("created_at");

-- CreateIndex
CREATE INDEX "m09_class_session_state_logs_new_state_idx" ON "m09_class_session_state_logs"("new_state");

-- CreateIndex
CREATE INDEX "m09_whiteboards_session_id_idx" ON "m09_whiteboards"("session_id");

-- CreateIndex
CREATE INDEX "m09_whiteboards_is_active_idx" ON "m09_whiteboards"("is_active");

-- CreateIndex
CREATE INDEX "m09_whiteboards_created_at_idx" ON "m09_whiteboards"("created_at");

-- CreateIndex
CREATE INDEX "m09_whiteboard_elements_whiteboard_id_idx" ON "m09_whiteboard_elements"("whiteboard_id");

-- CreateIndex
CREATE INDEX "m09_whiteboard_elements_element_type_idx" ON "m09_whiteboard_elements"("element_type");

-- CreateIndex
CREATE INDEX "m09_whiteboard_elements_created_by_idx" ON "m09_whiteboard_elements"("created_by");

-- CreateIndex
CREATE INDEX "m09_whiteboard_elements_created_at_idx" ON "m09_whiteboard_elements"("created_at");

-- CreateIndex
CREATE INDEX "m09_whiteboard_elements_z_index_idx" ON "m09_whiteboard_elements"("z_index");

-- CreateIndex
CREATE INDEX "m09_offline_queue_user_id_idx" ON "m09_offline_queue"("user_id");

-- CreateIndex
CREATE INDEX "m09_offline_queue_entity_type_idx" ON "m09_offline_queue"("entity_type");

-- CreateIndex
CREATE INDEX "m09_offline_queue_entity_id_idx" ON "m09_offline_queue"("entity_id");

-- CreateIndex
CREATE INDEX "m09_offline_queue_status_idx" ON "m09_offline_queue"("status");

-- CreateIndex
CREATE INDEX "m09_offline_queue_client_timestamp_idx" ON "m09_offline_queue"("client_timestamp");

-- CreateIndex
CREATE INDEX "m09_offline_queue_created_at_idx" ON "m09_offline_queue"("created_at");

-- CreateIndex
CREATE INDEX "m09_sync_conflicts_queue_item_id_idx" ON "m09_sync_conflicts"("queue_item_id");

-- CreateIndex
CREATE INDEX "m09_sync_conflicts_user_id_idx" ON "m09_sync_conflicts"("user_id");

-- CreateIndex
CREATE INDEX "m09_sync_conflicts_entity_type_idx" ON "m09_sync_conflicts"("entity_type");

-- CreateIndex
CREATE INDEX "m09_sync_conflicts_entity_id_idx" ON "m09_sync_conflicts"("entity_id");

-- CreateIndex
CREATE INDEX "m09_sync_conflicts_resolution_status_idx" ON "m09_sync_conflicts"("resolution_status");

-- CreateIndex
CREATE INDEX "m09_sync_conflicts_has_version_conflict_idx" ON "m09_sync_conflicts"("has_version_conflict");

-- CreateIndex
CREATE INDEX "m09_sync_conflicts_created_at_idx" ON "m09_sync_conflicts"("created_at");

-- AddForeignKey
ALTER TABLE "m01_user_sessions" ADD CONSTRAINT "m01_user_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "m01_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "m01_user_roles" ADD CONSTRAINT "m01_user_roles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "m01_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "m01_user_roles" ADD CONSTRAINT "m01_user_roles_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "m01_roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "m01_role_permissions" ADD CONSTRAINT "m01_role_permissions_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "m01_roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "m01_role_permissions" ADD CONSTRAINT "m01_role_permissions_permission_id_fkey" FOREIGN KEY ("permission_id") REFERENCES "m01_permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "m01_user_institutions" ADD CONSTRAINT "m01_user_institutions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "m01_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "m01_user_institutions" ADD CONSTRAINT "m01_user_institutions_institution_id_fkey" FOREIGN KEY ("institution_id") REFERENCES "m01_institutions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "m01_classrooms" ADD CONSTRAINT "m01_classrooms_institution_id_fkey" FOREIGN KEY ("institution_id") REFERENCES "m01_institutions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "m01_classrooms" ADD CONSTRAINT "m01_classrooms_subject_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "m01_subjects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "m01_classroom_enrollments" ADD CONSTRAINT "m01_classroom_enrollments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "m01_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "m01_classroom_enrollments" ADD CONSTRAINT "m01_classroom_enrollments_classroom_id_fkey" FOREIGN KEY ("classroom_id") REFERENCES "m01_classrooms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "m01_notifications" ADD CONSTRAINT "m01_notifications_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "m01_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "m01_notification_recipients" ADD CONSTRAINT "m01_notification_recipients_notification_id_fkey" FOREIGN KEY ("notification_id") REFERENCES "m01_notifications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "m01_notification_recipients" ADD CONSTRAINT "m01_notification_recipients_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "m01_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "m01_notification_preferences" ADD CONSTRAINT "m01_notification_preferences_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "m01_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "m09_calendars" ADD CONSTRAINT "m09_calendars_classroom_id_fkey" FOREIGN KEY ("classroom_id") REFERENCES "m01_classrooms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "m09_calendar_events" ADD CONSTRAINT "m09_calendar_events_calendar_id_fkey" FOREIGN KEY ("calendar_id") REFERENCES "m09_calendars"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "m09_calendar_events" ADD CONSTRAINT "m09_calendar_events_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "m01_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "m09_class_sessions" ADD CONSTRAINT "m09_class_sessions_classroom_id_fkey" FOREIGN KEY ("classroom_id") REFERENCES "m01_classrooms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "m09_class_sessions" ADD CONSTRAINT "m09_class_sessions_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "m09_calendar_events"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "m09_class_sessions" ADD CONSTRAINT "m09_class_sessions_host_id_fkey" FOREIGN KEY ("host_id") REFERENCES "m01_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "m09_class_session_participants" ADD CONSTRAINT "m09_class_session_participants_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "m09_class_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "m09_class_session_participants" ADD CONSTRAINT "m09_class_session_participants_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "m01_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "m09_class_session_state_logs" ADD CONSTRAINT "m09_class_session_state_logs_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "m09_class_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "m09_class_session_state_logs" ADD CONSTRAINT "m09_class_session_state_logs_changed_by_fkey" FOREIGN KEY ("changed_by") REFERENCES "m01_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "m09_whiteboards" ADD CONSTRAINT "m09_whiteboards_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "m09_class_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "m09_whiteboard_elements" ADD CONSTRAINT "m09_whiteboard_elements_whiteboard_id_fkey" FOREIGN KEY ("whiteboard_id") REFERENCES "m09_whiteboards"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "m09_whiteboard_elements" ADD CONSTRAINT "m09_whiteboard_elements_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "m01_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "m09_offline_queue" ADD CONSTRAINT "m09_offline_queue_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "m01_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "m09_sync_conflicts" ADD CONSTRAINT "m09_sync_conflicts_queue_item_id_fkey" FOREIGN KEY ("queue_item_id") REFERENCES "m09_offline_queue"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "m09_sync_conflicts" ADD CONSTRAINT "m09_sync_conflicts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "m01_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "m09_sync_conflicts" ADD CONSTRAINT "m09_sync_conflicts_resolved_by_fkey" FOREIGN KEY ("resolved_by") REFERENCES "m01_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
