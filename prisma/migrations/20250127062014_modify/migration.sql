/*
  Warnings:

  - You are about to drop the `User` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "User";

-- CreateTable
CREATE TABLE "user" (
    "uuid" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "student_num" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "email" TEXT NOT NULL,
    "consent" BOOLEAN NOT NULL,
    "isBbunRegistered" BOOLEAN NOT NULL DEFAULT false,
    "department" TEXT,
    "MBTI" TEXT,
    "description" TEXT,

    CONSTRAINT "user_pkey" PRIMARY KEY ("uuid")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_email_key" ON "user"("email");
