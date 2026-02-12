-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "m01_establecimiento";

-- CreateEnum
CREATE TYPE "public"."NotificationType" AS ENUM ('EMAIL', 'IN_APP', 'PUSH');

-- CreateEnum
CREATE TYPE "public"."Priority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateTable
CREATE TABLE "m01_establecimiento"."m01_users" (
    "id" BIGSERIAL NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "first_name" VARCHAR(100) NOT NULL,
    "last_name" VARCHAR(100) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "email_verified" BOOLEAN NOT NULL DEFAULT false,
    "email_verified_at" TIMESTAMP(3),
    "last_login_at" TIMESTAMP(3),
    "failed_login_attempts" INTEGER NOT NULL DEFAULT 0,
    "locked_until" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "m01_users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "m01_establecimiento"."m01_roles" (
    "id" BIGSERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "description" VARCHAR(255),
    "is_system" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "m01_roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "m01_establecimiento"."m01_permissions" (
    "id" BIGSERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "resource" VARCHAR(100) NOT NULL,
    "action" VARCHAR(50) NOT NULL,
    "description" VARCHAR(255),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "m01_permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "m01_establecimiento"."m01_role_permissions" (
    "id" BIGSERIAL NOT NULL,
    "role_id" BIGINT NOT NULL,
    "permission_id" BIGINT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "m01_role_permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "m01_establecimiento"."m01_user_roles" (
    "id" BIGSERIAL NOT NULL,
    "user_id" BIGINT NOT NULL,
    "role_id" BIGINT NOT NULL,
    "assigned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "assigned_by" BIGINT,
    "expires_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "m01_user_roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "m01_establecimiento"."m01_sessions" (
    "id" BIGSERIAL NOT NULL,
    "user_id" BIGINT NOT NULL,
    "token" VARCHAR(500) NOT NULL,
    "refresh_token" VARCHAR(500),
    "ip_address" VARCHAR(45),
    "user_agent" VARCHAR(500),
    "is_valid" BOOLEAN NOT NULL DEFAULT true,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "last_activity" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "m01_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."notifications" (
    "id" BIGSERIAL NOT NULL,
    "user_id" BIGINT NOT NULL,
    "type" "public"."NotificationType" NOT NULL,
    "priority" "public"."Priority" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "read_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."announcements" (
    "id" BIGSERIAL NOT NULL,
    "creatorId" BIGINT,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "type" "public"."NotificationType" NOT NULL,
    "priority" "public"."Priority" NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "publishedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "announcements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."notification_preferences" (
    "id" BIGSERIAL NOT NULL,
    "user_id" BIGINT NOT NULL,
    "email_enabled" BOOLEAN NOT NULL DEFAULT true,
    "in_app_enabled" BOOLEAN NOT NULL DEFAULT true,
    "push_enabled" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notification_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "m01_establecimiento"."m01_establishments" (
    "id" BIGSERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "address" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "m01_establishments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "m01_establecimiento"."m01_subjects" (
    "id" BIGSERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "m01_subjects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "m01_establecimiento"."m01_classrooms" (
    "id" BIGSERIAL NOT NULL,
    "establishment_id" BIGINT NOT NULL,
    "subject_id" BIGINT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "capacity" INTEGER,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "m01_classrooms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "m01_establecimiento"."m01_user_classrooms" (
    "id" BIGSERIAL NOT NULL,
    "user_id" BIGINT NOT NULL,
    "classroom_id" BIGINT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'student',
    "enrolled_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "m01_user_classrooms_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "m01_users_email_key" ON "m01_establecimiento"."m01_users"("email");

-- CreateIndex
CREATE INDEX "m01_users_email_idx" ON "m01_establecimiento"."m01_users"("email");

-- CreateIndex
CREATE INDEX "m01_users_is_active_idx" ON "m01_establecimiento"."m01_users"("is_active");

-- CreateIndex
CREATE INDEX "m01_users_created_at_idx" ON "m01_establecimiento"."m01_users"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "m01_roles_name_key" ON "m01_establecimiento"."m01_roles"("name");

-- CreateIndex
CREATE INDEX "m01_roles_name_idx" ON "m01_establecimiento"."m01_roles"("name");

-- CreateIndex
CREATE INDEX "m01_roles_is_active_idx" ON "m01_establecimiento"."m01_roles"("is_active");

-- CreateIndex
CREATE UNIQUE INDEX "m01_permissions_name_key" ON "m01_establecimiento"."m01_permissions"("name");

-- CreateIndex
CREATE INDEX "m01_permissions_resource_idx" ON "m01_establecimiento"."m01_permissions"("resource");

-- CreateIndex
CREATE INDEX "m01_permissions_action_idx" ON "m01_establecimiento"."m01_permissions"("action");

-- CreateIndex
CREATE UNIQUE INDEX "m01_permissions_resource_action_key" ON "m01_establecimiento"."m01_permissions"("resource", "action");

-- CreateIndex
CREATE INDEX "m01_role_permissions_role_id_idx" ON "m01_establecimiento"."m01_role_permissions"("role_id");

-- CreateIndex
CREATE INDEX "m01_role_permissions_permission_id_idx" ON "m01_establecimiento"."m01_role_permissions"("permission_id");

-- CreateIndex
CREATE UNIQUE INDEX "m01_role_permissions_role_id_permission_id_key" ON "m01_establecimiento"."m01_role_permissions"("role_id", "permission_id");

-- CreateIndex
CREATE INDEX "m01_user_roles_user_id_idx" ON "m01_establecimiento"."m01_user_roles"("user_id");

-- CreateIndex
CREATE INDEX "m01_user_roles_role_id_idx" ON "m01_establecimiento"."m01_user_roles"("role_id");

-- CreateIndex
CREATE INDEX "m01_user_roles_expires_at_idx" ON "m01_establecimiento"."m01_user_roles"("expires_at");

-- CreateIndex
CREATE UNIQUE INDEX "m01_user_roles_user_id_role_id_key" ON "m01_establecimiento"."m01_user_roles"("user_id", "role_id");

-- CreateIndex
CREATE UNIQUE INDEX "m01_sessions_token_key" ON "m01_establecimiento"."m01_sessions"("token");

-- CreateIndex
CREATE UNIQUE INDEX "m01_sessions_refresh_token_key" ON "m01_establecimiento"."m01_sessions"("refresh_token");

-- CreateIndex
CREATE INDEX "m01_sessions_user_id_idx" ON "m01_establecimiento"."m01_sessions"("user_id");

-- CreateIndex
CREATE INDEX "m01_sessions_token_idx" ON "m01_establecimiento"."m01_sessions"("token");

-- CreateIndex
CREATE INDEX "m01_sessions_refresh_token_idx" ON "m01_establecimiento"."m01_sessions"("refresh_token");

-- CreateIndex
CREATE INDEX "m01_sessions_is_valid_idx" ON "m01_establecimiento"."m01_sessions"("is_valid");

-- CreateIndex
CREATE INDEX "m01_sessions_expires_at_idx" ON "m01_establecimiento"."m01_sessions"("expires_at");

-- CreateIndex
CREATE INDEX "notifications_user_id_idx" ON "public"."notifications"("user_id");

-- CreateIndex
CREATE INDEX "notifications_is_read_idx" ON "public"."notifications"("is_read");

-- CreateIndex
CREATE INDEX "notifications_created_at_idx" ON "public"."notifications"("created_at");

-- CreateIndex
CREATE INDEX "announcements_creatorId_idx" ON "public"."announcements"("creatorId");

-- CreateIndex
CREATE INDEX "announcements_isActive_idx" ON "public"."announcements"("isActive");

-- CreateIndex
CREATE INDEX "announcements_publishedAt_idx" ON "public"."announcements"("publishedAt");

-- CreateIndex
CREATE UNIQUE INDEX "notification_preferences_user_id_key" ON "public"."notification_preferences"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "m01_establishments_code_key" ON "m01_establecimiento"."m01_establishments"("code");

-- CreateIndex
CREATE INDEX "m01_establishments_code_idx" ON "m01_establecimiento"."m01_establishments"("code");

-- CreateIndex
CREATE INDEX "m01_establishments_is_active_idx" ON "m01_establecimiento"."m01_establishments"("is_active");

-- CreateIndex
CREATE UNIQUE INDEX "m01_subjects_code_key" ON "m01_establecimiento"."m01_subjects"("code");

-- CreateIndex
CREATE INDEX "m01_subjects_code_idx" ON "m01_establecimiento"."m01_subjects"("code");

-- CreateIndex
CREATE INDEX "m01_subjects_is_active_idx" ON "m01_establecimiento"."m01_subjects"("is_active");

-- CreateIndex
CREATE INDEX "m01_classrooms_establishment_id_idx" ON "m01_establecimiento"."m01_classrooms"("establishment_id");

-- CreateIndex
CREATE INDEX "m01_classrooms_subject_id_idx" ON "m01_establecimiento"."m01_classrooms"("subject_id");

-- CreateIndex
CREATE INDEX "m01_classrooms_is_active_idx" ON "m01_establecimiento"."m01_classrooms"("is_active");

-- CreateIndex
CREATE UNIQUE INDEX "m01_classrooms_establishment_id_code_key" ON "m01_establecimiento"."m01_classrooms"("establishment_id", "code");

-- CreateIndex
CREATE INDEX "m01_user_classrooms_user_id_idx" ON "m01_establecimiento"."m01_user_classrooms"("user_id");

-- CreateIndex
CREATE INDEX "m01_user_classrooms_classroom_id_idx" ON "m01_establecimiento"."m01_user_classrooms"("classroom_id");

-- CreateIndex
CREATE INDEX "m01_user_classrooms_is_active_idx" ON "m01_establecimiento"."m01_user_classrooms"("is_active");

-- CreateIndex
CREATE UNIQUE INDEX "m01_user_classrooms_user_id_classroom_id_key" ON "m01_establecimiento"."m01_user_classrooms"("user_id", "classroom_id");

-- AddForeignKey
ALTER TABLE "m01_establecimiento"."m01_role_permissions" ADD CONSTRAINT "m01_role_permissions_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "m01_establecimiento"."m01_roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "m01_establecimiento"."m01_role_permissions" ADD CONSTRAINT "m01_role_permissions_permission_id_fkey" FOREIGN KEY ("permission_id") REFERENCES "m01_establecimiento"."m01_permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "m01_establecimiento"."m01_user_roles" ADD CONSTRAINT "m01_user_roles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "m01_establecimiento"."m01_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "m01_establecimiento"."m01_user_roles" ADD CONSTRAINT "m01_user_roles_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "m01_establecimiento"."m01_roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "m01_establecimiento"."m01_sessions" ADD CONSTRAINT "m01_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "m01_establecimiento"."m01_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "m01_establecimiento"."m01_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."announcements" ADD CONSTRAINT "announcements_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "m01_establecimiento"."m01_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."notification_preferences" ADD CONSTRAINT "notification_preferences_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "m01_establecimiento"."m01_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "m01_establecimiento"."m01_classrooms" ADD CONSTRAINT "m01_classrooms_establishment_id_fkey" FOREIGN KEY ("establishment_id") REFERENCES "m01_establecimiento"."m01_establishments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "m01_establecimiento"."m01_classrooms" ADD CONSTRAINT "m01_classrooms_subject_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "m01_establecimiento"."m01_subjects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "m01_establecimiento"."m01_user_classrooms" ADD CONSTRAINT "m01_user_classrooms_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "m01_establecimiento"."m01_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "m01_establecimiento"."m01_user_classrooms" ADD CONSTRAINT "m01_user_classrooms_classroom_id_fkey" FOREIGN KEY ("classroom_id") REFERENCES "m01_establecimiento"."m01_classrooms"("id") ON DELETE CASCADE ON UPDATE CASCADE;
