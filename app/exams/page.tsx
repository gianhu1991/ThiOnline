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
  maxAttempts: number
  createdAt: string
  _count: {
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
  assignedAt: string
}

export default function ExamsPage() {
  const [exams, setExams] = useState<Exam[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // State cho modal gán bài thi
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [selectedExamId, setSelectedExamId] = useState<string | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([])
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [assigning, setAssigning] = useState(false)

  useEffect(() => {
    fetchExams()
  }, [])

  const fetchExams = async () => {
    try {
      setError(null)
      const timestamp = Date.now()
      const random = Math.random()
      const res = await fetch(`/api/exams?t=${timestamp}&r=${random}`, {
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
        setExams(data)
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
    setSelectedUserIds([])
    setLoadingUsers(true)
    
    try {
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
    setSelectedUserIds([])
    setAssignments([])
  }

  // Toggle chọn user
  const handleToggleUser = (userId: string) => {
    setSelectedUserIds(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    )
  }

  // Gán bài thi cho users đã chọn
  const handleAssign = async () => {
    if (!selectedExamId || selectedUserIds.length === 0) {
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
        body: JSON.stringify({ userIds: selectedUserIds }),
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
        setSelectedUserIds([])
      } else {
        alert(data.error || 'Lỗi khi gán bài thi')
      }
    } catch (error) {
      console.error('Error assigning exam:', error)
      alert('Lỗi khi gán bài thi')
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

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Quản lý bài thi</h1>
          <p className="text-sm text-gray-500 mt-1">Thời gian hiện tại: {getCurrentTime()}</p>
        </div>
        <Link
          href="/exams/create"
          className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700"
        >
          Tạo bài thi mới
        </Link>
      </div>

      {loading ? (
        <div className="text-center py-8">Đang tải...</div>
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
                        <span className="font-medium">Đã có:</span> {exam._count.examResults} kết quả
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 ml-4">
                    <button
                      onClick={() => handleToggleStatus(exam.id, exam.isActive)}
                      className={`${exam.isActive ? 'bg-orange-600 hover:bg-orange-700' : 'bg-green-600 hover:bg-green-700'} text-white px-4 py-2 rounded text-center flex items-center justify-center gap-2`}
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
                    <button
                      onClick={() => handleOpenAssignModal(exam.id)}
                      className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 text-center flex items-center justify-center gap-2"
                      title="Gán bài thi cho người dùng"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                      </svg>
                      Gán BT
                    </button>
                    <Link
                      href={`/exams/${exam.id}/edit`}
                      className="bg-yellow-600 text-white px-4 py-2 rounded hover:bg-yellow-700 text-center flex items-center justify-center gap-2"
                      title="Chỉnh sửa bài thi"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      Sửa
                    </Link>
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
                      className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 text-center flex items-center justify-center gap-2"
                      title="Copy link chia sẻ bài thi"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      Copy link
                    </button>
                    <Link
                      href={`/exams/${exam.id}/take`}
                      className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 text-center"
                    >
                      Làm bài
                    </Link>
                    <Link
                      href={`/exams/${exam.id}/results`}
                      className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 text-center"
                    >
                      Xem kết quả
                    </Link>
                    <button
                      onClick={() => handleDelete(exam.id)}
                      className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
                    >
                      Xóa
                    </button>
                  </div>
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
                <div className="text-center py-8">Đang tải...</div>
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
                    <h3 className="text-lg font-semibold mb-3">Chọn người dùng để gán:</h3>
                    <div className="max-h-64 overflow-y-auto border rounded p-3">
                      {users.length === 0 ? (
                        <p className="text-gray-500 text-center py-4">Không có người dùng nào</p>
                      ) : (
                        <div className="space-y-2">
                          {users.map((user) => {
                            const isAssigned = assignments.some(a => a.userId === user.id)
                            const isSelected = selectedUserIds.includes(user.id)
                            
                            return (
                              <label
                                key={user.id}
                                className={`flex items-center p-2 rounded cursor-pointer ${
                                  isAssigned 
                                    ? 'bg-gray-100 opacity-60 cursor-not-allowed' 
                                    : isSelected 
                                    ? 'bg-blue-50' 
                                    : 'hover:bg-gray-50'
                                }`}
                              >
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
                              </label>
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
                      disabled={selectedUserIds.length === 0 || assigning}
                      className={`px-4 py-2 rounded text-white ${
                        selectedUserIds.length === 0 || assigning
                          ? 'bg-gray-400 cursor-not-allowed'
                          : 'bg-indigo-600 hover:bg-indigo-700'
                      }`}
                    >
                      {assigning ? 'Đang gán...' : `Gán cho ${selectedUserIds.length} người dùng`}
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

