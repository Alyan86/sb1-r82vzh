/*
  Warnings:

  - You are about to drop the column `category` on the `Token` table. All the data in the column will be lost.
  - You are about to drop the column `email` on the `Token` table. All the data in the column will be lost.
  - You are about to drop the column `token` on the `Token` table. All the data in the column will be lost.
  - Added the required column `accessToken` to the `Token` table without a default value. This is not possible if the table is not empty.
  - Made the column `refreshToken` on table `Token` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Token" DROP COLUMN "category",
DROP COLUMN "email",
DROP COLUMN "token",
ADD COLUMN     "accessToken" TEXT NOT NULL,
ALTER COLUMN "refreshToken" SET NOT NULL;
