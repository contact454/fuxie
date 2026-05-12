-- CreateEnum
CREATE TYPE "FucoinLedgerType" AS ENUM ('EARN', 'SPEND', 'ADJUSTMENT', 'REFUND');

-- CreateEnum
CREATE TYPE "MissionPeriod" AS ENUM ('DAILY', 'MONTHLY', 'QUARTERLY');

-- CreateEnum
CREATE TYPE "MissionMetric" AS ENUM ('STUDY_MINUTES', 'XP_EARNED', 'EXERCISES_COMPLETED', 'LESSONS_COMPLETED', 'SRS_REVIEWED', 'ACTIVE_DAYS', 'EXAM_ATTEMPTS');

-- CreateEnum
CREATE TYPE "MissionStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateTable
CREATE TABLE "user_wallets" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "balance" INTEGER NOT NULL DEFAULT 0,
    "lifetimeEarned" INTEGER NOT NULL DEFAULT 0,
    "lifetimeSpent" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_wallets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fucoin_ledger" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "type" "FucoinLedgerType" NOT NULL,
    "sourceType" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fucoin_ledger_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mission_definitions" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "period" "MissionPeriod" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "metric" "MissionMetric" NOT NULL,
    "targetValue" INTEGER NOT NULL,
    "href" TEXT,
    "xpReward" INTEGER NOT NULL DEFAULT 0,
    "fucoinReward" INTEGER NOT NULL DEFAULT 0,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "status" "MissionStatus" NOT NULL DEFAULT 'ACTIVE',
    "activeFrom" TIMESTAMP(3),
    "activeTo" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mission_definitions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_mission_claims" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "missionId" TEXT NOT NULL,
    "periodKey" TEXT NOT NULL,
    "claimedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_mission_claims_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_wallets_userId_key" ON "user_wallets"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "fucoin_ledger_userId_sourceType_sourceId_key" ON "fucoin_ledger"("userId", "sourceType", "sourceId");

-- CreateIndex
CREATE INDEX "fucoin_ledger_userId_createdAt_idx" ON "fucoin_ledger"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "fucoin_ledger_sourceType_sourceId_idx" ON "fucoin_ledger"("sourceType", "sourceId");

-- CreateIndex
CREATE UNIQUE INDEX "mission_definitions_slug_key" ON "mission_definitions"("slug");

-- CreateIndex
CREATE INDEX "mission_definitions_period_status_idx" ON "mission_definitions"("period", "status");

-- CreateIndex
CREATE INDEX "mission_definitions_status_sortOrder_idx" ON "mission_definitions"("status", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "user_mission_claims_userId_missionId_periodKey_key" ON "user_mission_claims"("userId", "missionId", "periodKey");

-- CreateIndex
CREATE INDEX "user_mission_claims_userId_periodKey_idx" ON "user_mission_claims"("userId", "periodKey");

-- CreateIndex
CREATE INDEX "user_mission_claims_missionId_idx" ON "user_mission_claims"("missionId");

-- AddForeignKey
ALTER TABLE "user_wallets" ADD CONSTRAINT "user_wallets_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fucoin_ledger" ADD CONSTRAINT "fucoin_ledger_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_mission_claims" ADD CONSTRAINT "user_mission_claims_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_mission_claims" ADD CONSTRAINT "user_mission_claims_missionId_fkey" FOREIGN KEY ("missionId") REFERENCES "mission_definitions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Seed default mission definitions for Fuxie Economy v1.
INSERT INTO "mission_definitions" (
    "id", "slug", "period", "title", "description", "metric", "targetValue", "href",
    "xpReward", "fucoinReward", "sortOrder", "status", "updatedAt"
) VALUES
    ('mission_daily_study_minutes', 'daily-study-15', 'DAILY', 'Chạm mốc 15 phút', 'Hoàn thành mục tiêu học trong ngày để giữ nhịp.', 'STUDY_MINUTES', 15, '/dashboard', 15, 10, 10, 'ACTIVE', CURRENT_TIMESTAMP),
    ('mission_daily_practice_3', 'daily-practice-3', 'DAILY', 'Hoàn thành 3 lượt luyện', 'Làm ba hoạt động ngắn để nhận thưởng ngày.', 'EXERCISES_COMPLETED', 3, '/vocabulary', 20, 12, 20, 'ACTIVE', CURRENT_TIMESTAMP),
    ('mission_daily_srs_10', 'daily-srs-10', 'DAILY', 'Ôn 10 thẻ SRS', 'Dọn thẻ đến hạn để bảo vệ trí nhớ dài hạn.', 'SRS_REVIEWED', 10, '/review', 15, 8, 30, 'ACTIVE', CURRENT_TIMESTAMP),
    ('mission_monthly_active_12', 'monthly-active-12', 'MONTHLY', '12 ngày học trong tháng', 'Tạo nhịp học đều để biến tiếng Đức thành thói quen.', 'ACTIVE_DAYS', 12, '/dashboard', 120, 80, 10, 'ACTIVE', CURRENT_TIMESTAMP),
    ('mission_monthly_minutes_300', 'monthly-minutes-300', 'MONTHLY', '300 phút học trong tháng', 'Tích lũy thời gian học thật cho mục tiêu CEFR.', 'STUDY_MINUTES', 300, '/course', 180, 120, 20, 'ACTIVE', CURRENT_TIMESTAMP),
    ('mission_quarterly_xp_2000', 'quarterly-xp-2000', 'QUARTERLY', '2.000 XP trong quý', 'Đẩy level Fuxie bằng một quý học bền bỉ.', 'XP_EARNED', 2000, '/dashboard', 300, 220, 10, 'ACTIVE', CURRENT_TIMESTAMP),
    ('mission_quarterly_exam_2', 'quarterly-exam-2', 'QUARTERLY', '2 lượt luyện thi trong quý', 'Kiểm tra readiness bằng các bài thi thử.', 'EXAM_ATTEMPTS', 2, '/exam', 250, 180, 20, 'ACTIVE', CURRENT_TIMESTAMP);
