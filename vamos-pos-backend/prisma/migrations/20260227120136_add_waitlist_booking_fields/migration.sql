-- AlterTable
ALTER TABLE "Waitlist" ADD COLUMN     "reservedTime" TIMESTAMP(3),
ADD COLUMN     "tableId" TEXT;

-- AddForeignKey
ALTER TABLE "Waitlist" ADD CONSTRAINT "Waitlist_tableId_fkey" FOREIGN KEY ("tableId") REFERENCES "Table"("id") ON DELETE SET NULL ON UPDATE CASCADE;
