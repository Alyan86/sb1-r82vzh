/*
  Warnings:

  - You are about to drop the column `accessToken` on the `Token` table. All the data in the column will be lost.
  - You are about to drop the column `refreshToken` on the `Token` table. All the data in the column will be lost.
  - Added the required column `category` to the `Token` table without a default value. This is not possible if the table is not empty.
  - Added the required column `email` to the `Token` table without a default value. This is not possible if the table is not empty.
  - Added the required column `token` to the `Token` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Token" DROP COLUMN "accessToken",
DROP COLUMN "refreshToken",
ADD COLUMN     "category" TEXT NOT NULL,
ADD COLUMN     "email" TEXT NOT NULL,
ADD COLUMN     "token" TEXT NOT NULL;
