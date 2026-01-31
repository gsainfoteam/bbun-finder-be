-- CreateTable
CREATE TABLE "user" (
    "uuid" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "student_number" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "profile_image_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),
    "consent" BOOLEAN NOT NULL DEFAULT false,
    "department" TEXT,
    "mbti" TEXT,
    "insta_id" TEXT,
    "description" TEXT,

    CONSTRAINT "user_pkey" PRIMARY KEY ("uuid")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_student_number_key" ON "user"("student_number");

-- CreateIndex
CREATE UNIQUE INDEX "user_email_key" ON "user"("email");
