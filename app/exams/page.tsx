'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { format } from 'date-fns'
import { vi } from 'date-fns/locale'

interface Exam {
  id: string
  title: string
  description: string | null
  questionCount: number
  timeLimit: number
  startDate: string
  endDate: string
  isActive: boolean
  isPublic: boolean
  maxAttempts: number
  createdAt: string
  _count?: {
    examResults: number
  }
}

interface User {
  id: string
  username: string
  fullName: string | null
  email: string | null
  role: string
}

interface Assignment {
  id: string
  userId: string
  username: string
  fullName: string | null
  email: string | null
  maxAttempts: number | null
  assignedAt: string
}

interface SelectedUser {
  userId: string
  maxAttempts: number | null
}


export default function ExamsPage() {
  const [exams, setExams] = useState<Exam[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [userRole, setUserRole] = useState<string | null>(null)
  const [permissions, setPermissions] = useState<{ [key: string]: boolean }>({})
  
  // State cho modal gán bài thi
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [selectedExamId, setSelectedExamId] = useState<string | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [selectedUsers, setSelectedUsers] = useState<SelectedUser[]>([])
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [assigning, setAssigning] = useState(false)
  const [examMaxAttempts, setExamMaxAttempts] = useState<number>(1)

  useEffect(() => {
    fetchExams()
    checkUserRole()
    fetchPermissions()
  }, [])

  const checkUserRole = async () => {
    try {
      const res = await fetch('/api/auth/me', {
        credentials: 'include',
      })
      if (res.ok) {
        const data = await res.json()
        setUserRole(data.user?.role || null)
      }
    } catch (error) {
      console.error('Error checking user role:', error)
    }
  }

  const fetchPermissions = async () => {
    try {
      const res = await fetch('/api/auth/permissions', {
        credentials: 'include',
      })
      if (res.ok) {
        const data = await res.json()
        setPermissions(data.permissions || {})
      }
    } catch (error) {
      console.error('Lỗi khi lấy permissions:', error)
    }
  }

  const fetchExams = async () => {
    try {
      setError(null)
      const timestamp = Date.now()
      const random = Math.random()
      const res = await fetch(`/api/exams?full=true&t=${timestamp}&r=${random}`, {
        cache: 'no-store',
        credentials: 'include',
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
          'Pragma': 'no-cache',
        },
      })
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: 'Lỗi không xác định' }))
        throw new Error(errorData.error || `Lỗi ${res.status}: ${res.statusText}`)
      }
      
      const data = await res.json()
      
      // Đảm bảo data là array
      if (Array.isArray(data)) {
        // Normalize data: đảm bảo mỗi exam đều có _count
        const normalizedExams = data
          .filter(exam => exam != null) // Loại bỏ null/undefined
          .map(exam => ({
            ...exam,
            _count: exam._count || { examResults: 0 }
          }))
        setExams(normalizedExams)
      } else {
        console.error('API trả về dữ liệu không phải array:', data)
        setExams([])
        setError('Dữ liệu không hợp lệ từ server')
      }
    } catch (error: any) {
      console.error('Error fetching exams:', error)
      setExams([])
      setError(error.message || 'Lỗi khi tải danh sách bài thi')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc muốn xóa bài thi này?')) return

    try {
      const res = await fetch(`/api/exams/${id}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        fetchExams()
      } else {
        alert('Lỗi khi xóa bài thi')
      }
    } catch (error) {
      alert('Lỗi khi xóa bài thi')
    }
  }

  const getStatus = (exam: Exam) => {
    // Nếu bị tắt thủ công, hiển thị "Đã tắt"
    if (!exam.isActive) {
      return { text: 'Đã tắt', color: 'bg-gray-600' }
    }
    
    const now = new Date()
    const start = new Date(exam.startDate)
    const end = new Date(exam.endDate)

    if (now < start) return { text: 'Chưa mở', color: 'bg-gray-500' }
    if (now > end) return { text: 'Đã đóng', color: 'bg-red-500' }
    return { text: 'Đang mở', color: 'bg-green-500' }
  }

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    if (!confirm(`Bạn có chắc muốn ${currentStatus ? 'tắt' : 'mở'} bài thi này?`)) return

    try {
      const res = await fetch(`/api/exams/${id}/toggle`, {
        method: 'POST',
        credentials: 'include',
      })

      const data = await res.json()

      if (res.ok && data.success) {
        alert(data.message)
        fetchExams()
      } else {
        alert(data.error || 'Lỗi khi thay đổi trạng thái bài thi')
      }
    } catch (error) {
      alert('Lỗi khi thay đổi trạng thái bài thi')
    }
  }

  const handleTogglePublic = async (id: string, currentPublic: boolean) => {
    if (!confirm(`Bạn có chắc muốn ${currentPublic ? 'đặt riêng tư' : 'đặt công khai'} bài thi này?`)) return

    try {
      const res = await fetch(`/api/exams/${id}/toggle-public`, {
        method: 'POST',
        credentials: 'include',
      })

      const data = await res.json()

      if (res.ok && data.success) {
        alert(data.message)
        fetchExams()
      } else {
        alert(data.error || 'Lỗi khi thay đổi trạng thái public của bài thi')
      }
    } catch (error) {
      alert('Lỗi khi thay đổi trạng thái public của bài thi')
    }
  }

  const getCurrentTime = () => {
    return new Date().toLocaleString('vi-VN', {
      timeZone: 'Asia/Ho_Chi_Minh',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
  }

  // Mở modal gán bài thi
  const handleOpenAssignModal = async (examId: string) => {
    setSelectedExamId(examId)
    setShowAssignModal(true)
    setSelectedUsers([])
    setLoadingUsers(true)
    
    try {
      // Lấy thông tin bài thi để lấy maxAttempts mặc định
      const examRes = await fetch(`/api/exams/${examId}`, {
        credentials: 'include',
      })
      const examData = await examRes.json()
      if (examData && examData.maxAttempts) {
        setExamMaxAttempts(examData.maxAttempts)
      }
      
      // Lấy danh sách tất cả users
      const usersRes = await fetch('/api/users', {
        credentials: 'include',
      })
      const usersData = await usersRes.json()
      if (usersData.success && usersData.users) {
        setUsers(usersData.users)
      }
      
      // Lấy danh sách users đã được gán
      const assignRes = await fetch(`/api/exams/${examId}/assign`, {
        credentials: 'include',
      })
      const assignData = await assignRes.json()
      if (assignData.success && assignData.assignments) {
        setAssignments(assignData.assignments)
      }
    } catch (error) {
      console.error('Error loading users/assignments:', error)
      alert('Lỗi khi tải danh sách người dùng')
    } finally {
      setLoadingUsers(false)
    }
  }

  // Đóng modal
  const handleCloseAssignModal = () => {
    setShowAssignModal(false)
    setSelectedExamId(null)
    setSelectedUsers([])
    setAssignments([])
  }

  // Toggle chọn user
  const handleToggleUser = (userId: string) => {
    setSelectedUsers(prev => {
      const exists = prev.find(u => u.userId === userId)
      if (exists) {
        return prev.filter(u => u.userId !== userId)
      } else {
        return [...prev, { userId, maxAttempts: examMaxAttempts }]
      }
    })
  }

  // Cập nhật maxAttempts cho user đã chọn
  const handleUpdateMaxAttempts = (userId: string, maxAttempts: number | null) => {
    setSelectedUsers(prev =>
      prev.map(u =>
        u.userId === userId ? { ...u, maxAttempts: maxAttempts ? parseInt(String(maxAttempts)) : null } : u
      )
    )
  }

  // Gán bài thi cho users đã chọn
  const handleAssign = async () => {
    if (!selectedExamId || selectedUsers.length === 0) {
      alert('Vui lòng chọn ít nhất một người dùng')
      return
    }

    setAssigning(true)
    try {
      const res = await fetch(`/api/exams/${selectedExamId}/assign`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ 
          assignments: selectedUsers.map(u => ({
            userId: u.userId,
            maxAttempts: u.maxAttempts,
          }))
        }),
      })

      const data = await res.json()

      if (res.ok && data.success) {
        alert(data.message)
        // Reload danh sách assignments
        const assignRes = await fetch(`/api/exams/${selectedExamId}/assign`, {
          credentials: 'include',
        })
        const assignData = await assignRes.json()
        if (assignData.success && assignData.assignments) {
          setAssignments(assignData.assignments)
        }
        setSelectedUsers([])
      } else {
        // Hiển thị lỗi chi tiết hơn
        const errorMsg = data.error || data.message || 'Lỗi khi gán bài thi'
        console.error('Error response:', data)
        alert(`Lỗi: ${errorMsg}${data.details ? '\n\nChi tiết: ' + data.details : ''}`)
      }
    } catch (error: any) {
      console.error('Error assigning exam:', error)
      alert(`Lỗi khi gán bài thi: ${error.message || 'Lỗi không xác định'}`)
    } finally {
      setAssigning(false)
    }
  }

  // Hủy gán bài thi
  const handleUnassign = async (userId: string) => {
    if (!selectedExamId) return
    if (!confirm('Bạn có chắc muốn hủy gán bài thi cho người dùng này?')) return

    try {
      const res = await fetch(`/api/exams/${selectedExamId}/assign?userId=${userId}`, {
        method: 'DELETE',
        credentials: 'include',
      })

      const data = await res.json()

      if (res.ok && data.success) {
        alert(data.message)
        // Reload danh sách assignments
        const assignRes = await fetch(`/api/exams/${selectedExamId}/assign`, {
          credentials: 'include',
        })
        const assignData = await assignRes.json()
        if (assignData.success && assignData.assignments) {
          setAssignments(assignData.assignments)
        }
      } else {
        alert(data.error || 'Lỗi khi hủy gán bài thi')
      }
    } catch (error) {
      console.error('Error unassigning exam:', error)
      alert('Lỗi khi hủy gán bài thi')
    }
  }

  // Xuất kết quả ra Excel
  const handleExportResults = async (examId: string) => {
    try {
      const res = await fetch(`/api/exams/${examId}/export`, {
        credentials: 'include',
      })

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: 'Lỗi không xác định' }))
        alert(errorData.error || 'Lỗi khi xuất kết quả')
        return
      }

      // Lấy blob từ response
      const blob = await res.blob()
      
      // Tạo URL tạm thời và tải file
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      
      // Lấy tên file từ header Content-Disposition
      const contentDisposition = res.headers.get('Content-Disposition')
      let fileName = 'ket_qua_bai_thi.xlsx'
      if (contentDisposition) {
        const fileNameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/)
        if (fileNameMatch && fileNameMatch[1]) {
          fileName = decodeURIComponent(fileNameMatch[1].replace(/['"]/g, ''))
        }
      }
      
      a.download = fileName
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error exporting results:', error)
      alert('Lỗi khi xuất kết quả')
    }
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Quản lý bài thi</h1>
          <p className="text-sm text-gray-500 mt-1">Thời gian hiện tại: {getCurrentTime()}</p>
        </div>
        {(permissions['create_exams'] || userRole === 'admin') && (
          <Link
            href="/exams/create"
            className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700"
          >
            Tạo bài thi mới
          </Link>
        )}
      </div>

      {loading ? (
        <div className="fixed inset-0 flex items-center justify-center bg-white z-50">
          <div className="text-center">
            <svg className="animate-spin h-8 w-8 text-blue-600 mx-auto mb-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="text-gray-600">Đang tải...</p>
          </div>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 p-8 rounded-lg shadow-lg text-center">
          <p className="text-red-600 font-semibold mb-2">Lỗi: {error}</p>
          <button
            onClick={fetchExams}
            className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 mt-4"
          >
            Thử lại
          </button>
        </div>
      ) : exams.length === 0 ? (
        <div className="bg-white p-8 rounded-lg shadow-lg text-center text-gray-500">
          Chưa có bài thi nào. Hãy tạo bài thi mới.
        </div>
      ) : (
        <div className="space-y-4">
          {Array.isArray(exams) && exams.map((exam) => {
            const status = getStatus(exam)
            return (
              <div key={exam.id} className="bg-white p-6 rounded-lg shadow-lg">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h2 className="text-2xl font-semibold">{exam.title}</h2>
                      <span className={`${status.color} text-white text-xs px-2 py-1 rounded`}>
                        {status.text}
                      </span>
                    </div>
                    {exam.description && (
                      <p className="text-gray-600 mb-4">{exam.description}</p>
                    )}
                    <div className="grid md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Số câu hỏi:</span> {exam.questionCount}
                      </div>
                      <div>
                        <span className="font-medium">Thời gian:</span> {exam.timeLimit} phút
                      </div>
                      <div>
                        <span className="font-medium">Thời gian mở:</span>{' '}
                        {new Date(exam.startDate).toLocaleString('vi-VN', {
                          timeZone: 'Asia/Ho_Chi_Minh',
                          year: 'numeric',
                          month: '2-digit',
                          day: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                      <div>
                        <span className="font-medium">Thời gian đóng:</span>{' '}
                        {new Date(exam.endDate).toLocaleString('vi-VN', {
                          timeZone: 'Asia/Ho_Chi_Minh',
                          year: 'numeric',
                          month: '2-digit',
                          day: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                      <div>
                        <span className="font-medium">Số lần làm:</span> {exam.maxAttempts}
                      </div>
                      <div>
                        <span className="font-medium">Đã có:</span> {exam._count?.examResults || 0} kết quả
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 mt-4">
                  {/* Kiểm tra permissions cho các nút điều khiển */}
                  {(permissions['toggle_exam_status'] || userRole === 'admin') && (
                    <button
                      onClick={() => handleToggleStatus(exam.id, exam.isActive)}
                      className={`${exam.isActive ? 'bg-orange-600 hover:bg-orange-700' : 'bg-green-600 hover:bg-green-700'} text-white px-4 py-2 rounded text-center flex items-center justify-center gap-2 text-sm`}
                      title={exam.isActive ? 'Tắt bài thi' : 'Mở bài thi'}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        {exam.isActive ? (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        ) : (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                        )}
                      </svg>
                      {exam.isActive ? 'Tắt' : 'Mở'}
                    </button>
                  )}
                  {(permissions['toggle_exam_status'] || userRole === 'admin') && (
                    <button
                      onClick={() => handleTogglePublic(exam.id, exam.isPublic)}
                      className={`${exam.isPublic ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-600 hover:bg-gray-700'} text-white px-4 py-2 rounded text-center flex items-center justify-center gap-2 text-sm`}
                      title={exam.isPublic ? 'Đặt riêng tư (chỉ user được gán)' : 'Đặt công khai (chia sẻ link)'}
                    >
                      {exam.isPublic ? (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                      {exam.isPublic ? 'Riêng tư' : 'Công khai'}
                    </button>
                  )}
                  {(permissions['assign_exams'] || userRole === 'admin') && (
                    <button
                      onClick={() => handleOpenAssignModal(exam.id)}
                      className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 text-center flex items-center justify-center gap-2 text-sm"
                      title="Gán bài thi cho người dùng"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                      </svg>
                      Gán BT
                    </button>
                  )}
                  {(permissions['edit_exams'] || userRole === 'admin') && (
                    <Link
                      href={`/exams/${exam.id}/edit`}
                      className="bg-yellow-600 text-white px-4 py-2 rounded hover:bg-yellow-700 text-center flex items-center justify-center gap-2 text-sm"
                      title="Chỉnh sửa bài thi"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      Sửa
                    </Link>
                  )}
                  {(permissions['edit_exams'] || userRole === 'admin') && (
                    <button
                      onClick={() => {
                        const link = `${window.location.origin}/exams/${exam.id}/take`
                        navigator.clipboard.writeText(link).then(() => {
                          alert('Đã copy link chia sẻ bài thi!')
                        }).catch(() => {
                          // Fallback nếu clipboard không hoạt động
                          const textarea = document.createElement('textarea')
                          textarea.value = link
                          document.body.appendChild(textarea)
                          textarea.select()
                          document.execCommand('copy')
                          document.body.removeChild(textarea)
                          alert('Đã copy link chia sẻ bài thi!')
                        })
                      }}
                      className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 text-center flex items-center justify-center gap-2 text-sm"
                      title="Copy link chia sẻ bài thi"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      Copy link
                    </button>
                  )}
                  {/* Các nút xem và xuất excel - cả admin và leader đều có */}
                  <Link
                    href={`/exams/${exam.id}/results`}
                    className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 text-center text-sm"
                  >
                    Xem kết quả
                  </Link>
                  <button
                    onClick={() => handleExportResults(exam.id)}
                    className="bg-teal-600 text-white px-4 py-2 rounded hover:bg-teal-700 text-center flex items-center justify-center gap-2 text-sm"
                    title="Xuất kết quả ra file Excel"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Xuất KQ
                  </button>
                  {/* Kiểm tra quyền xóa */}
                  {(permissions['delete_exams'] || userRole === 'admin') && (
                    <button
                      onClick={() => handleDelete(exam.id)}
                      className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 text-sm"
                    >
                      Xóa
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Modal Gán Bài Thi */}
      {showAssignModal && selectedExamId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">Gán bài thi cho người dùng</h2>
                <button
                  onClick={handleCloseAssignModal}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {loadingUsers ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-center">
                    <svg className="animate-spin h-8 w-8 text-blue-600 mx-auto mb-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <p className="text-gray-600">Đang tải...</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Danh sách người dùng đã được gán */}
                  {assignments.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold mb-3">Người dùng đã được gán:</h3>
                      <div className="space-y-2">
                        {assignments.map((assignment) => (
                          <div
                            key={assignment.id}
                            className="flex items-center justify-between p-3 bg-gray-50 rounded border"
                          >
                            <div>
                              <div className="font-medium">
                                {assignment.fullName || assignment.username}
                              </div>
                              <div className="text-sm text-gray-500">
                                {assignment.username} {assignment.email && `• ${assignment.email}`}
                              </div>
                              <div className="text-xs text-gray-400">
                                Số lần làm bài: {assignment.maxAttempts || examMaxAttempts} (mặc định: {examMaxAttempts})
                              </div>
                              <div className="text-xs text-gray-400">
                                Gán lúc: {new Date(assignment.assignedAt).toLocaleString('vi-VN')}
                              </div>
                            </div>
                            <button
                              onClick={() => handleUnassign(assignment.userId)}
                              className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 text-sm"
                            >
                              Hủy gán
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Danh sách tất cả người dùng để chọn */}
                  <div>
                    <div className="flex justify-between items-center mb-3">
                      <h3 className="text-lg font-semibold">Chọn người dùng để gán:</h3>
                      {selectedUsers.length > 0 && (
                        <div className="flex items-center gap-2">
                          <label className="text-sm font-medium text-gray-700 whitespace-nowrap">
                            Số lần làm bài cho tất cả:
                          </label>
                          <input
                            type="number"
                            min="1"
                            value={selectedUsers.length > 0 && selectedUsers.every(u => u.maxAttempts === selectedUsers[0].maxAttempts) ? (selectedUsers[0].maxAttempts || examMaxAttempts) : ''}
                            onChange={(e) => {
                              const value = e.target.value ? parseInt(e.target.value) : null
                              // Áp dụng cho tất cả user đã chọn
                              setSelectedUsers(prev => prev.map(u => ({ ...u, maxAttempts: value || examMaxAttempts })))
                            }}
                            className="border rounded px-3 py-1 w-24 text-sm"
                            placeholder={`Mặc định: ${examMaxAttempts}`}
                          />
                          <button
                            onClick={() => {
                              // Áp dụng số lần làm bài mặc định cho tất cả
                              setSelectedUsers(prev => prev.map(u => ({ ...u, maxAttempts: examMaxAttempts })))
                            }}
                            className="text-xs text-blue-600 hover:text-blue-800 underline"
                          >
                            Dùng mặc định
                          </button>
                        </div>
                      )}
                    </div>
                    <div className="max-h-64 overflow-y-auto border rounded p-3">
                      {users.length === 0 ? (
                        <p className="text-gray-500 text-center py-4">Không có người dùng nào</p>
                      ) : (
                        <div className="space-y-2">
                          {users.map((user) => {
                            const isAssigned = assignments.some(a => a.userId === user.id)
                            const selectedUser = selectedUsers.find(u => u.userId === user.id)
                            const isSelected = !!selectedUser
                            
                            return (
                              <div
                                key={user.id}
                                className={`p-3 rounded border ${
                                  isAssigned 
                                    ? 'bg-gray-100 opacity-60' 
                                    : isSelected 
                                    ? 'bg-blue-50 border-blue-300' 
                                    : 'hover:bg-gray-50 border-gray-200'
                                }`}
                              >
                                <div className="flex items-center">
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={() => handleToggleUser(user.id)}
                                    disabled={isAssigned}
                                    className="mr-3"
                                  />
                                  <div className="flex-1">
                                    <div className="font-medium">
                                      {user.fullName || user.username}
                                      {isAssigned && <span className="text-green-600 ml-2">(Đã gán)</span>}
                                    </div>
                                    <div className="text-sm text-gray-500">
                                      {user.username} {user.email && `• ${user.email}`}
                                      {user.role === 'admin' && <span className="ml-2 text-blue-600">(Admin)</span>}
                                    </div>
                                  </div>
                                </div>
                                {isSelected && !isAssigned && (
                                  <div className="mt-3 ml-6 flex items-center gap-2">
                                    <label className="text-sm font-medium text-gray-700 whitespace-nowrap">
                                      Số lần làm bài:
                                    </label>
                                    <input
                                      type="number"
                                      min="1"
                                      value={selectedUser?.maxAttempts || examMaxAttempts}
                                      onChange={(e) => {
                                        const value = e.target.value
                                        handleUpdateMaxAttempts(user.id, value ? parseInt(value) : null)
                                      }}
                                      className="border rounded px-3 py-1 w-24 text-sm"
                                      placeholder={`Mặc định: ${examMaxAttempts}`}
                                    />
                                    <span className="text-xs text-gray-500">
                                      (Để trống = dùng mặc định: {examMaxAttempts})
                                    </span>
                                  </div>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Nút hành động */}
                  <div className="flex justify-end gap-3 pt-4 border-t">
                    <button
                      onClick={handleCloseAssignModal}
                      className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
                    >
                      Đóng
                    </button>
                    <button
                      onClick={handleAssign}
                      disabled={selectedUsers.length === 0 || assigning}
                      className={`px-4 py-2 rounded text-white ${
                        selectedUsers.length === 0 || assigning
                          ? 'bg-gray-400 cursor-not-allowed'
                          : 'bg-indigo-600 hover:bg-indigo-700'
                      }`}
                    >
                      {assigning ? 'Đang gán...' : `Gán cho ${selectedUsers.length} người dùng`}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

