/*
  Warnings:

  - You are about to drop the column `student_num` on the `user` table. All the data in the column will be lost.
  - Added the required column `studentNumber` to the `user` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "user" DROP COLUMN "student_num",
ADD COLUMN     "studentNumber" TEXT NOT NULL;
