import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Định nghĩa các quyền trong hệ thống
const permissions = [
  // Quyền về Bài thi (Exams)
  { code: 'view_exams', name: 'Xem danh sách bài thi', category: 'exams', description: 'Xem và truy cập danh sách bài thi' },
  { code: 'create_exams', name: 'Tạo bài thi mới', category: 'exams', description: 'Tạo bài thi mới từ ngân hàng câu hỏi' },
  { code: 'edit_exams', name: 'Chỉnh sửa bài thi', category: 'exams', description: 'Chỉnh sửa thông tin và cấu hình bài thi' },
  { code: 'delete_exams', name: 'Xóa bài thi', category: 'exams', description: 'Xóa bài thi và tất cả kết quả liên quan' },
  { code: 'export_exam_results', name: 'Xuất kết quả bài thi', category: 'exams', description: 'Xuất kết quả bài thi ra file Excel' },
  { code: 'assign_exams', name: 'Gán bài thi', category: 'exams', description: 'Gán bài thi cho người dùng hoặc nhóm' },
  { code: 'toggle_exam_status', name: 'Bật/tắt bài thi', category: 'exams', description: 'Bật hoặc tắt trạng thái bài thi' },
  { code: 'view_exam_results', name: 'Xem kết quả bài thi', category: 'exams', description: 'Xem danh sách kết quả bài thi của người dùng' },

  // Quyền về Nhiệm vụ (Tasks)
  { code: 'view_tasks', name: 'Xem danh sách nhiệm vụ', category: 'tasks', description: 'Xem và truy cập danh sách nhiệm vụ' },
  { code: 'create_tasks', name: 'Tạo nhiệm vụ mới', category: 'tasks', description: 'Tạo nhiệm vụ mới' },
  { code: 'edit_tasks', name: 'Chỉnh sửa nhiệm vụ', category: 'tasks', description: 'Chỉnh sửa thông tin nhiệm vụ' },
  { code: 'delete_tasks', name: 'Xóa nhiệm vụ', category: 'tasks', description: 'Xóa nhiệm vụ và dữ liệu liên quan' },
  { code: 'view_task_results', name: 'Xem kết quả nhiệm vụ', category: 'tasks', description: 'Xem kết quả thực hiện nhiệm vụ' },
  { code: 'export_task_results', name: 'Xuất kết quả nhiệm vụ', category: 'tasks', description: 'Xuất kết quả nhiệm vụ ra file Excel' },
  { code: 'assign_tasks', name: 'Gán nhiệm vụ', category: 'tasks', description: 'Gán nhiệm vụ cho người dùng' },
  { code: 'upload_task_data', name: 'Upload dữ liệu nhiệm vụ', category: 'tasks', description: 'Upload file Excel để cập nhật dữ liệu nhiệm vụ' },
  { code: 'view_task_customers', name: 'Xem danh sách khách hàng', category: 'tasks', description: 'Xem danh sách khách hàng trong nhiệm vụ' },

  // Quyền về Câu hỏi (Questions)
  { code: 'view_questions', name: 'Xem ngân hàng câu hỏi', category: 'questions', description: 'Xem danh sách câu hỏi' },
  { code: 'create_questions', name: 'Tạo câu hỏi mới', category: 'questions', description: 'Tạo câu hỏi mới vào ngân hàng' },
  { code: 'edit_questions', name: 'Chỉnh sửa câu hỏi', category: 'questions', description: 'Chỉnh sửa nội dung câu hỏi' },
  { code: 'delete_questions', name: 'Xóa câu hỏi', category: 'questions', description: 'Xóa câu hỏi khỏi ngân hàng' },
  { code: 'import_questions', name: 'Import câu hỏi', category: 'questions', description: 'Import câu hỏi từ file Excel' },

  // Quyền về Người dùng (Users)
  { code: 'view_users', name: 'Xem danh sách người dùng', category: 'users', description: 'Xem thông tin người dùng' },
  { code: 'create_users', name: 'Tạo người dùng mới', category: 'users', description: 'Tạo tài khoản người dùng mới' },
  { code: 'edit_users', name: 'Chỉnh sửa người dùng', category: 'users', description: 'Chỉnh sửa thông tin và quyền người dùng' },
  { code: 'delete_users', name: 'Xóa người dùng', category: 'users', description: 'Xóa tài khoản người dùng' },

  // Quyền về Video
  { code: 'view_videos', name: 'Xem video', category: 'videos', description: 'Xem danh sách và nội dung video' },
  { code: 'create_videos', name: 'Tạo video mới', category: 'videos', description: 'Upload và tạo video mới' },
  { code: 'edit_videos', name: 'Chỉnh sửa video', category: 'videos', description: 'Chỉnh sửa thông tin video' },
  { code: 'delete_videos', name: 'Xóa video', category: 'videos', description: 'Xóa video' },

  // Quyền về Tài liệu (Documents)
  { code: 'view_documents', name: 'Xem tài liệu', category: 'documents', description: 'Xem danh sách và nội dung tài liệu' },
  { code: 'create_documents', name: 'Tạo tài liệu mới', category: 'documents', description: 'Upload và tạo tài liệu mới' },
  { code: 'edit_documents', name: 'Chỉnh sửa tài liệu', category: 'documents', description: 'Chỉnh sửa thông tin tài liệu' },
  { code: 'delete_documents', name: 'Xóa tài liệu', category: 'documents', description: 'Xóa tài liệu' },

  // Quyền về Quản lý hệ thống
  { code: 'manage_categories', name: 'Quản lý lĩnh vực', category: 'system', description: 'Thêm, sửa, xóa lĩnh vực câu hỏi' },
  { code: 'manage_groups', name: 'Quản lý nhóm', category: 'system', description: 'Tạo và quản lý nhóm người dùng' },
  { code: 'manage_settings', name: 'Quản lý cài đặt', category: 'system', description: 'Thay đổi cấu hình hệ thống' },
  { code: 'manage_permissions', name: 'Quản lý phân quyền', category: 'system', description: 'Phân quyền cho các vai trò' },
]

