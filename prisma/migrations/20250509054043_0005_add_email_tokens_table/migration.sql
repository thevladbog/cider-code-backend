-- AlterTable
ALTER TABLE "User" ADD COLUMN     "picture" TEXT;

-- CreateTable
CREATE TABLE "EmailTokens" (
    "_id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),
    "userId" TEXT NOT NULL,

    CONSTRAINT "EmailTokens_pkey" PRIMARY KEY ("_id")
);

-- AddForeignKey
ALTER TABLE "EmailTokens" ADD CONSTRAINT "EmailTokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
