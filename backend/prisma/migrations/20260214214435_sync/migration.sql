-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('system', 'announcement', 'reminder', 'alert', 'message');

-- CreateEnum
CREATE TYPE "NotificationPriority" AS ENUM ('low', 'normal', 'high', 'urgent');

-- CreateEnum
CREATE TYPE "NotificationChannel" AS ENUM ('in_app', 'email', 'push', 'sms');

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
