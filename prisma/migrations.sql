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

-- Tạo bảng User
CREATE TABLE IF NOT EXISTS "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "username" TEXT NOT NULL UNIQUE,
    "password" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL
);

-- Tạo bảng User
CREATE TABLE IF NOT EXISTS "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "username" TEXT NOT NULL UNIQUE,
    "password" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL
);

-- Tạo user admin mặc định (mật khẩu sẽ được hash khi init)
-- Lưu ý: Mật khẩu mặc định là Bdnb@999, sẽ được hash bằng bcrypt

-- Thêm cột category vào bảng Question (nếu chưa có)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'Question' AND column_name = 'category'
    ) THEN
        ALTER TABLE "Question" ADD COLUMN "category" TEXT;
    END IF;
END $$;

-- Tạo bảng Category
CREATE TABLE IF NOT EXISTS "Category" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL UNIQUE,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL
);

-- Thêm cột role, fullName, email vào bảng User (nếu chưa có)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'User' AND column_name = 'role'
    ) THEN
        ALTER TABLE "User" ADD COLUMN "role" TEXT DEFAULT 'user';
        -- Set admin user role
        UPDATE "User" SET "role" = 'admin' WHERE "username" = 'admin';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'User' AND column_name = 'fullName'
    ) THEN
        ALTER TABLE "User" ADD COLUMN "fullName" TEXT;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'User' AND column_name = 'email'
    ) THEN
        ALTER TABLE "User" ADD COLUMN "email" TEXT;
    END IF;
END $$;

-- Tạo bảng Video
CREATE TABLE IF NOT EXISTS "Video" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "url" TEXT NOT NULL,
    "thumbnail" TEXT,
    "category" TEXT,
    "isPublic" BOOLEAN DEFAULT true,
    "viewCount" INTEGER DEFAULT 0,
    "uploadedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL
);

-- Tạo bảng Document
CREATE TABLE IF NOT EXISTS "Document" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "url" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "category" TEXT,
    "isPublic" BOOLEAN DEFAULT true,
    "downloadCount" INTEGER DEFAULT 0,
    "uploadedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL
);

-- Thêm cột isActive vào bảng Exam (nếu chưa có)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'Exam' AND column_name = 'isActive'
    ) THEN
        ALTER TABLE "Exam" ADD COLUMN "isActive" BOOLEAN DEFAULT true;
    END IF;
END $$;

-- Thêm cột isPublic vào bảng Exam (nếu chưa có)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'Exam' AND column_name = 'isPublic'
    ) THEN
        ALTER TABLE "Exam" ADD COLUMN "isPublic" BOOLEAN DEFAULT false;
    END IF;
END $$;

-- Tạo bảng ExamAssignment
CREATE TABLE IF NOT EXISTS "ExamAssignment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "examId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "maxAttempts" INTEGER,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("examId") REFERENCES "Exam"("id") ON DELETE CASCADE,
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE,
    UNIQUE("examId", "userId")
);

CREATE INDEX IF NOT EXISTS "ExamAssignment_examId_idx" ON "ExamAssignment"("examId");
CREATE INDEX IF NOT EXISTS "ExamAssignment_userId_idx" ON "ExamAssignment"("userId");

-- Thêm cột maxAttempts vào bảng ExamAssignment (nếu chưa có)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'ExamAssignment' AND column_name = 'maxAttempts'
    ) THEN
        ALTER TABLE "ExamAssignment" ADD COLUMN "maxAttempts" INTEGER;
    END IF;
END $$;

-- Thêm cột questionIds vào bảng ExamResult (nếu chưa có)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'ExamResult' AND column_name = 'questionIds'
    ) THEN
        ALTER TABLE "ExamResult" ADD COLUMN "questionIds" TEXT;
    END IF;
END $$;

-- Thêm cột requireAllQuestions vào bảng Exam (nếu chưa có)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'Exam' AND column_name = 'requireAllQuestions'
    ) THEN
        ALTER TABLE "Exam" ADD COLUMN "requireAllQuestions" BOOLEAN DEFAULT false;
    END IF;
END $$;

