-- Migration SQL cho Supabase/PostgreSQL
-- Chạy file này trong Supabase SQL Editor nếu không dùng được Prisma CLI

-- Tạo bảng Question
CREATE TABLE IF NOT EXISTS "Question" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "content" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "options" TEXT NOT NULL,
    "correctAnswers" TEXT NOT NULL,
    "explanation" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL
);

-- Tạo bảng Exam
CREATE TABLE IF NOT EXISTS "Exam" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "questionCount" INTEGER NOT NULL,
    "timeLimit" INTEGER NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "shuffleQuestions" BOOLEAN NOT NULL DEFAULT false,
    "shuffleAnswers" BOOLEAN NOT NULL DEFAULT false,
    "maxAttempts" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL
);

-- Tạo bảng ExamQuestion
CREATE TABLE IF NOT EXISTS "ExamQuestion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "examId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    FOREIGN KEY ("examId") REFERENCES "Exam"("id") ON DELETE CASCADE,
    FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE CASCADE,
    UNIQUE("examId", "questionId")
);

CREATE INDEX IF NOT EXISTS "ExamQuestion_examId_idx" ON "ExamQuestion"("examId");

-- Tạo bảng ExamResult
CREATE TABLE IF NOT EXISTS "ExamResult" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "examId" TEXT NOT NULL,
    "studentName" TEXT,
    "studentId" TEXT,
    "score" REAL NOT NULL,
    "totalQuestions" INTEGER NOT NULL,
    "correctAnswers" INTEGER NOT NULL,
    "answers" TEXT NOT NULL,
    "timeSpent" INTEGER NOT NULL,
    "attemptNumber" INTEGER NOT NULL,
    "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("examId") REFERENCES "Exam"("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "ExamResult_examId_idx" ON "ExamResult"("examId");

