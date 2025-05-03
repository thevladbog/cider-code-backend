-- DropForeignKey
ALTER TABLE "Shift" DROP CONSTRAINT "Shift_operatorId_fkey";

-- AlterTable
ALTER TABLE "Shift" ALTER COLUMN "operatorId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Shift" ADD CONSTRAINT "Shift_operatorId_fkey" FOREIGN KEY ("operatorId") REFERENCES "Operator"("id") ON DELETE SET NULL ON UPDATE CASCADE;
