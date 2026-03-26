-- CreateEnum
CREATE TYPE "Role" AS ENUM ('client', 'attorney', 'admin');

-- CreateEnum
CREATE TYPE "CaseStatus" AS ENUM ('draft', 'submitted', 'assigned', 'in_review', 'approved', 'delivered');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "full_name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "password_hash" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "is_verified" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Matter" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "price" DECIMAL(8,2) NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Matter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Case" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "attorney_id" TEXT,
    "matter_id" TEXT NOT NULL,
    "status" "CaseStatus" NOT NULL DEFAULT 'draft',
    "payment_done" BOOLEAN NOT NULL DEFAULT false,
    "amount_paid" DECIMAL(8,2),
    "access_granted" BOOLEAN NOT NULL DEFAULT false,
    "submitted_at" TIMESTAMP(3),
    "approved_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Case_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IntakeData" (
    "id" TEXT NOT NULL,
    "case_id" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "chat_log" JSONB,
    "updated_by_attorney" BOOLEAN NOT NULL DEFAULT false,
    "attorney_notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IntakeData_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Document" (
    "id" TEXT NOT NULL,
    "case_id" TEXT NOT NULL,
    "file_url" TEXT NOT NULL,
    "file_name" TEXT NOT NULL,
    "is_locked" BOOLEAN NOT NULL DEFAULT true,
    "unlocked_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "case_id" TEXT NOT NULL,
    "matter_id" TEXT NOT NULL,
    "is_sent" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Matter_code_key" ON "Matter"("code");

-- CreateIndex
CREATE UNIQUE INDEX "IntakeData_case_id_key" ON "IntakeData"("case_id");

-- AddForeignKey
ALTER TABLE "Case" ADD CONSTRAINT "Case_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Case" ADD CONSTRAINT "Case_attorney_id_fkey" FOREIGN KEY ("attorney_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Case" ADD CONSTRAINT "Case_matter_id_fkey" FOREIGN KEY ("matter_id") REFERENCES "Matter"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IntakeData" ADD CONSTRAINT "IntakeData_case_id_fkey" FOREIGN KEY ("case_id") REFERENCES "Case"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_case_id_fkey" FOREIGN KEY ("case_id") REFERENCES "Case"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_case_id_fkey" FOREIGN KEY ("case_id") REFERENCES "Case"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_matter_id_fkey" FOREIGN KEY ("matter_id") REFERENCES "Matter"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
