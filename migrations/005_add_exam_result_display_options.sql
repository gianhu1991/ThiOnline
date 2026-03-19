-- Thêm cột displayOptions vào ExamResult (thứ tự đáp án khi làm bài - để xem chi tiết giữ đúng thứ tự)
-- Chạy file này trong Supabase: SQL Editor → New query → dán nội dung → Run

ALTER TABLE "ExamResult"
ADD COLUMN IF NOT EXISTS "displayOptions" TEXT;
