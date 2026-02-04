/*
  Warnings:

  - The `department` column on the `user` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `mbti` column on the `user` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "Mbti" AS ENUM ('INFJ', 'ENFJ', 'INTJ', 'ENTJ', 'INFP', 'ENFP', 'INTP', 'ENTP', 'ISFJ', 'ESFJ', 'ISTJ', 'ESTJ', 'ISFP', 'ESFP', 'ISTP', 'ESTP');

-- CreateEnum
CREATE TYPE "Department" AS ENUM ('EC', 'SE', 'AI', 'PS', 'CH', 'MM', 'MA', 'MC', 'EV', 'BS', 'GS');

-- AlterTable
ALTER TABLE "user" DROP COLUMN "department",
ADD COLUMN     "department" "Department",
DROP COLUMN "mbti",
ADD COLUMN     "mbti" "Mbti";
