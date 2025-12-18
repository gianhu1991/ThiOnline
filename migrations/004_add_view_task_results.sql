-- ============================================
-- MIGRATION: Thêm permission "Xem kết quả nhiệm vụ"
-- Database: Supabase (PostgreSQL)
-- ============================================

-- Thêm permission mới
INSERT INTO "Permission" ("id", "code", "name", "description", "category", "createdAt", "updatedAt")
VALUES 
    (gen_random_uuid()::text, 'view_task_results', 'Xem kết quả nhiệm vụ', 'Xem kết quả thực hiện nhiệm vụ', 'tasks', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("code") DO NOTHING;

-- Gán quyền cho ADMIN (toàn quyền)
INSERT INTO "RolePermission" ("id", "role", "permissionId", "createdAt")
SELECT 
    gen_random_uuid()::text,
    'admin',
    "id",
    CURRENT_TIMESTAMP
FROM "Permission"
WHERE "code" = 'view_task_results'
ON CONFLICT ("role", "permissionId") DO NOTHING;

-- Gán quyền cho LEADER (xem kết quả)
INSERT INTO "RolePermission" ("id", "role", "permissionId", "createdAt")
SELECT 
    gen_random_uuid()::text,
    'leader',
    "id",
    CURRENT_TIMESTAMP
FROM "Permission"
WHERE "code" = 'view_task_results'
ON CONFLICT ("role", "permissionId") DO NOTHING;

-- ============================================
-- Kiểm tra kết quả
-- ============================================
DO $$
DECLARE
    perm_exists BOOLEAN;
    admin_has_perm BOOLEAN;
    leader_has_perm BOOLEAN;
BEGIN
    SELECT EXISTS(SELECT 1 FROM "Permission" WHERE "code" = 'view_task_results') INTO perm_exists;
    SELECT EXISTS(
        SELECT 1 FROM "RolePermission" rp
        JOIN "Permission" p ON p.id = rp."permissionId"
        WHERE rp.role = 'admin' AND p.code = 'view_task_results'
    ) INTO admin_has_perm;
    SELECT EXISTS(
        SELECT 1 FROM "RolePermission" rp
        JOIN "Permission" p ON p.id = rp."permissionId"
        WHERE rp.role = 'leader' AND p.code = 'view_task_results'
    ) INTO leader_has_perm;
    
    IF perm_exists THEN
        RAISE NOTICE '✅ Permission "view_task_results" đã được tạo';
    ELSE
        RAISE WARNING '❌ Permission "view_task_results" chưa được tạo';
    END IF;
    
    IF admin_has_perm THEN
        RAISE NOTICE '✅ Admin đã có quyền "view_task_results"';
    ELSE
        RAISE WARNING '❌ Admin chưa có quyền "view_task_results"';
    END IF;
    
    IF leader_has_perm THEN
        RAISE NOTICE '✅ Leader đã có quyền "view_task_results"';
    ELSE
        RAISE WARNING '❌ Leader chưa có quyền "view_task_results"';
    END IF;
END $$;

