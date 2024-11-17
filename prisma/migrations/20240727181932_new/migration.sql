/*
  Warnings:

  - You are about to drop the column `category` on the `Token` table. All the data in the column will be lost.
  - You are about to drop the column `token` on the `Token` table. All the data in the column will be lost.
  - Added the required column `accessToken` to the `Token` table without a default value. This is not possible if the table is not empty.
  - Added the required column `refreshToken` to the `Token` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Token" DROP COLUMN "category",
DROP COLUMN "token",
ADD COLUMN     "accessToken" TEXT NOT NULL,
ADD COLUMN     "refreshToken" TEXT NOT NULL;
