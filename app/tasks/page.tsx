'use client'

import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import { vi } from 'date-fns/locale'

interface Task {
  id: string
  name: string
  description: string | null
  isActive: boolean
  startDate: string | null
  endDate: string | null
  dailyAssignmentCount: number
  createdBy: string
  createdAt: string
  completedCount: number
  totalCount: number
  pendingCount: number
}

interface User {
  id: string
  username: string
  fullName: string | null
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isSuperAdmin, setIsSuperAdmin] = useState(false)
  
  // State cho modal tạo nhiệm vụ
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [createForm, setCreateForm] = useState({
    name: '',
    description: '',
    startDate: '',
    endDate: '',
    dailyAssignmentCount: 0
  })
  const [creating, setCreating] = useState(false)

  // State cho modal quản lý nhiệm vụ
  const [showManageModal, setShowManageModal] = useState(false)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [manageForm, setManageForm] = useState({
    isActive: true,
    startDate: '',
    endDate: '',
    dailyAssignmentCount: 0
  })
  const [updating, setUpdating] = useState(false)

  // State cho upload file
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [uploadTaskId, setUploadTaskId] = useState<string | null>(null)
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)

  // State cho gán nhiệm vụ
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [users, setUsers] = useState<User[]>([])
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([])
  const [assigning, setAssigning] = useState(false)

  // State cho phân giao lại
  const [showReassignModal, setShowReassignModal] = useState(false)
  const [reassignDailyCount, setReassignDailyCount] = useState(0)
  const [reassigning, setReassigning] = useState(false)

  useEffect(() => {
    checkSuperAdmin()
    fetchTasks()
    fetchUsers()
  }, [])

  const checkSuperAdmin = async () => {
    try {
      const res = await fetch('/api/users/check-super-admin', {
        credentials: 'include',
      })
      const data = await res.json()
      console.log('[Tasks Page] Super Admin check result:', data)
      setIsSuperAdmin(data.isSuperAdmin || false)
      
      // Nếu không phải super admin, vẫn cho phép nếu là user "admin"
      if (!data.isSuperAdmin) {
        // Kiểm tra lại bằng cách lấy thông tin user hiện tại
        const meRes = await fetch('/api/auth/me', {
          credentials: 'include',
        })
        if (meRes.ok) {
          const meData = await meRes.json()
          if (meData.user?.username === 'admin') {
            console.log('[Tasks Page] User is "admin", allowing access')
            setIsSuperAdmin(true)
          }
        }
      }
    } catch (error) {
      console.error('Error checking super admin:', error)
      setIsSuperAdmin(false)
    }
  }

  const fetchTasks = async () => {
    try {
      setError(null)
      const res = await fetch('/api/tasks', {
        credentials: 'include',
      })
      
      if (!res.ok) {
        if (res.status === 403) {
          setError('Chỉ Super Admin mới được truy cập trang này')
          setIsSuperAdmin(false)
        } else {
          const errorData = await res.json().catch(() => ({ error: 'Lỗi không xác định' }))
          throw new Error(errorData.error || `Lỗi ${res.status}`)
        }
        return
      }
      
      const data = await res.json()
      setTasks(data.tasks || [])
    } catch (error: any) {
      console.error('Error fetching tasks:', error)
      setError(error.message || 'Lỗi khi tải danh sách nhiệm vụ')
    } finally {
      setLoading(false)
    }
  }

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/users', {
        credentials: 'include',
      })
      if (res.ok) {
        const data = await res.json()
        setUsers(data.users || [])
      }
    } catch (error) {
      console.error('Error fetching users:', error)
    }
  }

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreating(true)
    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(createForm)
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || 'Lỗi khi tạo nhiệm vụ')
      }

      setShowCreateModal(false)
      setCreateForm({
        name: '',
        description: '',
        startDate: '',
        endDate: '',
        dailyAssignmentCount: 0
      })
      fetchTasks()
    } catch (error: any) {
      alert(error.message || 'Lỗi khi tạo nhiệm vụ')
    } finally {
      setCreating(false)
    }
  }

  const handleUpdateTask = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedTask) return

    setUpdating(true)
    try {
      const res = await fetch(`/api/tasks/${selectedTask.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(manageForm)
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || 'Lỗi khi cập nhật nhiệm vụ')
      }

      setShowManageModal(false)
      fetchTasks()
    } catch (error: any) {
      alert(error.message || 'Lỗi khi cập nhật nhiệm vụ')
    } finally {
      setUpdating(false)
    }
  }

  const handleUploadFile = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!uploadTaskId || !uploadFile) return

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', uploadFile)

      const res = await fetch(`/api/tasks/${uploadTaskId}/upload`, {
        method: 'POST',
        credentials: 'include',
        body: formData
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || 'Lỗi khi upload file')
      }

      const data = await res.json()
      alert(data.message || 'Upload thành công')
      setShowUploadModal(false)
      setUploadFile(null)
      setUploadTaskId(null)
      fetchTasks()
    } catch (error: any) {
      alert(error.message || 'Lỗi khi upload file')
    } finally {
      setUploading(false)
    }
  }

  const handleAssignTask = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedTask || selectedUserIds.length === 0) return

    setAssigning(true)
    try {
      const res = await fetch(`/api/tasks/${selectedTask.id}/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ userIds: selectedUserIds })
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || 'Lỗi khi gán nhiệm vụ')
      }

      alert('Đã gán nhiệm vụ thành công')
      setShowAssignModal(false)
      setSelectedUserIds([])
      fetchTasks()
    } catch (error: any) {
      alert(error.message || 'Lỗi khi gán nhiệm vụ')
    } finally {
      setAssigning(false)
    }
  }

  const handleReassign = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedTask || !reassignDailyCount) return

    setReassigning(true)
    try {
      const res = await fetch(`/api/tasks/${selectedTask.id}/reassign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ dailyCount: reassignDailyCount })
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || 'Lỗi khi phân giao lại')
      }

      const data = await res.json()
      alert(data.message || 'Phân giao lại thành công')
      setShowReassignModal(false)
      setReassignDailyCount(0)
      fetchTasks()
    } catch (error: any) {
      alert(error.message || 'Lỗi khi phân giao lại')
    } finally {
      setReassigning(false)
    }
  }

  const handleExport = async (taskId: string) => {
    try {
      const res = await fetch(`/api/tasks/${taskId}/export`, {
        credentials: 'include',
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || 'Lỗi khi xuất file')
      }

      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `ket-qua-${Date.now()}.xlsx`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error: any) {
      alert(error.message || 'Lỗi khi xuất file')
    }
  }

  const openManageModal = (task: Task) => {
    setSelectedTask(task)
    setManageForm({
      isActive: task.isActive,
      startDate: task.startDate ? format(new Date(task.startDate), 'yyyy-MM-dd') : '',
      endDate: task.endDate ? format(new Date(task.endDate), 'yyyy-MM-dd') : '',
      dailyAssignmentCount: task.dailyAssignmentCount
    })
    setShowManageModal(true)
  }

  const openAssignModal = (task: Task) => {
    setSelectedTask(task)
    setSelectedUserIds([])
    setShowAssignModal(true)
  }

  const openReassignModal = (task: Task) => {
    setSelectedTask(task)
    setReassignDailyCount(task.dailyAssignmentCount || 0)
    setShowReassignModal(true)
  }

  if (!isSuperAdmin) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">Bạn không có quyền truy cập trang này. Chỉ Super Admin mới được phép.</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="text-center">Đang tải...</div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Quản lý nhiệm vụ</h1>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          + Tạo nhiệm vụ mới
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      <div className="grid gap-4">
        {tasks.map((task) => (
          <div key={task.id} className="bg-white border rounded-lg p-6 shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-xl font-semibold">{task.name}</h2>
                {task.description && (
                  <p className="text-gray-600 mt-1">{task.description}</p>
                )}
                <div className="mt-2 flex gap-4 text-sm text-gray-500">
                  <span>Tạo bởi: {task.createdBy}</span>
                  <span>
                    {task.startDate && task.endDate
                      ? `${format(new Date(task.startDate), 'dd/MM/yyyy', { locale: vi })} - ${format(new Date(task.endDate), 'dd/MM/yyyy', { locale: vi })}`
                      : 'Chưa đặt thời gian'}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-3 py-1 rounded-full text-sm ${task.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  {task.isActive ? 'Đang hoạt động' : 'Đã tắt'}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="bg-blue-50 p-3 rounded">
                <div className="text-sm text-gray-600">Tổng số KH</div>
                <div className="text-2xl font-bold text-blue-600">{task.totalCount}</div>
              </div>
              <div className="bg-green-50 p-3 rounded">
                <div className="text-sm text-gray-600">Đã hoàn thành</div>
                <div className="text-2xl font-bold text-green-600">{task.completedCount}</div>
              </div>
              <div className="bg-orange-50 p-3 rounded">
                <div className="text-sm text-gray-600">Chưa hoàn thành</div>
                <div className="text-2xl font-bold text-orange-600">{task.pendingCount}</div>
              </div>
            </div>

            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => openManageModal(task)}
                className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 text-sm"
              >
                Quản lý
              </button>
              <button
                onClick={() => {
                  setUploadTaskId(task.id)
                  setShowUploadModal(true)
                }}
                className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 text-sm"
              >
                Upload Excel
              </button>
              <button
                onClick={() => openAssignModal(task)}
                className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 text-sm"
              >
                Gán nhiệm vụ
              </button>
              <button
                onClick={() => openReassignModal(task)}
                className="bg-yellow-600 text-white px-4 py-2 rounded hover:bg-yellow-700 text-sm"
              >
                Phân giao lại
              </button>
              <button
                onClick={() => handleExport(task.id)}
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 text-sm"
              >
                Xuất Excel
              </button>
            </div>
          </div>
        ))}

        {tasks.length === 0 && !loading && (
          <div className="text-center py-12 text-gray-500">
            Chưa có nhiệm vụ nào. Hãy tạo nhiệm vụ mới!
          </div>
        )}
      </div>

      {/* Modal tạo nhiệm vụ */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-2xl font-bold mb-4">Tạo nhiệm vụ mới</h2>
            <form onSubmit={handleCreateTask}>
              <div className="mb-4">
                <label className="block mb-2 font-semibold">Tên nhiệm vụ *</label>
                <input
                  type="text"
                  value={createForm.name}
                  onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block mb-2 font-semibold">Mô tả</label>
                <textarea
                  value={createForm.description}
                  onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                  rows={3}
                />
              </div>
              <div className="mb-4">
                <label className="block mb-2 font-semibold">Thời gian bắt đầu</label>
                <input
                  type="date"
                  value={createForm.startDate}
                  onChange={(e) => setCreateForm({ ...createForm, startDate: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                />
              </div>
              <div className="mb-4">
                <label className="block mb-2 font-semibold">Thời gian kết thúc</label>
                <input
                  type="date"
                  value={createForm.endDate}
                  onChange={(e) => setCreateForm({ ...createForm, endDate: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                />
              </div>
              <div className="mb-4">
                <label className="block mb-2 font-semibold">Số lượng phân giao hàng ngày</label>
                <input
                  type="number"
                  value={createForm.dailyAssignmentCount}
                  onChange={(e) => setCreateForm({ ...createForm, dailyAssignmentCount: parseInt(e.target.value) || 0 })}
                  className="w-full border rounded px-3 py-2"
                  min="0"
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={creating}
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
                >
                  {creating ? 'Đang tạo...' : 'Tạo'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400"
                >
                  Hủy
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal quản lý nhiệm vụ */}
      {showManageModal && selectedTask && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-2xl font-bold mb-4">Quản lý nhiệm vụ: {selectedTask.name}</h2>
            <form onSubmit={handleUpdateTask}>
              <div className="mb-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={manageForm.isActive}
                    onChange={(e) => setManageForm({ ...manageForm, isActive: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <span className="font-semibold">Bật nhiệm vụ</span>
                </label>
              </div>
              <div className="mb-4">
                <label className="block mb-2 font-semibold">Thời gian bắt đầu</label>
                <input
                  type="date"
                  value={manageForm.startDate}
                  onChange={(e) => setManageForm({ ...manageForm, startDate: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                />
              </div>
              <div className="mb-4">
                <label className="block mb-2 font-semibold">Thời gian kết thúc</label>
                <input
                  type="date"
                  value={manageForm.endDate}
                  onChange={(e) => setManageForm({ ...manageForm, endDate: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                />
              </div>
              <div className="mb-4">
                <label className="block mb-2 font-semibold">Số lượng phân giao hàng ngày</label>
                <input
                  type="number"
                  value={manageForm.dailyAssignmentCount}
                  onChange={(e) => setManageForm({ ...manageForm, dailyAssignmentCount: parseInt(e.target.value) || 0 })}
                  className="w-full border rounded px-3 py-2"
                  min="0"
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={updating}
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
                >
                  {updating ? 'Đang cập nhật...' : 'Cập nhật'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowManageModal(false)}
                  className="bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400"
                >
                  Hủy
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal upload file */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-2xl font-bold mb-4">Upload file Excel</h2>
            <div className="mb-4 p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800 font-medium mb-2">Cấu trúc file Excel:</p>
              <p className="text-xs text-blue-700">
                STT | account | Tên KH | địa chỉ | số điện thoại | NV thực hiện
              </p>
            </div>
            <form onSubmit={handleUploadFile}>
              <div className="mb-4">
                <label className="block mb-2 font-semibold">Chọn file Excel</label>
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                  className="w-full border rounded px-3 py-2"
                  required
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={uploading || !uploadFile}
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
                >
                  {uploading ? 'Đang upload...' : 'Upload'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowUploadModal(false)
                    setUploadFile(null)
                    setUploadTaskId(null)
                  }}
                  className="bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400"
                >
                  Hủy
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal gán nhiệm vụ */}
      {showAssignModal && selectedTask && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 max-h-[80vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4">Gán nhiệm vụ: {selectedTask.name}</h2>
            <form onSubmit={handleAssignTask}>
              <div className="mb-4">
                <label className="block mb-2 font-semibold">Chọn người dùng</label>
                <div className="border rounded p-3 max-h-60 overflow-y-auto">
                  {users.map((user) => (
                    <label key={user.id} className="flex items-center gap-2 mb-2">
                      <input
                        type="checkbox"
                        checked={selectedUserIds.includes(user.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedUserIds([...selectedUserIds, user.id])
                          } else {
                            setSelectedUserIds(selectedUserIds.filter(id => id !== user.id))
                          }
                        }}
                        className="w-4 h-4"
                      />
                      <span>{user.username} {user.fullName && `(${user.fullName})`}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={assigning || selectedUserIds.length === 0}
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
                >
                  {assigning ? 'Đang gán...' : 'Gán nhiệm vụ'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAssignModal(false)
                    setSelectedUserIds([])
                  }}
                  className="bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400"
                >
                  Hủy
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal phân giao lại */}
      {showReassignModal && selectedTask && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-2xl font-bold mb-4">Phân giao lại: {selectedTask.name}</h2>
            <p className="text-sm text-gray-600 mb-4">
              Phân giao tự động các khách hàng chưa hoàn thành cho các người dùng đã được gán nhiệm vụ.
            </p>
            <form onSubmit={handleReassign}>
              <div className="mb-4">
                <label className="block mb-2 font-semibold">Số lượng phân giao hàng ngày</label>
                <input
                  type="number"
                  value={reassignDailyCount}
                  onChange={(e) => setReassignDailyCount(parseInt(e.target.value) || 0)}
                  className="w-full border rounded px-3 py-2"
                  min="1"
                  required
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={reassigning || !reassignDailyCount}
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
                >
                  {reassigning ? 'Đang phân giao...' : 'Phân giao lại'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowReassignModal(false)
                    setReassignDailyCount(0)
                  }}
                  className="bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400"
                >
                  Hủy
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

