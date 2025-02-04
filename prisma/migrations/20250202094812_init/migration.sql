-- CreateTable
CREATE TABLE "user" (
    "uuid" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "studentNumber" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isBbunRegistered" BOOLEAN NOT NULL DEFAULT false,
    "profileImage" TEXT,
    "department" TEXT,
    "MBTI" TEXT,
    "insta_ID" TEXT,
    "description" TEXT DEFAULT '(추가 한 줄 소개)',

    CONSTRAINT "user_pkey" PRIMARY KEY ("uuid")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_studentNumber_key" ON "user"("studentNumber");

-- CreateIndex
CREATE UNIQUE INDEX "user_email_key" ON "user"("email");