// Phân quyền mặc định cho từng role
const rolePermissions = {
  admin: [
    // Admin có tất cả quyền
    ...permissions.map(p => p.code)
  ],
  leader: [
    // Leader: Chỉ xem và xuất báo cáo
    'view_exams',
    'view_exam_results',
    'export_exam_results',
    'view_tasks',
    'view_task_customers',
    'view_task_results',
    'export_task_results',
    'view_questions',
    'view_users',
    'view_videos',
    'view_documents',
  ],
  user: [
    // User: Chỉ xem video, tài liệu và làm bài thi được gán
    'view_videos',
    'view_documents',
  ]
}

async function main() {
  console.log('🌱 Bắt đầu seed permissions...')

  // 1. Tạo tất cả permissions
  console.log('📝 Tạo permissions...')
  for (const perm of permissions) {
    await prisma.permission.upsert({
      where: { code: perm.code },
      update: {
        name: perm.name,
        description: perm.description,
        category: perm.category,
      },
      create: {
        code: perm.code,
        name: perm.name,
        description: perm.description,
        category: perm.category,
      },
    })
    console.log(`  ✓ ${perm.code}`)
  }

  // 2. Gán quyền cho từng role
  console.log('\n🔑 Gán quyền cho các role...')
  for (const [role, permCodes] of Object.entries(rolePermissions)) {
    console.log(`\n  Role: ${role}`)
    
    // Xóa các quyền cũ của role này
    await prisma.rolePermission.deleteMany({
      where: { role }
    })

    // Gán quyền mới
    for (const code of permCodes) {
      const permission = await prisma.permission.findUnique({
        where: { code }
      })

      if (permission) {
        await prisma.rolePermission.create({
          data: {
            role,
            permissionId: permission.id,
          }
        })
        console.log(`    ✓ ${code}`)
      }
    }
  }

  console.log('\n✅ Seed permissions hoàn tất!')
}

main()
  .catch((e) => {
    console.error('❌ Lỗi khi seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

