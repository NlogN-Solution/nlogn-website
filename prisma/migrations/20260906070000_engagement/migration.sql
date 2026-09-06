-- CreateEnum
CREATE TYPE "ContentKind" AS ENUM ('BLOG', 'INSIGHT', 'CASE_STUDY');

-- CreateEnum
CREATE TYPE "CommentStatus" AS ENUM ('PUBLISHED', 'HIDDEN', 'SPAM');

-- CreateTable
CREATE TABLE "ContentStat" (
    "id" TEXT NOT NULL,
    "kind" "ContentKind" NOT NULL,
    "slug" TEXT NOT NULL,
    "views" INTEGER NOT NULL DEFAULT 0,
    "likes" INTEGER NOT NULL DEFAULT 0,
    "comments" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContentStat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContentView" (
    "id" TEXT NOT NULL,
    "kind" "ContentKind" NOT NULL,
    "slug" TEXT NOT NULL,
    "visitorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContentView_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContentLike" (
    "id" TEXT NOT NULL,
    "kind" "ContentKind" NOT NULL,
    "slug" TEXT NOT NULL,
    "visitorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContentLike_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContentComment" (
    "id" TEXT NOT NULL,
    "kind" "ContentKind" NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "status" "CommentStatus" NOT NULL DEFAULT 'PUBLISHED',
    "ip" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContentComment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ContentStat_kind_slug_key" ON "ContentStat"("kind", "slug");

-- CreateIndex
CREATE INDEX "ContentView_kind_slug_idx" ON "ContentView"("kind", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "ContentView_kind_slug_visitorId_key" ON "ContentView"("kind", "slug", "visitorId");

-- CreateIndex
CREATE INDEX "ContentLike_kind_slug_idx" ON "ContentLike"("kind", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "ContentLike_kind_slug_visitorId_key" ON "ContentLike"("kind", "slug", "visitorId");

-- CreateIndex
CREATE INDEX "ContentComment_kind_slug_status_createdAt_idx" ON "ContentComment"("kind", "slug", "status", "createdAt");

-- CreateIndex
CREATE INDEX "ContentComment_status_createdAt_idx" ON "ContentComment"("status", "createdAt");
