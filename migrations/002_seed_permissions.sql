-- Seed Permissions và RolePermissions
-- Chạy sau khi đã tạo bảng Permission và RolePermission

-- ============================================
-- 1. INSERT PERMISSIONS
-- ============================================

-- Exams (Bài thi)
INSERT INTO "Permission" ("id", "code", "name", "description", "category", "createdAt", "updatedAt")
VALUES 
    (gen_random_uuid()::text, 'view_exams', 'Xem danh sách bài thi', 'Xem và truy cập danh sách bài thi', 'exams', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid()::text, 'create_exams', 'Tạo bài thi mới', 'Tạo bài thi mới từ ngân hàng câu hỏi', 'exams', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid()::text, 'edit_exams', 'Chỉnh sửa bài thi', 'Chỉnh sửa thông tin và cấu hình bài thi', 'exams', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid()::text, 'delete_exams', 'Xóa bài thi', 'Xóa bài thi và tất cả kết quả liên quan', 'exams', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid()::text, 'export_exam_results', 'Xuất kết quả bài thi', 'Xuất kết quả bài thi ra file Excel', 'exams', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid()::text, 'assign_exams', 'Gán bài thi', 'Gán bài thi cho người dùng hoặc nhóm', 'exams', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid()::text, 'toggle_exam_status', 'Bật/tắt bài thi', 'Bật hoặc tắt trạng thái bài thi', 'exams', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid()::text, 'view_exam_results', 'Xem kết quả bài thi', 'Xem danh sách kết quả bài thi của người dùng', 'exams', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("code") DO NOTHING;

-- Tasks (Nhiệm vụ)
INSERT INTO "Permission" ("id", "code", "name", "description", "category", "createdAt", "updatedAt")
VALUES 
    (gen_random_uuid()::text, 'view_tasks', 'Xem danh sách nhiệm vụ', 'Xem và truy cập danh sách nhiệm vụ', 'tasks', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid()::text, 'create_tasks', 'Tạo nhiệm vụ mới', 'Tạo nhiệm vụ mới', 'tasks', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid()::text, 'edit_tasks', 'Chỉnh sửa nhiệm vụ', 'Chỉnh sửa thông tin nhiệm vụ', 'tasks', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid()::text, 'delete_tasks', 'Xóa nhiệm vụ', 'Xóa nhiệm vụ và dữ liệu liên quan', 'tasks', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid()::text, 'export_task_results', 'Xuất kết quả nhiệm vụ', 'Xuất kết quả nhiệm vụ ra file Excel', 'tasks', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid()::text, 'assign_tasks', 'Gán nhiệm vụ', 'Gán nhiệm vụ cho người dùng', 'tasks', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid()::text, 'upload_task_data', 'Upload dữ liệu nhiệm vụ', 'Upload file Excel để cập nhật dữ liệu nhiệm vụ', 'tasks', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid()::text, 'view_task_customers', 'Xem danh sách khách hàng', 'Xem danh sách khách hàng trong nhiệm vụ', 'tasks', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("code") DO NOTHING;

-- Questions (Câu hỏi)
INSERT INTO "Permission" ("id", "code", "name", "description", "category", "createdAt", "updatedAt")
VALUES 
    (gen_random_uuid()::text, 'view_questions', 'Xem ngân hàng câu hỏi', 'Xem danh sách câu hỏi', 'questions', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid()::text, 'create_questions', 'Tạo câu hỏi mới', 'Tạo câu hỏi mới vào ngân hàng', 'questions', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid()::text, 'edit_questions', 'Chỉnh sửa câu hỏi', 'Chỉnh sửa nội dung câu hỏi', 'questions', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid()::text, 'delete_questions', 'Xóa câu hỏi', 'Xóa câu hỏi khỏi ngân hàng', 'questions', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid()::text, 'import_questions', 'Import câu hỏi', 'Import câu hỏi từ file Excel', 'questions', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("code") DO NOTHING;

-- Users (Người dùng)
INSERT INTO "Permission" ("id", "code", "name", "description", "category", "createdAt", "updatedAt")
VALUES 
    (gen_random_uuid()::text, 'view_users', 'Xem danh sách người dùng', 'Xem thông tin người dùng', 'users', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid()::text, 'create_users', 'Tạo người dùng mới', 'Tạo tài khoản người dùng mới', 'users', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid()::text, 'edit_users', 'Chỉnh sửa người dùng', 'Chỉnh sửa thông tin và quyền người dùng', 'users', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid()::text, 'delete_users', 'Xóa người dùng', 'Xóa tài khoản người dùng', 'users', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("code") DO NOTHING;

-- Videos
INSERT INTO "Permission" ("id", "code", "name", "description", "category", "createdAt", "updatedAt")
VALUES 
    (gen_random_uuid()::text, 'view_videos', 'Xem video', 'Xem danh sách và nội dung video', 'videos', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid()::text, 'create_videos', 'Tạo video mới', 'Upload và tạo video mới', 'videos', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid()::text, 'edit_videos', 'Chỉnh sửa video', 'Chỉnh sửa thông tin video', 'videos', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid()::text, 'delete_videos', 'Xóa video', 'Xóa video', 'videos', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("code") DO NOTHING;

-- Documents (Tài liệu)
INSERT INTO "Permission" ("id", "code", "name", "description", "category", "createdAt", "updatedAt")
VALUES 
    (gen_random_uuid()::text, 'view_documents', 'Xem tài liệu', 'Xem danh sách và nội dung tài liệu', 'documents', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid()::text, 'create_documents', 'Tạo tài liệu mới', 'Upload và tạo tài liệu mới', 'documents', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid()::text, 'edit_documents', 'Chỉnh sửa tài liệu', 'Chỉnh sửa thông tin tài liệu', 'documents', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid()::text, 'delete_documents', 'Xóa tài liệu', 'Xóa tài liệu', 'documents', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("code") DO NOTHING;

-- System (Hệ thống)
INSERT INTO "Permission" ("id", "code", "name", "description", "category", "createdAt", "updatedAt")
VALUES 
    (gen_random_uuid()::text, 'manage_categories', 'Quản lý lĩnh vực', 'Thêm, sửa, xóa lĩnh vực câu hỏi', 'system', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid()::text, 'manage_groups', 'Quản lý nhóm', 'Tạo và quản lý nhóm người dùng', 'system', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid()::text, 'manage_settings', 'Quản lý cài đặt', 'Thay đổi cấu hình hệ thống', 'system', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid()::text, 'manage_permissions', 'Quản lý phân quyền', 'Phân quyền cho các vai trò', 'system', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("code") DO NOTHING;

-- ============================================
-- 2. INSERT ROLE PERMISSIONS
-- ============================================

-- Xóa các RolePermission cũ (nếu có)
DELETE FROM "RolePermission";

-- ADMIN: Có tất cả quyền
INSERT INTO "RolePermission" ("id", "role", "permissionId", "createdAt")
SELECT 
    gen_random_uuid()::text,
    'admin',
    "id",
    CURRENT_TIMESTAMP
FROM "Permission";

-- LEADER: Chỉ xem và xuất báo cáo
INSERT INTO "RolePermission" ("id", "role", "permissionId", "createdAt")
SELECT 
    gen_random_uuid()::text,
    'leader',
    "id",
    CURRENT_TIMESTAMP
FROM "Permission"
WHERE "code" IN (
    'view_exams',
    'view_exam_results',
    'export_exam_results',
    'view_tasks',
    'view_task_customers',
    'export_task_results',
    'view_questions',
    'view_users',
    'view_videos',
    'view_documents'
);

-- USER: Chỉ xem video và tài liệu
INSERT INTO "RolePermission" ("id", "role", "permissionId", "createdAt")
SELECT 
    gen_random_uuid()::text,
    'user',
    "id",
    CURRENT_TIMESTAMP
FROM "Permission"
WHERE "code" IN (
    'view_videos',
    'view_documents'
);

-- Seed completed
SELECT 
    'Permissions created: ' || COUNT(*) AS message
FROM "Permission";

SELECT 
    'RolePermissions created: ' || COUNT(*) AS message
FROM "RolePermission";

