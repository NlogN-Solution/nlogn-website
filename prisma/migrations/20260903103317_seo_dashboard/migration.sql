-- CreateEnum
CREATE TYPE "SeoProvider" AS ENUM ('GOOGLE_SEARCH_CONSOLE', 'GOOGLE_ANALYTICS', 'PAGESPEED', 'AHREFS');

-- CreateEnum
CREATE TYPE "ConnectionStatus" AS ENUM ('DISCONNECTED', 'CONNECTED', 'NEEDS_REAUTH', 'ERROR', 'UNAVAILABLE');

-- CreateEnum
CREATE TYPE "IssueSeverity" AS ENUM ('CRITICAL', 'HIGH', 'MEDIUM', 'LOW');

-- CreateEnum
CREATE TYPE "CrawlStatus" AS ENUM ('RUNNING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "PageSpeedStrategy" AS ENUM ('MOBILE', 'DESKTOP');

-- CreateTable
CREATE TABLE "Website" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "ga4PropertyId" TEXT,
    "gscSiteUrl" TEXT,
    "ahrefsDomain" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Website_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SeoConnection" (
    "id" TEXT NOT NULL,
    "websiteId" TEXT NOT NULL,
    "provider" "SeoProvider" NOT NULL,
    "status" "ConnectionStatus" NOT NULL DEFAULT 'DISCONNECTED',
    "accountLabel" TEXT,
    "scopes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "encryptedAccessToken" TEXT,
    "encryptedRefreshToken" TEXT,
    "accessTokenExpiresAt" TIMESTAMP(3),
    "lastSyncedAt" TIMESTAMP(3),
    "lastSyncError" TEXT,
    "capabilities" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SeoConnection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SearchConsoleDaily" (
    "id" TEXT NOT NULL,
    "websiteId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "clicks" INTEGER NOT NULL DEFAULT 0,
    "impressions" INTEGER NOT NULL DEFAULT 0,
    "ctr" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "position" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "syncedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SearchConsoleDaily_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnalyticsDaily" (
    "id" TEXT NOT NULL,
    "websiteId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "users" INTEGER NOT NULL DEFAULT 0,
    "newUsers" INTEGER NOT NULL DEFAULT 0,
    "sessions" INTEGER NOT NULL DEFAULT 0,
    "engagedSessions" INTEGER NOT NULL DEFAULT 0,
    "engagementRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "avgEngagementTime" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "screenPageViews" INTEGER NOT NULL DEFAULT 0,
    "organicUsers" INTEGER NOT NULL DEFAULT 0,
    "directUsers" INTEGER NOT NULL DEFAULT 0,
    "referralUsers" INTEGER NOT NULL DEFAULT 0,
    "conversions" DOUBLE PRECISION,
    "syncedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AnalyticsDaily_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SeoReportCache" (
    "id" TEXT NOT NULL,
    "websiteId" TEXT NOT NULL,
    "provider" "SeoProvider" NOT NULL,
    "key" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "fetchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SeoReportCache_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SeoIssue" (
    "id" TEXT NOT NULL,
    "websiteId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "severity" "IssueSeverity" NOT NULL,
    "url" TEXT NOT NULL,
    "detail" TEXT,
    "firstSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "SeoIssue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CrawlRun" (
    "id" TEXT NOT NULL,
    "websiteId" TEXT NOT NULL,
    "status" "CrawlStatus" NOT NULL DEFAULT 'RUNNING',
    "pagesCrawled" INTEGER NOT NULL DEFAULT 0,
    "issuesFound" INTEGER NOT NULL DEFAULT 0,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),
    "error" TEXT,

    CONSTRAINT "CrawlRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PageSpeedSnapshot" (
    "id" TEXT NOT NULL,
    "websiteId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "strategy" "PageSpeedStrategy" NOT NULL,
    "performanceScore" INTEGER,
    "seoScore" INTEGER,
    "accessibilityScore" INTEGER,
    "bestPracticesScore" INTEGER,
    "lcpLab" DOUBLE PRECISION,
    "fcpLab" DOUBLE PRECISION,
    "clsLab" DOUBLE PRECISION,
    "tbtLab" DOUBLE PRECISION,
    "ttfbLab" DOUBLE PRECISION,
    "lcpField" DOUBLE PRECISION,
    "inpField" DOUBLE PRECISION,
    "clsField" DOUBLE PRECISION,
    "fcpField" DOUBLE PRECISION,
    "ttfbField" DOUBLE PRECISION,
    "hasFieldData" BOOLEAN NOT NULL DEFAULT false,
    "fetchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PageSpeedSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Website_domain_key" ON "Website"("domain");

-- CreateIndex
CREATE INDEX "Website_domain_idx" ON "Website"("domain");

-- CreateIndex
CREATE INDEX "SeoConnection_provider_status_idx" ON "SeoConnection"("provider", "status");

-- CreateIndex
CREATE UNIQUE INDEX "SeoConnection_websiteId_provider_key" ON "SeoConnection"("websiteId", "provider");

-- CreateIndex
CREATE INDEX "SearchConsoleDaily_websiteId_date_idx" ON "SearchConsoleDaily"("websiteId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "SearchConsoleDaily_websiteId_date_key" ON "SearchConsoleDaily"("websiteId", "date");

-- CreateIndex
CREATE INDEX "AnalyticsDaily_websiteId_date_idx" ON "AnalyticsDaily"("websiteId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "AnalyticsDaily_websiteId_date_key" ON "AnalyticsDaily"("websiteId", "date");

-- CreateIndex
CREATE INDEX "SeoReportCache_websiteId_provider_idx" ON "SeoReportCache"("websiteId", "provider");

-- CreateIndex
CREATE INDEX "SeoReportCache_expiresAt_idx" ON "SeoReportCache"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "SeoReportCache_websiteId_key_key" ON "SeoReportCache"("websiteId", "key");

-- CreateIndex
CREATE INDEX "SeoIssue_websiteId_severity_resolvedAt_idx" ON "SeoIssue"("websiteId", "severity", "resolvedAt");

-- CreateIndex
CREATE INDEX "SeoIssue_websiteId_code_idx" ON "SeoIssue"("websiteId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "SeoIssue_websiteId_code_url_key" ON "SeoIssue"("websiteId", "code", "url");

-- CreateIndex
CREATE INDEX "CrawlRun_websiteId_startedAt_idx" ON "CrawlRun"("websiteId", "startedAt");

-- CreateIndex
CREATE INDEX "PageSpeedSnapshot_websiteId_strategy_fetchedAt_idx" ON "PageSpeedSnapshot"("websiteId", "strategy", "fetchedAt");

-- AddForeignKey
ALTER TABLE "SeoConnection" ADD CONSTRAINT "SeoConnection_websiteId_fkey" FOREIGN KEY ("websiteId") REFERENCES "Website"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SearchConsoleDaily" ADD CONSTRAINT "SearchConsoleDaily_websiteId_fkey" FOREIGN KEY ("websiteId") REFERENCES "Website"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnalyticsDaily" ADD CONSTRAINT "AnalyticsDaily_websiteId_fkey" FOREIGN KEY ("websiteId") REFERENCES "Website"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SeoReportCache" ADD CONSTRAINT "SeoReportCache_websiteId_fkey" FOREIGN KEY ("websiteId") REFERENCES "Website"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SeoIssue" ADD CONSTRAINT "SeoIssue_websiteId_fkey" FOREIGN KEY ("websiteId") REFERENCES "Website"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CrawlRun" ADD CONSTRAINT "CrawlRun_websiteId_fkey" FOREIGN KEY ("websiteId") REFERENCES "Website"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PageSpeedSnapshot" ADD CONSTRAINT "PageSpeedSnapshot_websiteId_fkey" FOREIGN KEY ("websiteId") REFERENCES "Website"("id") ON DELETE CASCADE ON UPDATE CASCADE;
