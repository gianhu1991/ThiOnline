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
  createdAt: string
  completedCount: number
  totalCount: number
  pendingCount: number
  assignedAt: string
}

interface Customer {
  id: string
  stt: number
  account: string
  customerName: string
  address: string | null
  phone: string | null
  isCompleted: boolean
  completedAt: string | null
  completedBy: string | null
}


export default function MyTasksPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // State cho modal chi tiết khách hàng
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loadingTaskId, setLoadingTaskId] = useState<string | null>(null)
  const [completing, setCompleting] = useState<string | null>(null)
  
  // State cho search và pagination
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(50)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCustomers, setTotalCustomers] = useState(0)
  const [completedCount, setCompletedCount] = useState(0)
  const [loadingCustomers, setLoadingCustomers] = useState(false)

  useEffect(() => {
    fetchMyTasks()
  }, [])

  const fetchMyTasks = async () => {
    try {
      setError(null)
      const res = await fetch('/api/tasks/my-tasks', {
        credentials: 'include',
      })
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: 'Lỗi không xác định' }))
        throw new Error(errorData.error || `Lỗi ${res.status}`)
      }
      
      const data = await res.json()
      setTasks(data.tasks || [])
    } catch (error: any) {
      console.error('Error fetching my tasks:', error)
      setError(error.message || 'Lỗi khi tải danh sách nhiệm vụ')
    } finally {
      setLoading(false)
    }
  }

  const fetchTaskCustomers = async (taskId: string, page: number = 1, search: string = '', limit: number = 50) => {
    setLoadingCustomers(true)
    try {
      const searchParam = search.trim() ? `&search=${encodeURIComponent(search.trim())}` : ''
      const res = await fetch(`/api/tasks/${taskId}/my-customers?page=${page}&limit=${limit}${searchParam}`, {
        credentials: 'include',
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || 'Lỗi khi tải danh sách khách hàng')
      }

      const data = await res.json()
      setCustomers(data.customers || [])
      setSelectedTask(data.task)
      setCurrentPage(data.pagination?.page || 1)
      setTotalPages(data.pagination?.totalPages || 1)
      setTotalCustomers(data.stats?.total || 0)
      setCompletedCount(data.stats?.completed || 0)
      
      if (!showDetailModal) {
        setShowDetailModal(true)
      }
    } catch (error: any) {
      alert(error.message || 'Lỗi khi tải danh sách khách hàng')
    } finally {
      setLoadingCustomers(false)
      setLoadingTaskId(null)
    }
  }

  // Debounce search
  useEffect(() => {
    if (!selectedTask || !showDetailModal) return

    const timeoutId = setTimeout(() => {
      setCurrentPage(1) // Reset to page 1 on new search
      fetchTaskCustomers(selectedTask.id, 1, searchTerm, pageSize)
    }, 500) // Debounce 500ms

    return () => clearTimeout(timeoutId)
  }, [searchTerm, selectedTask?.id, showDetailModal, pageSize])

  const handleComplete = async (customerId: string) => {
    if (!selectedTask) return

    if (!confirm('Bạn có chắc chắn đã thực hiện nhiệm vụ này không?')) {
      return
    }

    setCompleting(customerId)
    try {
      const res = await fetch(`/api/tasks/${selectedTask.id}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ customerId })
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || 'Lỗi khi đánh dấu hoàn thành')
      }

      // Reload danh sách để cập nhật (KH đã hoàn thành sẽ không hiển thị nữa)
      if (selectedTask) {
        await fetchTaskCustomers(selectedTask.id, currentPage, searchTerm, pageSize)
      }

      // Cập nhật thống kê
      fetchMyTasks()
    } catch (error: any) {
      alert(error.message || 'Lỗi khi đánh dấu hoàn thành')
    } finally {
      setCompleting(null)
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
      <h1 className="text-3xl font-bold mb-6">Nhiệm vụ của tôi</h1>

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
                  <span>
                    Được gán: {format(new Date(task.assignedAt), 'dd/MM/yyyy HH:mm', { locale: vi })}
                  </span>
                  {task.startDate && task.endDate && (
                    <span>
                      Thời gian: {format(new Date(task.startDate), 'dd/MM/yyyy', { locale: vi })} - {format(new Date(task.endDate), 'dd/MM/yyyy', { locale: vi })}
                    </span>
                  )}
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

            <button
              onClick={() => {
                setSearchTerm('')
                setCurrentPage(1)
                setPageSize(50)
                fetchTaskCustomers(task.id, 1, '', 50)
              }}
              disabled={loadingTaskId === task.id || !task.isActive}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loadingTaskId === task.id ? 'Đang tải...' : 'Xem chi tiết'}
            </button>
          </div>
        ))}

        {tasks.length === 0 && !loading && (
          <div className="text-center py-12 text-gray-500">
            Bạn chưa có nhiệm vụ nào được gán.
          </div>
        )}
      </div>

      {/* Modal chi tiết khách hàng */}
      {showDetailModal && selectedTask && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-white rounded-lg p-4 sm:p-6 max-w-[95vw] sm:max-w-[98vw] w-full max-h-[95vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl sm:text-2xl font-bold">Chi tiết: {selectedTask.name}</h2>
              <button
                onClick={() => {
                  setShowDetailModal(false)
                  setSelectedTask(null)
                  setCustomers([])
                  setSearchTerm('')
                  setCurrentPage(1)
                }}
                className="text-gray-500 hover:text-gray-700 text-2xl sm:text-3xl"
              >
                ×
              </button>
            </div>

            {/* Thông tin xem */}
            <div className="mb-4">
              <div className="text-xs sm:text-sm text-gray-600 mb-2">
                Đang xem: Khách hàng phân giao theo ngày
              </div>
              
              {/* Search box */}
              <div className="mb-3 sm:mb-4">
                <input
                  type="text"
                  placeholder="Tìm kiếm theo tên, account, số điện thoại, địa chỉ..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full border rounded px-2 sm:px-3 py-1.5 sm:py-2 text-sm"
                />
              </div>

              {/* Thống kê */}
              <div className="p-2 sm:p-3 bg-blue-50 rounded mb-3 sm:mb-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 text-xs sm:text-sm">
                  <div>
                    <span className="text-gray-600">Tổng số: </span>
                    <span className="font-bold">{totalCustomers}</span>
                    {searchTerm && <span className="text-xs text-gray-500"> (kết quả tìm kiếm)</span>}
                  </div>
                  <div>
                    <span className="text-gray-600">Đã hoàn thành: </span>
                    <span className="font-bold text-green-600">{completedCount}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Chưa hoàn thành: </span>
                    <span className="font-bold text-orange-600">{totalCustomers}</span>
                  </div>
                </div>
              </div>

              {/* Tùy chọn số lượng mỗi trang */}
              <div className="mb-3 sm:mb-4 flex flex-wrap items-center gap-2 text-xs sm:text-sm">
                <label className="text-gray-600">Hiển thị:</label>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(parseInt(e.target.value))
                    setCurrentPage(1)
                  }}
                  className="border rounded px-2 py-1 text-sm"
                >
                  <option value="25">25</option>
                  <option value="50">50</option>
                  <option value="100">100</option>
                  <option value="200">200</option>
                </select>
                <span className="text-gray-600">mỗi trang</span>
              </div>
            </div>

            <div className="overflow-x-auto" style={{ maxHeight: 'calc(95vh - 300px)', overflowY: 'auto' }}>
              <table className="w-full border-collapse text-sm min-w-full">
                <thead className="sticky top-0 bg-gray-100 z-10">
                  <tr>
                    <th className="border p-1.5 sm:p-2 text-left text-xs font-semibold bg-gray-100 whitespace-nowrap">STT</th>
                    <th className="border p-1.5 sm:p-2 text-left text-xs font-semibold bg-gray-100 whitespace-nowrap">Account</th>
                    <th className="border p-1.5 sm:p-2 text-left text-xs font-semibold bg-gray-100 whitespace-nowrap">Tên KH</th>
                    <th className="border p-1.5 sm:p-2 text-left text-xs font-semibold bg-gray-100 hidden sm:table-cell">Địa chỉ</th>
                    <th className="border p-1.5 sm:p-2 text-left text-xs font-semibold bg-gray-100 whitespace-nowrap">Số điện thoại</th>
                    <th className="border p-1.5 sm:p-2 text-left text-xs font-semibold bg-gray-100 whitespace-nowrap">Trạng thái</th>
                    <th className="border p-1.5 sm:p-2 text-left text-xs font-semibold bg-gray-100 whitespace-nowrap">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {loadingCustomers ? (
                    <tr>
                      <td colSpan={7} className="border p-4 text-center text-gray-500 text-sm">
                        Đang tải...
                      </td>
                    </tr>
                  ) : customers.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="border p-4 text-center text-gray-500 text-sm">
                        {searchTerm ? 'Không tìm thấy khách hàng nào' : 'Chưa có khách hàng nào được gán cho bạn.'}
                      </td>
                    </tr>
                  ) : (
                    customers.map((customer) => (
                      <tr key={customer.id} className="hover:bg-gray-50">
                        <td className="border p-1.5 sm:p-2 text-xs sm:text-sm">{customer.stt}</td>
                        <td className="border p-1.5 sm:p-2 text-xs sm:text-sm break-all">{customer.account}</td>
                        <td className="border p-1.5 sm:p-2 text-xs sm:text-sm font-medium">{customer.customerName}</td>
                        <td className="border p-1.5 sm:p-2 text-xs sm:text-sm hidden sm:table-cell">{customer.address || '-'}</td>
                        <td className="border p-1.5 sm:p-2 text-xs sm:text-sm whitespace-nowrap">{customer.phone || '-'}</td>
                        <td className="border p-1.5 sm:p-2 text-xs sm:text-sm">
                          <span className="text-orange-600 font-semibold text-xs">Chưa hoàn thành</span>
                        </td>
                        <td className="border p-1.5 sm:p-2 text-xs sm:text-sm">
                          <button
                            onClick={() => handleComplete(customer.id)}
                            disabled={completing === customer.id || !selectedTask?.isActive}
                            className="bg-green-600 text-white px-2 sm:px-3 py-1 rounded text-xs hover:bg-green-700 disabled:opacity-50 whitespace-nowrap"
                          >
                            {completing === customer.id ? 'Đang xử lý...' : 'Thực hiện'}
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-4 flex flex-wrap justify-center items-center gap-2">
                <button
                  onClick={() => selectedTask && fetchTaskCustomers(selectedTask.id, currentPage - 1, searchTerm, pageSize)}
                  disabled={currentPage === 1 || loadingCustomers}
                  className="px-3 sm:px-4 py-1.5 sm:py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed text-xs sm:text-sm"
                >
                  Trước
                </button>
                <span className="px-2 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm text-gray-700">
                  Trang {currentPage} / {totalPages}
                </span>
                <button
                  onClick={() => selectedTask && fetchTaskCustomers(selectedTask.id, currentPage + 1, searchTerm, pageSize)}
                  disabled={currentPage === totalPages || loadingCustomers}
                  className="px-3 sm:px-4 py-1.5 sm:py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed text-xs sm:text-sm"
                >
                  Sau
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

