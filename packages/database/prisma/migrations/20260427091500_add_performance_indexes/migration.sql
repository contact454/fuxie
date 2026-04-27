-- Add indexes used by performance aggregate and hot-read routes.
-- These are safe to re-run in drifted local environments.

CREATE INDEX IF NOT EXISTS "ai_conversations_updatedAt_idx" ON "ai_conversations"("updatedAt");
CREATE INDEX IF NOT EXISTS "ai_messages_createdAt_idx" ON "ai_messages"("createdAt");
CREATE INDEX IF NOT EXISTS "user_progress_completedAt_idx" ON "user_progress"("completedAt");
CREATE INDEX IF NOT EXISTS "daily_activities_date_idx" ON "daily_activities"("date");
CREATE INDEX IF NOT EXISTS "listening_attempts_completedAt_idx" ON "listening_attempts"("completedAt");
CREATE INDEX IF NOT EXISTS "reading_attempts_completedAt_idx" ON "reading_attempts"("completedAt");
CREATE INDEX IF NOT EXISTS "vocab_exercise_attempts_createdAt_idx" ON "vocab_exercise_attempts"("createdAt");
CREATE INDEX IF NOT EXISTS "writing_attempts_submittedAt_idx" ON "writing_attempts"("submittedAt");
CREATE INDEX IF NOT EXISTS "writing_attempts_percentScore_idx" ON "writing_attempts"("percentScore");
CREATE INDEX IF NOT EXISTS "classrooms_teacherId_isArchived_createdAt_idx" ON "classrooms"("teacherId", "isArchived", "createdAt");
CREATE INDEX IF NOT EXISTS "classrooms_teacherId_isArchived_updatedAt_idx" ON "classrooms"("teacherId", "isArchived", "updatedAt");
CREATE INDEX IF NOT EXISTS "assignment_submissions_studentId_status_idx" ON "assignment_submissions"("studentId", "status");
CREATE INDEX IF NOT EXISTS "assignment_submissions_completedAt_idx" ON "assignment_submissions"("completedAt");
CREATE INDEX IF NOT EXISTS "content_feedbacks_isResolved_idx" ON "content_feedbacks"("isResolved");
