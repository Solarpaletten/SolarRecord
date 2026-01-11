-- DropIndex
DROP INDEX "recordings_created_at_idx";

-- DropIndex
DROP INDEX "recordings_status_idx";

-- AlterTable
ALTER TABLE "recordings" ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "updated_at" DROP DEFAULT,
ALTER COLUMN "updated_at" SET DATA TYPE TIMESTAMP(3);
