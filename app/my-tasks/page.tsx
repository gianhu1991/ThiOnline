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
  const [viewMode, setViewMode] = useState<'all' | 'today'>('all')

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

  const fetchTaskCustomers = async (taskId: string, view: 'all' | 'today' = 'all') => {
    setLoadingTaskId(taskId)
    try {
      const res = await fetch(`/api/tasks/${taskId}/my-customers?view=${view}`, {
        credentials: 'include',
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || 'Lỗi khi tải danh sách khách hàng')
      }

      const data = await res.json()
      setCustomers(data.customers || [])
      setSelectedTask(data.task)
      setViewMode(view)
      setShowDetailModal(true)
    } catch (error: any) {
      alert(error.message || 'Lỗi khi tải danh sách khách hàng')
    } finally {
      setLoadingTaskId(null)
    }
  }

  const handleViewModeChange = async (newView: 'all' | 'today') => {
    if (!selectedTask) return
    await fetchTaskCustomers(selectedTask.id, newView)
  }

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

      // Cập nhật trạng thái trong danh sách
      setCustomers(customers.map(c => 
        c.id === customerId 
          ? { ...c, isCompleted: true, completedAt: new Date().toISOString() }
          : c
      ))

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
              onClick={() => fetchTaskCustomers(task.id)}
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">Chi tiết: {selectedTask.name}</h2>
              <button
                onClick={() => {
                  setShowDetailModal(false)
                  setSelectedTask(null)
                  setCustomers([])
                  setViewMode('all')
                }}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>

            {/* Tùy chọn xem */}
            <div className="mb-4 flex gap-4 items-center">
              <span className="font-semibold">Chế độ xem:</span>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="viewMode"
                  value="all"
                  checked={viewMode === 'all'}
                  onChange={() => handleViewModeChange('all')}
                  className="w-4 h-4"
                />
                <span>Xem toàn bộ</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="viewMode"
                  value="today"
                  checked={viewMode === 'today'}
                  onChange={() => handleViewModeChange('today')}
                  className="w-4 h-4"
                />
                <span>Xem theo ngày</span>
              </label>
            </div>

            <div className="mb-4 p-3 bg-blue-50 rounded">
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Tổng số: </span>
                  <span className="font-bold">{customers.length}</span>
                </div>
                <div>
                  <span className="text-gray-600">Đã hoàn thành: </span>
                  <span className="font-bold text-green-600">{customers.filter(c => c.isCompleted).length}</span>
                </div>
                <div>
                  <span className="text-gray-600">Chưa hoàn thành: </span>
                  <span className="font-bold text-orange-600">{customers.filter(c => !c.isCompleted).length}</span>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border p-2 text-left">STT</th>
                    <th className="border p-2 text-left">Account</th>
                    <th className="border p-2 text-left">Tên KH</th>
                    <th className="border p-2 text-left">Địa chỉ</th>
                    <th className="border p-2 text-left">Số điện thoại</th>
                    <th className="border p-2 text-left">Trạng thái</th>
                    <th className="border p-2 text-left">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {customers.map((customer) => (
                    <tr key={customer.id} className={customer.isCompleted ? 'bg-green-50' : ''}>
                      <td className="border p-2">{customer.stt}</td>
                      <td className="border p-2">{customer.account}</td>
                      <td className="border p-2 font-medium">{customer.customerName}</td>
                      <td className="border p-2">{customer.address || '-'}</td>
                      <td className="border p-2">{customer.phone || '-'}</td>
                      <td className="border p-2">
                        {customer.isCompleted ? (
                          <span className="text-green-600 font-semibold">Đã hoàn thành</span>
                        ) : (
                          <span className="text-orange-600 font-semibold">Chưa hoàn thành</span>
                        )}
                        {customer.completedAt && (
                          <div className="text-xs text-gray-500 mt-1">
                            {format(new Date(customer.completedAt), 'dd/MM/yyyy HH:mm', { locale: vi })}
                          </div>
                        )}
                      </td>
                      <td className="border p-2">
                        {!customer.isCompleted ? (
                          <button
                            onClick={() => handleComplete(customer.id)}
                            disabled={completing === customer.id || !selectedTask.isActive}
                            className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 disabled:opacity-50"
                          >
                            {completing === customer.id ? 'Đang xử lý...' : 'Thực hiện'}
                          </button>
                        ) : (
                          <span className="text-green-600 text-sm">✓ Hoàn thành</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {customers.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                Chưa có khách hàng nào được gán cho bạn.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

