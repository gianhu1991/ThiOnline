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
  role: string
}

interface UserGroup {
  id: string
  name: string
  description: string | null
  _count: {
    members: number
  }
}

interface Customer {
  id: string
  stt: number
  account: string
  customerName: string
  address: string | null
  phone: string | null
  assignedUserId: string | null
  assignedUsername: string | null
  isCompleted: boolean
  completedAt: string | null
  completedBy: string | null
}


export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
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
  const [userGroups, setUserGroups] = useState<UserGroup[]>([])
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null)
  const [groupUsers, setGroupUsers] = useState<User[]>([])
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([])
  const [assigning, setAssigning] = useState(false)
  const [loadingGroups, setLoadingGroups] = useState(false)

  // State cho phân giao lại
  const [showReassignModal, setShowReassignModal] = useState(false)
  const [reassignDailyCount, setReassignDailyCount] = useState(0)
  const [reassigning, setReassigning] = useState(false)

  // State cho xem danh sách khách hàng
  const [showCustomersModal, setShowCustomersModal] = useState(false)
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loadingCustomers, setLoadingCustomers] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCustomers, setTotalCustomers] = useState(0)
  const [completedCount, setCompletedCount] = useState(0)
  const [pendingCount, setPendingCount] = useState(0)

  // State cho sửa khách hàng
  const [showEditCustomerModal, setShowEditCustomerModal] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null)
  const [editCustomerForm, setEditCustomerForm] = useState({
    stt: 0,
    account: '',
    customerName: '',
    address: '',
    phone: '',
    assignedUsername: ''
  })
  const [updatingCustomer, setUpdatingCustomer] = useState(false)
  const [deletingCustomer, setDeletingCustomer] = useState<string | null>(null)
  const [deletingTaskId, setDeletingTaskId] = useState<string | null>(null)
  const [deletingAllCustomers, setDeletingAllCustomers] = useState(false)

  useEffect(() => {
    fetchTasks()
    fetchUsers()
    fetchUserGroups()
  }, [])

  const fetchTasks = async () => {
    try {
      setError(null)
      const res = await fetch('/api/tasks', {
        credentials: 'include',
      })
      
      if (!res.ok) {
        if (res.status === 403) {
          setError('Chỉ admin mới được truy cập trang này')
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

  const fetchUserGroups = async () => {
    try {
      setLoadingGroups(true)
      const res = await fetch('/api/user-groups', {
        credentials: 'include',
      })
      if (res.ok) {
        const data = await res.json()
        setUserGroups(data.groups || [])
      }
    } catch (error) {
      console.error('Error fetching user groups:', error)
    } finally {
      setLoadingGroups(false)
    }
  }

  const fetchGroupUsers = async (groupId: string) => {
    try {
      const res = await fetch(`/api/user-groups/${groupId}`, {
        credentials: 'include',
      })
      if (res.ok) {
        const data = await res.json()
        if (data.success && data.group) {
          const members = data.group.members || []
          setGroupUsers(members.map((m: any) => m.user))
        }
      }
    } catch (error) {
      console.error('Error fetching group users:', error)
      setGroupUsers([])
    }
  }

  const handleGroupChange = (groupId: string | null) => {
    setSelectedGroupId(groupId)
    if (groupId) {
      fetchGroupUsers(groupId)
    } else {
      setGroupUsers([])
    }
    // KHÔNG reset selectedUserIds khi đổi nhóm - giữ lại các user đã được gán
    // Các checkbox sẽ tự động hiển thị đúng trạng thái dựa trên selectedUserIds
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

      const data = await res.json()
      const newTask = data.task
      
      setShowCreateModal(false)
      setCreateForm({
        name: '',
        description: '',
        startDate: '',
        endDate: '',
        dailyAssignmentCount: 0
      })
      
      // Tự động mở modal upload file sau khi tạo nhiệm vụ thành công
      if (newTask && newTask.id) {
        setUploadTaskId(newTask.id)
        setShowUploadModal(true)
      }
      
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
      // Hiển thị thông báo chi tiết
      let message = data.message || 'Upload thành công'
      if (data.added !== undefined && data.skipped !== undefined) {
        message = `Đã thêm ${data.added} khách hàng mới`
        if (data.skipped > 0) {
          message += `\nBỏ qua ${data.skipped} khách hàng đã tồn tại (trùng account)`
        }
      }
      alert(message)
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
        // Thử parse JSON error, nếu không được thì dùng text
        let errorMessage = 'Lỗi khi xuất file'
        try {
          const errorData = await res.json()
          errorMessage = errorData.error || errorMessage
        } catch {
          const errorText = await res.text()
          errorMessage = errorText || errorMessage
        }
        alert(errorMessage)
        return
      }

      // Kiểm tra content type
      const contentType = res.headers.get('Content-Type')
      if (!contentType || !contentType.includes('spreadsheet')) {
        alert('Lỗi: File không đúng định dạng')
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
      let fileName = `ket-qua-${Date.now()}.xlsx`
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
    } catch (error: any) {
      console.error('Error exporting file:', error)
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

  const openAssignModal = async (task: Task) => {
    setSelectedTask(task)
    setSelectedGroupId(null)
    setGroupUsers([])
    
    // Fetch danh sách user đã được gán nhiệm vụ
    try {
      const res = await fetch(`/api/tasks/${task.id}`, {
        credentials: 'include',
      })
      if (res.ok) {
        const data = await res.json()
        const assignedUserIds = (data.task.assignments || []).map((a: any) => a.user.id)
        console.log('Assigned user IDs:', assignedUserIds)
        console.log('Assignments data:', data.task.assignments)
        setSelectedUserIds(assignedUserIds)
      } else {
        console.error('Failed to fetch task assignments')
        setSelectedUserIds([])
      }
    } catch (error) {
      console.error('Error fetching task assignments:', error)
      setSelectedUserIds([])
    }
    
    setShowAssignModal(true)
  }

  const openReassignModal = (task: Task) => {
    setSelectedTask(task)
    setReassignDailyCount(task.dailyAssignmentCount || 0)
    setShowReassignModal(true)
  }

  const openCustomersModal = async (taskId: string, page: number = 1) => {
    setSelectedTask(tasks.find(t => t.id === taskId) || null)
    setCurrentPage(page)
    setSearchTerm('') // Reset search khi mở modal
    await fetchCustomersPage(taskId, page)
  }

  const fetchCustomersPage = async (taskId: string, page: number = 1) => {
    setLoadingCustomers(true)
    try {
      // Load customers với pagination
      const res = await fetch(`/api/tasks/${taskId}?includeCustomers=true&page=${page}&limit=50`, {
        credentials: 'include',
      })
      if (res.ok) {
        const data = await res.json()
        setCustomers(data.task.customers || [])
        if (data.pagination) {
          setTotalPages(data.pagination.totalPages)
          setTotalCustomers(data.pagination.total)
          setCompletedCount(data.pagination.completed || 0)
          setPendingCount(data.pagination.pending || 0)
          setCurrentPage(data.pagination.page)
        }
        if (page === 1) {
          setShowCustomersModal(true)
        }
      } else {
        alert('Lỗi khi tải danh sách khách hàng')
      }
    } catch (error) {
      console.error('Error fetching customers:', error)
      alert('Lỗi khi tải danh sách khách hàng')
    } finally {
      setLoadingCustomers(false)
    }
  }

  const openEditCustomerModal = (customer: Customer) => {
    setEditingCustomer(customer)
    setEditCustomerForm({
      stt: customer.stt,
      account: customer.account,
      customerName: customer.customerName,
      address: customer.address || '',
      phone: customer.phone || '',
      assignedUsername: customer.assignedUsername || ''
    })
    setShowEditCustomerModal(true)
  }

  const handleUpdateCustomer = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedTask || !editingCustomer) return

    setUpdatingCustomer(true)
    try {
      const res = await fetch(`/api/tasks/${selectedTask.id}/customers/${editingCustomer.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(editCustomerForm)
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || 'Lỗi khi cập nhật khách hàng')
      }

      alert('Cập nhật khách hàng thành công')
      setShowEditCustomerModal(false)
      setEditingCustomer(null)
      // Refresh danh sách khách hàng
      if (selectedTask) {
        await fetchCustomersPage(selectedTask.id, currentPage)
      }
      fetchTasks()
    } catch (error: any) {
      alert(error.message || 'Lỗi khi cập nhật khách hàng')
    } finally {
      setUpdatingCustomer(false)
    }
  }

  const handleDeleteCustomer = async (customerId: string) => {
    if (!selectedTask) return

    if (!confirm('Bạn có chắc chắn muốn xóa khách hàng này không?')) {
      return
    }

    setDeletingCustomer(customerId)
    try {
      const res = await fetch(`/api/tasks/${selectedTask.id}/customers/${customerId}`, {
        method: 'DELETE',
        credentials: 'include',
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || 'Lỗi khi xóa khách hàng')
      }

      alert('Đã xóa khách hàng thành công')
      // Refresh danh sách khách hàng
      if (selectedTask) {
        await fetchCustomersPage(selectedTask.id, currentPage)
      }
      fetchTasks()
    } catch (error: any) {
      alert(error.message || 'Lỗi khi xóa khách hàng')
    } finally {
      setDeletingCustomer(null)
    }
  }

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa nhiệm vụ này không? Tất cả dữ liệu liên quan (khách hàng, phân giao) sẽ bị xóa vĩnh viễn.')) {
      return
    }

    setDeletingTaskId(taskId)
    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: 'DELETE',
        credentials: 'include',
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || 'Lỗi khi xóa nhiệm vụ')
      }

      alert('Đã xóa nhiệm vụ thành công')
      fetchTasks()
    } catch (error: any) {
      alert(error.message || 'Lỗi khi xóa nhiệm vụ')
    } finally {
      setDeletingTaskId(null)
    }
  }

  const handleDeleteAllCustomers = async () => {
      if (!selectedTask) return

    if (!confirm(`Bạn có chắc chắn muốn xóa TẤT CẢ ${totalCustomers} khách hàng trong nhiệm vụ này không? Hành động này không thể hoàn tác!`)) {
      return
    }

    setDeletingAllCustomers(true)
    try {
      const res = await fetch(`/api/tasks/${selectedTask.id}/customers/delete-all`, {
        method: 'DELETE',
        credentials: 'include',
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || 'Lỗi khi xóa khách hàng')
      }

      const data = await res.json()
      alert(data.message || 'Đã xóa tất cả khách hàng thành công')
      // Refresh danh sách khách hàng
      if (selectedTask) {
        await fetchCustomersPage(selectedTask.id, currentPage)
      }
      fetchTasks()
    } catch (error: any) {
      alert(error.message || 'Lỗi khi xóa khách hàng')
    } finally {
      setDeletingAllCustomers(false)
    }
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
                onClick={() => openCustomersModal(task.id)}
                className="bg-teal-600 text-white px-4 py-2 rounded hover:bg-teal-700 text-sm"
              >
                Xem DS khách hàng
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
              <button
                onClick={() => handleDeleteTask(task.id)}
                disabled={deletingTaskId === task.id}
                className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 disabled:opacity-50 text-sm"
              >
                {deletingTaskId === task.id ? 'Đang xóa...' : 'Xóa'}
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
              <p className="text-xs text-blue-700 mb-3">
                STT | account | Tên KH | địa chỉ | số điện thoại | NV thực hiện
              </p>
              <a
                href="/api/tasks/template"
                download="mau-upload-nhiem-vu.xlsx"
                className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 font-medium underline"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Tải file mẫu Excel
              </a>
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
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4">Gán nhiệm vụ: {selectedTask.name}</h2>
            <form onSubmit={handleAssignTask}>
              <div className="mb-4">
                <label className="block mb-2 font-semibold">Chọn nhóm người dùng</label>
                <select
                  value={selectedGroupId || ''}
                  onChange={(e) => handleGroupChange(e.target.value || null)}
                  className="w-full border rounded px-3 py-2 mb-2"
                >
                  <option value="">-- Tất cả người dùng --</option>
                  {userGroups.map((group) => (
                    <option key={group.id} value={group.id}>
                      {group.name} ({group._count.members} thành viên)
                    </option>
                  ))}
                </select>
              </div>

              <div className="mb-4">
                <label className="block mb-2 font-semibold">
                  Chọn người dùng {selectedGroupId ? `(trong nhóm)` : `(tất cả)`}
                </label>
                <div className="border rounded p-3 max-h-60 overflow-y-auto bg-gray-50">
                  {selectedGroupId ? (
                    // Hiển thị user trong nhóm đã chọn
                    groupUsers.length > 0 ? (
                      groupUsers.map((user) => (
                        <label key={user.id} className="flex items-center gap-2 mb-2 p-2 hover:bg-gray-100 rounded cursor-pointer">
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
                          <span className="flex-1">{user.username} {user.fullName && `(${user.fullName})`}</span>
                        </label>
                      ))
                    ) : (
                      <p className="text-gray-500 text-center py-4">Nhóm này chưa có thành viên</p>
                    )
                  ) : (
                    // Hiển thị tất cả user
                    users.length > 0 ? (
                      users.map((user) => (
                        <label key={user.id} className="flex items-center gap-2 mb-2 p-2 hover:bg-gray-100 rounded cursor-pointer">
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
                          <span className="flex-1">{user.username} {user.fullName && `(${user.fullName})`}</span>
                        </label>
                      ))
                    ) : (
                      <p className="text-gray-500 text-center py-4">Chưa có người dùng nào</p>
                    )
                  )}
                </div>
                {selectedUserIds.length > 0 && (
                  <p className="text-sm text-blue-600 mt-2">
                    Đã chọn: {selectedUserIds.length} người dùng
                  </p>
                )}
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
                    setSelectedGroupId(null)
                    setGroupUsers([])
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

      {/* Modal xem danh sách khách hàng */}
      {showCustomersModal && selectedTask && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-[98vw] lg:max-w-[95vw] xl:max-w-[90vw] max-h-[90vh] flex flex-col">
            {/* Header cố định */}
            <div className="flex-shrink-0 p-4 md:p-6 pb-4 border-b">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl md:text-2xl font-bold">Danh sách khách hàng: {selectedTask.name}</h2>
                <button
                  onClick={() => {
                    setShowCustomersModal(false)
                    setCustomers([])
                    setSelectedTask(null)
                    setSearchTerm('') // Reset search khi đóng modal
                    setCurrentPage(1)
                    setTotalPages(1)
                    setTotalCustomers(0)
                    setCompletedCount(0)
                    setPendingCount(0)
                  }}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ×
                </button>
              </div>

              {loadingCustomers ? (
                <div className="text-center py-8">Đang tải...</div>
              ) : (
                <>
                  {/* Ô tìm kiếm */}
                  <div className="mb-4">
                    <input
                      type="text"
                      placeholder="Tìm kiếm theo tên, account, số điện thoại, địa chỉ, NV thực hiện..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full border rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* Lọc danh sách khách hàng theo searchTerm */}
                  {(() => {
                    const filteredCustomers = customers.filter(customer => {
                      if (!searchTerm.trim()) return true
                      const search = searchTerm.toLowerCase().trim()
                      return (
                        customer.customerName.toLowerCase().includes(search) ||
                        customer.account.toLowerCase().includes(search) ||
                        (customer.phone && customer.phone.toLowerCase().includes(search)) ||
                        (customer.address && customer.address.toLowerCase().includes(search)) ||
                        (customer.assignedUsername && customer.assignedUsername.toLowerCase().trim().includes(search))
                      )
                    })
                    
                    return (
                      <>
                        <div className="mb-4 p-3 bg-blue-50 rounded flex justify-between items-center">
                          <div className="grid grid-cols-3 gap-4 text-sm flex-1">
                            <div>
                              <span className="text-gray-600">Tổng số: </span>
                              <span className="font-bold">{totalCustomers}</span>
                              {searchTerm && (
                                <span className="text-gray-500 text-xs ml-1">
                                  (hiển thị {filteredCustomers.length} trên trang này)
                                </span>
                              )}
                            </div>
                            <div>
                              <span className="text-gray-600">Đã hoàn thành: </span>
                              <span className="font-bold text-green-600">{completedCount}</span>
                            </div>
                            <div>
                              <span className="text-gray-600">Chưa hoàn thành: </span>
                              <span className="font-bold text-orange-600">{pendingCount}</span>
                            </div>
                          </div>
                          <button
                            onClick={handleDeleteAllCustomers}
                            disabled={deletingAllCustomers || totalCustomers === 0}
                            className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm ml-4"
                          >
                            {deletingAllCustomers ? 'Đang xóa...' : 'Xóa tất cả'}
                          </button>
                        </div>
                      </>
                    )
                  })()}
                </>
              )}
            </div>

            {/* Nội dung cuộn được */}
            <div className="flex-1 overflow-y-auto p-6 pt-4">
              {!loadingCustomers && (() => {
                const filteredCustomers = customers.filter(customer => {
                  if (!searchTerm.trim()) return true
                  const search = searchTerm.toLowerCase().trim()
                  return (
                    customer.customerName.toLowerCase().includes(search) ||
                    customer.account.toLowerCase().includes(search) ||
                    (customer.phone && customer.phone.toLowerCase().includes(search)) ||
                    (customer.address && customer.address.toLowerCase().includes(search)) ||
                    (customer.assignedUsername && customer.assignedUsername.toLowerCase().trim().includes(search))
                  )
                })
                
                return (
                  <>
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse">
                        <thead className="sticky top-0 bg-white z-10 shadow-sm">
                          <tr>
                            <th className="border p-2 text-left bg-gray-100 sticky top-0">STT</th>
                            <th className="border p-2 text-left bg-gray-100 sticky top-0">Account</th>
                            <th className="border p-2 text-left bg-gray-100 sticky top-0">Tên KH</th>
                            <th className="border p-2 text-left bg-gray-100 sticky top-0">Địa chỉ</th>
                            <th className="border p-2 text-left bg-gray-100 sticky top-0">Số điện thoại</th>
                            <th className="border p-2 text-left bg-gray-100 sticky top-0">NV thực hiện</th>
                            <th className="border p-2 text-left bg-gray-100 sticky top-0">Trạng thái</th>
                            <th className="border p-2 text-left bg-gray-100 sticky top-0">Thao tác</th>
                          </tr>
                        </thead>
                          <tbody>
                            {filteredCustomers.length > 0 ? (
                              filteredCustomers.map((customer) => (
                        <tr key={customer.id} className={customer.isCompleted ? 'bg-green-50' : ''}>
                          <td className="border p-2">{customer.stt}</td>
                          <td className="border p-2">{customer.account}</td>
                          <td className="border p-2 font-medium">{customer.customerName}</td>
                          <td className="border p-2">{customer.address || '-'}</td>
                          <td className="border p-2">{customer.phone || '-'}</td>
                          <td className="border p-2">{customer.assignedUsername || '-'}</td>
                          <td className="border p-2">
                            {customer.isCompleted ? (
                              <span className="text-green-600 font-semibold">Đã hoàn thành</span>
                            ) : (
                              <span className="text-orange-600 font-semibold">Chưa hoàn thành</span>
                            )}
                          </td>
                          <td className="border p-2">
                            <div className="flex gap-2">
                              <button
                                onClick={() => openEditCustomerModal(customer)}
                                className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                              >
                                Sửa
                              </button>
                              <button
                                onClick={() => handleDeleteCustomer(customer.id)}
                                disabled={deletingCustomer === customer.id}
                                className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700 disabled:opacity-50"
                              >
                                {deletingCustomer === customer.id ? 'Đang xóa...' : 'Xóa'}
                              </button>
                            </div>
                          </td>
                              </tr>
                            ))
                            ) : (
                              <tr>
                                <td colSpan={8} className="border p-4 text-center text-gray-500">
                                  {searchTerm ? 'Không tìm thấy khách hàng nào' : 'Chưa có khách hàng nào'}
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                      
                      {/* Pagination controls */}
                      {totalPages > 1 && (
                        <div className="mt-4 flex justify-center items-center gap-2">
                          <button
                            onClick={() => selectedTask && fetchCustomersPage(selectedTask.id, currentPage - 1)}
                            disabled={currentPage === 1 || loadingCustomers}
                            className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Trước
                          </button>
                          <span className="px-4 py-2 text-sm text-gray-700">
                            Trang {currentPage} / {totalPages}
                          </span>
                          <button
                            onClick={() => selectedTask && fetchCustomersPage(selectedTask.id, currentPage + 1)}
                            disabled={currentPage === totalPages || loadingCustomers}
                            className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Sau
                          </button>
                        </div>
                      )}
                  </>
                )
              })()}
            </div>
          </div>
        </div>
      )}

      {/* Modal sửa khách hàng */}
      {showEditCustomerModal && editingCustomer && selectedTask && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-2xl font-bold mb-4">Sửa thông tin khách hàng</h2>
            <form onSubmit={handleUpdateCustomer}>
              <div className="mb-4">
                <label className="block mb-2 font-semibold">STT *</label>
                <input
                  type="number"
                  value={editCustomerForm.stt}
                  onChange={(e) => setEditCustomerForm({ ...editCustomerForm, stt: parseInt(e.target.value) || 0 })}
                  className="w-full border rounded px-3 py-2"
                  required
                  min="0"
                />
              </div>
              <div className="mb-4">
                <label className="block mb-2 font-semibold">Account *</label>
                <input
                  type="text"
                  value={editCustomerForm.account}
                  onChange={(e) => setEditCustomerForm({ ...editCustomerForm, account: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block mb-2 font-semibold">Tên khách hàng *</label>
                <input
                  type="text"
                  value={editCustomerForm.customerName}
                  onChange={(e) => setEditCustomerForm({ ...editCustomerForm, customerName: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block mb-2 font-semibold">Địa chỉ</label>
                <input
                  type="text"
                  value={editCustomerForm.address}
                  onChange={(e) => setEditCustomerForm({ ...editCustomerForm, address: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                />
              </div>
              <div className="mb-4">
                <label className="block mb-2 font-semibold">Số điện thoại</label>
                <input
                  type="text"
                  value={editCustomerForm.phone}
                  onChange={(e) => setEditCustomerForm({ ...editCustomerForm, phone: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                />
              </div>
              <div className="mb-4">
                <label className="block mb-2 font-semibold">NV thực hiện</label>
                <select
                  value={editCustomerForm.assignedUsername}
                  onChange={(e) => setEditCustomerForm({ ...editCustomerForm, assignedUsername: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                >
                  <option value="">-- Chọn người thực hiện --</option>
                  {users
                    .filter(user => user.role !== 'admin') // Chỉ hiển thị user, không hiển thị admin
                    .map(user => (
                      <option key={user.id} value={user.username}>
                        {user.username} {user.fullName ? `(${user.fullName})` : ''}
                      </option>
                    ))}
                </select>
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={updatingCustomer}
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
                >
                  {updatingCustomer ? 'Đang cập nhật...' : 'Cập nhật'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowEditCustomerModal(false)
                    setEditingCustomer(null)
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

