-- CreateTable
CREATE TABLE "streak_freeze_usages" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "usedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "protectedStreak" INTEGER NOT NULL,
    "freezesRemaining" INTEGER NOT NULL,
    "freezesUsedTotal" INTEGER NOT NULL,
    "missedDays" INTEGER NOT NULL,
    "sourceType" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "streak_freeze_usages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "streak_freeze_usages_userId_sourceType_sourceId_key" ON "streak_freeze_usages"("userId", "sourceType", "sourceId");

-- CreateIndex
CREATE INDEX "streak_freeze_usages_userId_usedAt_idx" ON "streak_freeze_usages"("userId", "usedAt");

-- CreateIndex
CREATE INDEX "streak_freeze_usages_sourceType_sourceId_idx" ON "streak_freeze_usages"("sourceType", "sourceId");

-- AddForeignKey
ALTER TABLE "streak_freeze_usages" ADD CONSTRAINT "streak_freeze_usages_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
