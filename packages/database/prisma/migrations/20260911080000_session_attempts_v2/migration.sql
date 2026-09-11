CREATE TYPE "SessionAttemptStatus" AS ENUM ('IN_PROGRESS', 'COMPLETED', 'EXHAUSTED', 'ABANDONED', 'EXPIRED');

CREATE TABLE "session_attempts" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "level" "CefrLevel" NOT NULL,
    "clientStartKey" TEXT NOT NULL,
    "status" "SessionAttemptStatus" NOT NULL DEFAULT 'IN_PROGRESS',
    "contractVersion" INTEGER NOT NULL DEFAULT 2,
    "gradingVersion" TEXT NOT NULL,
    "rewardPolicyVersion" TEXT NOT NULL,
    "catalogRevision" TEXT NOT NULL,
    "publicRevision" TEXT NOT NULL,
    "snapshotJson" JSONB NOT NULL,
    "answersJson" JSONB NOT NULL,
    "receiptJson" JSONB,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "session_attempts_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "session_attempts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "session_attempts_userId_clientStartKey_key" ON "session_attempts"("userId", "clientStartKey");
CREATE UNIQUE INDEX "session_attempts_one_active_user" ON "session_attempts"("userId") WHERE "status" = 'IN_PROGRESS';
CREATE INDEX "session_attempts_userId_status_startedAt_idx" ON "session_attempts"("userId", "status", "startedAt");
CREATE INDEX "session_attempts_startedAt_idx" ON "session_attempts"("startedAt");
