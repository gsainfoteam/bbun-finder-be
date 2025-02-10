-- CreateTable
CREATE TABLE "user" (
    "uuid" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "studentNumber" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),
    "isBbunRegistered" BOOLEAN NOT NULL DEFAULT false,
    "department" TEXT,
    "MBTI" TEXT,
    "insta_ID" TEXT,
    "description" TEXT,
    "profileImage" BYTEA,

    CONSTRAINT "user_pkey" PRIMARY KEY ("uuid")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_studentNumber_key" ON "user"("studentNumber");

-- CreateIndex
CREATE UNIQUE INDEX "user_email_key" ON "user"("email");
