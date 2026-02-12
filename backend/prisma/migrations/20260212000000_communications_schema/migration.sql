-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('EMAIL', 'IN_APP', 'PUSH');

-- CreateEnum
CREATE TYPE "Priority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateTable
CREATE TABLE "m01_users" (
    "id" BIGSERIAL NOT NULL,
    "email" TEXT,
    "name" TEXT,
    "role" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "m01_users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "m01_notifications" (
    "id" BIGSERIAL NOT NULL,
    "user_id" BIGINT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "priority" "Priority" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "read_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "m01_notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "m01_announcements" (
    "id" BIGSERIAL NOT NULL,
    "creator_id" BIGINT,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "priority" "Priority" NOT NULL,
    "target_roles" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "published_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "m01_announcements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "m01_notification_preferences" (
    "id" BIGSERIAL NOT NULL,
    "user_id" BIGINT NOT NULL,
    "email_enabled" BOOLEAN NOT NULL DEFAULT true,
    "in_app_enabled" BOOLEAN NOT NULL DEFAULT true,
    "push_enabled" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "m01_notification_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "m01_users_email_key" ON "m01_users"("email");

-- CreateIndex
CREATE INDEX "idx_m01_notifications_user_id" ON "m01_notifications"("user_id");

-- CreateIndex
CREATE INDEX "idx_m01_notifications_read_at" ON "m01_notifications"("read_at");

-- CreateIndex
CREATE INDEX "idx_m01_notifications_user_read" ON "m01_notifications"("user_id", "is_read");

-- CreateIndex
CREATE INDEX "idx_m01_announcements_active_published" ON "m01_announcements"("is_active", "published_at");

-- CreateIndex
CREATE INDEX "idx_m01_announcements_target_roles" ON "m01_announcements"("target_roles");

-- CreateIndex
CREATE UNIQUE INDEX "m01_notification_preferences_user_id_key" ON "m01_notification_preferences"("user_id");

-- AddForeignKey
ALTER TABLE "m01_notifications" ADD CONSTRAINT "m01_notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "m01_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "m01_announcements" ADD CONSTRAINT "m01_announcements_creator_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "m01_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "m01_notification_preferences" ADD CONSTRAINT "m01_notification_preferences_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "m01_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
