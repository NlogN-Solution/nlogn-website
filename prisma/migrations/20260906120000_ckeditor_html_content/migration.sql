-- CreateEnum
CREATE TYPE "ContentFormat" AS ENUM ('TIPTAP', 'HTML');

-- AlterTable
ALTER TABLE "Blog" ADD COLUMN     "contentFormat" "ContentFormat" NOT NULL DEFAULT 'HTML';

-- AlterTable
ALTER TABLE "Insight" ADD COLUMN     "contentFormat" "ContentFormat" NOT NULL DEFAULT 'HTML';

-- AlterTable
ALTER TABLE "CaseStudy" ADD COLUMN     "contentHtml" TEXT,
ADD COLUMN     "readingMinutes" INTEGER;

-- Backfill: every row that already has a TipTap document keeps being read as
-- one. The column default is HTML because that is what everything written from
-- now on is; these rows predate that and must not be reinterpreted.
UPDATE "Blog" SET "contentFormat" = 'TIPTAP' WHERE "content" IS NOT NULL;
UPDATE "Insight" SET "contentFormat" = 'TIPTAP' WHERE "content" IS NOT NULL;
