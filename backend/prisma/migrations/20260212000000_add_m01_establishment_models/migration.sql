-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('EMAIL', 'IN_APP', 'PUSH');

-- CreateEnum
CREATE TYPE "Priority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateTable
CREATE TABLE "users" (
    "id" BIGSERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" BIGSERIAL NOT NULL,
    "userId" BIGINT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "priority" "Priority" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "announcements" (
    "id" BIGSERIAL NOT NULL,
    "creatorId" BIGINT,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "priority" "Priority" NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "publishedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "announcements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_preferences" (
    "id" BIGSERIAL NOT NULL,
    "userId" BIGINT NOT NULL,
    "emailEnabled" BOOLEAN NOT NULL DEFAULT true,
    "inAppEnabled" BOOLEAN NOT NULL DEFAULT true,
    "pushEnabled" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notification_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "m01_establishments" (
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
CREATE TABLE "m01_subjects" (
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
CREATE TABLE "m01_classrooms" (
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
CREATE TABLE "m01_user_classrooms" (
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
CREATE UNIQUE INDEX "notification_preferences_userId_key" ON "notification_preferences"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "m01_establishments_code_key" ON "m01_establishments"("code");

-- CreateIndex
CREATE INDEX "m01_establishments_code_idx" ON "m01_establishments"("code");

-- CreateIndex
CREATE INDEX "m01_establishments_is_active_idx" ON "m01_establishments"("is_active");

-- CreateIndex
CREATE UNIQUE INDEX "m01_subjects_code_key" ON "m01_subjects"("code");

-- CreateIndex
CREATE INDEX "m01_subjects_code_idx" ON "m01_subjects"("code");

-- CreateIndex
CREATE INDEX "m01_subjects_is_active_idx" ON "m01_subjects"("is_active");

-- CreateIndex
CREATE INDEX "m01_classrooms_establishment_id_idx" ON "m01_classrooms"("establishment_id");

-- CreateIndex
CREATE INDEX "m01_classrooms_subject_id_idx" ON "m01_classrooms"("subject_id");

-- CreateIndex
CREATE INDEX "m01_classrooms_is_active_idx" ON "m01_classrooms"("is_active");

-- CreateIndex
CREATE UNIQUE INDEX "m01_classrooms_establishment_id_code_key" ON "m01_classrooms"("establishment_id", "code");

-- CreateIndex
CREATE INDEX "m01_user_classrooms_user_id_idx" ON "m01_user_classrooms"("user_id");

-- CreateIndex
CREATE INDEX "m01_user_classrooms_classroom_id_idx" ON "m01_user_classrooms"("classroom_id");

-- CreateIndex
CREATE INDEX "m01_user_classrooms_is_active_idx" ON "m01_user_classrooms"("is_active");

-- CreateIndex
CREATE UNIQUE INDEX "m01_user_classrooms_user_id_classroom_id_key" ON "m01_user_classrooms"("user_id", "classroom_id");

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "announcements" ADD CONSTRAINT "announcements_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_preferences" ADD CONSTRAINT "notification_preferences_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "m01_classrooms" ADD CONSTRAINT "m01_classrooms_establishment_id_fkey" FOREIGN KEY ("establishment_id") REFERENCES "m01_establishments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "m01_classrooms" ADD CONSTRAINT "m01_classrooms_subject_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "m01_subjects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "m01_user_classrooms" ADD CONSTRAINT "m01_user_classrooms_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "m01_user_classrooms" ADD CONSTRAINT "m01_user_classrooms_classroom_id_fkey" FOREIGN KEY ("classroom_id") REFERENCES "m01_classrooms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

