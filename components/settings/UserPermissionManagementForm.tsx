'use client'

import { useState, useEffect } from 'react'

interface Permission {
  code: string
  name: string
  category: string
}

interface User {
  id: string
  username: string
  fullName: string | null
  role: string
}

interface UserPermission {
  code: string
  name: string
  category: string
  type: 'grant' | 'deny'
  reason: string | null
  grantedBy: string | null
  createdAt: string
}

const CATEGORY_LABELS: Record<string, string> = {
  exams: 'Bài thi',
  tasks: 'Nhiệm vụ',
  questions: 'Câu hỏi',
  users: 'Người dùng',
  videos: 'Video',
  documents: 'Tài liệu',
  system: 'Hệ thống',
}

export default function UserPermissionManagementForm() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  
  // Users list
  const [users, setUsers] = useState<User[]>([])
  const [selectedUserId, setSelectedUserId] = useState<string>('')
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  
  // Permissions
  const [allPermissions, setAllPermissions] = useState<Permission[]>([])
  const [rolePermissions, setRolePermissions] = useState<string[]>([])
  const [userPermissions, setUserPermissions] = useState<UserPermission[]>([])
  
  // Form state
  const [grants, setGrants] = useState<string[]>([])
  const [denies, setDenies] = useState<string[]>([])
  const [reason, setReason] = useState('')

  useEffect(() => {
    fetchUsers()
    fetchAllPermissions()
  }, [])

  useEffect(() => {
    if (selectedUserId) {
      fetchUserPermissions(selectedUserId)
    }
  }, [selectedUserId])

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/users', { credentials: 'include' })
      const data = await res.json()
      if (res.ok && data.success) {
        setUsers(data.users || [])
      }
    } catch (error) {
      console.error('Error fetching users:', error)
    }
  }

  const fetchAllPermissions = async () => {
    try {
      const res = await fetch('/api/permissions', { credentials: 'include' })
      const data = await res.json()
      if (res.ok && data.success) {
        setAllPermissions(data.permissions || [])
      }
    } catch (error) {
      console.error('Error fetching permissions:', error)
    }
  }

  const fetchUserPermissions = async (userId: string) => {
    try {
      setLoading(true)
      setError('')
      
      const res = await fetch(`/api/permissions/users/${userId}`, { 
        credentials: 'include' 
      })
      const data = await res.json()
      
      if (res.ok && data.success) {
        setSelectedUser(data.user)
        setRolePermissions(data.rolePermissions || [])
        setUserPermissions(data.userPermissions || [])
        
        // Set grants và denies từ user permissions hiện tại
        const currentGrants = data.userPermissions
          .filter((up: UserPermission) => up.type === 'grant')
          .map((up: UserPermission) => up.code)
        const currentDenies = data.userPermissions
          .filter((up: UserPermission) => up.type === 'deny')
          .map((up: UserPermission) => up.code)
        
        setGrants(currentGrants)
        setDenies(currentDenies)
      } else {
        setError(data.error || 'Lỗi khi tải quyền của user')
      }
    } catch (error) {
      console.error('Error fetching user permissions:', error)
      setError('Lỗi khi tải quyền của user')
    } finally {
      setLoading(false)
    }
  }

  const handleToggleGrant = (code: string) => {
    // Nếu đang trong denies, bỏ ra khỏi denies
    if (denies.includes(code)) {
      setDenies(denies.filter(c => c !== code))
    }
    
    // Toggle grant
    if (grants.includes(code)) {
      setGrants(grants.filter(c => c !== code))
    } else {
      setGrants([...grants, code])
    }
    
    setError('')
    setSuccess('')
  }

  const handleToggleDeny = (code: string) => {
    // Nếu đang trong grants, bỏ ra khỏi grants
    if (grants.includes(code)) {
      setGrants(grants.filter(c => c !== code))
    }
    
    // Toggle deny
    if (denies.includes(code)) {
      setDenies(denies.filter(c => c !== code))
    } else {
      setDenies([...denies, code])
    }
    
    setError('')
    setSuccess('')
  }

  const handleSave = async () => {
    if (!selectedUserId) return
    
    try {
      setLoading(true)
      setError('')
      setSuccess('')

      const res = await fetch(`/api/permissions/users/${selectedUserId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ grants, denies, reason })
      })

      const data = await res.json()

      if (res.ok && data.success) {
        setSuccess('Cập nhật quyền thành công!')
        setReason('')
        // Reload user permissions
        fetchUserPermissions(selectedUserId)
      } else {
        setError(data.error || 'Lỗi khi cập nhật quyền')
      }
    } catch (error) {
      console.error('Error saving permissions:', error)
      setError('Lỗi khi cập nhật quyền')
    } finally {
      setLoading(false)
    }
  }

  const handleReset = async () => {
    if (!selectedUserId) return
    
    if (!confirm('Reset tất cả quyền đặc biệt về quyền role mặc định?')) return
    
    try {
      setLoading(true)
      setError('')
      
      const res = await fetch(`/api/permissions/users/${selectedUserId}`, {
        method: 'DELETE',
        credentials: 'include',
      })

      const data = await res.json()

      if (res.ok && data.success) {
        setSuccess('Đã reset về quyền role mặc định!')
        fetchUserPermissions(selectedUserId)
      } else {
        setError(data.error || 'Lỗi khi reset quyền')
      }
    } catch (error) {
      console.error('Error resetting permissions:', error)
      setError('Lỗi khi reset quyền')
    } finally {
      setLoading(false)
    }
  }

  const getPermissionStatus = (code: string): 'role' | 'grant' | 'deny' | 'none' => {
    if (denies.includes(code)) return 'deny'
    if (grants.includes(code)) return 'grant'
    if (rolePermissions.includes(code)) return 'role'
    return 'none'
  }

  const groupedPerms = allPermissions.reduce((acc, perm) => {
    if (!acc[perm.category]) {
      acc[perm.category] = []
    }
    acc[perm.category].push(perm)
    return acc
  }, {} as Record<string, Permission[]>)

  const hasChanges = userPermissions.length > 0 || grants.length > 0 || denies.length > 0

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h2 className="text-2xl font-bold mb-2">Phân quyền theo người dùng</h2>
      <p className="text-sm text-gray-600 mb-6">
        Cấp quyền đặc biệt (grant) hoặc gỡ bỏ quyền (deny) cho từng user cụ thể
      </p>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded mb-4">
          {success}
        </div>
      )}

      {/* Chọn user */}
      <div className="mb-6">
        <label className="block text-sm font-semibold text-gray-700 mb-3">Chọn người dùng</label>
        <select
          value={selectedUserId}
          onChange={(e) => setSelectedUserId(e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">-- Chọn user --</option>
          {users.map(user => (
            <option key={user.id} value={user.id}>
              {user.fullName || user.username} (@{user.username}) - Role: {user.role}
            </option>
          ))}
        </select>
      </div>

      {selectedUser && (
        <>
          {/* Thông tin user */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-semibold text-gray-900">
                  {selectedUser.fullName || selectedUser.username}
                </h3>
                <p className="text-sm text-gray-600">@{selectedUser.username}</p>
                <p className="text-sm mt-2">
                  <span className="font-medium">Role:</span> 
                  <span className="ml-2 px-2 py-1 bg-blue-600 text-white text-xs rounded">
                    {selectedUser.role}
                  </span>
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  Có {rolePermissions.length} quyền từ role
                </p>
              </div>
              {hasChanges && (
                <button
                  onClick={handleReset}
                  disabled={loading}
                  className="text-sm text-red-600 hover:text-red-700 disabled:opacity-50"
                >
                  Reset về role
                </button>
              )}
            </div>
          </div>

          {/* Lý do */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Lý do cấp/gỡ quyền (optional)
            </label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Ví dụ: Đặc cách cho dự án X, Admin tập sự..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Legend */}
          <div className="flex gap-4 mb-6 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-100 border-2 border-green-500 rounded"></div>
              <span>Quyền từ role</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-yellow-100 border-2 border-yellow-500 rounded"></div>
              <span>Cấp thêm (grant)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-100 border-2 border-red-500 rounded"></div>
              <span>Gỡ bỏ (deny)</span>
            </div>
          </div>

          {/* Danh sách quyền */}
          <div className="space-y-6">
            {Object.entries(groupedPerms).map(([category, perms]) => (
              <div key={category} className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-3">
                  {CATEGORY_LABELS[category] || category}
                </h3>
                
                <div className="space-y-2">
                  {perms.map(perm => {
                    const status = getPermissionStatus(perm.code)
                    
                    return (
                      <div
                        key={perm.code}
                        className={`p-3 rounded-lg border-2 ${
                          status === 'deny' ? 'bg-red-50 border-red-500' :
                          status === 'grant' ? 'bg-yellow-50 border-yellow-500' :
                          status === 'role' ? 'bg-green-50 border-green-500' :
                          'bg-gray-50 border-gray-200'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="font-medium text-sm text-gray-900">
                              {perm.name}
                            </div>
                            <div className="text-xs text-gray-500 mt-0.5">
                              {perm.code}
                            </div>
                          </div>
                          
                          <div className="flex gap-2">
                            {status !== 'grant' && (
                              <button
                                onClick={() => handleToggleGrant(perm.code)}
                                className={`px-3 py-1 text-xs rounded ${
                                  status === 'none' || status === 'role'
                                    ? 'bg-yellow-500 text-white hover:bg-yellow-600'
                                    : 'bg-gray-300 text-gray-600'
                                }`}
                                title="Cấp thêm quyền này"
                              >
                                ➕ Grant
                              </button>
                            )}
                            
                            {status !== 'deny' && (
                              <button
                                onClick={() => handleToggleDeny(perm.code)}
                                className={`px-3 py-1 text-xs rounded ${
                                  status === 'role' || status === 'grant'
                                    ? 'bg-red-500 text-white hover:bg-red-600'
                                    : 'bg-gray-300 text-gray-600'
                                }`}
                                title="Gỡ bỏ quyền này"
                              >
                                ⛔ Deny
                              </button>
                            )}
                            
                            {(status === 'grant' || status === 'deny') && (
                              <button
                                onClick={() => {
                                  if (status === 'grant') handleToggleGrant(perm.code)
                                  if (status === 'deny') handleToggleDeny(perm.code)
                                }}
                                className="px-3 py-1 text-xs rounded bg-gray-500 text-white hover:bg-gray-600"
                                title="Bỏ đặc biệt"
                              >
                                ↩️ Reset
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Save button */}
          {hasChanges && (
            <div className="mt-6 flex gap-3 justify-end border-t pt-4">
              <button
                onClick={() => {
                  setGrants([])
                  setDenies([])
                  setReason('')
                  fetchUserPermissions(selectedUserId)
                }}
                disabled={loading}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
              >
                Hủy thay đổi
              </button>
              <button
                onClick={handleSave}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Đang lưu...' : 'Lưu thay đổi'}
              </button>
            </div>
          )}

          {/* Hiển thị permissions hiện tại */}
          {userPermissions.length > 0 && (
            <div className="mt-6 bg-gray-50 rounded-lg p-4">
              <h4 className="font-semibold text-sm text-gray-900 mb-3">
                Quyền đặc biệt hiện tại:
              </h4>
              <div className="space-y-2">
                {userPermissions.map((up, idx) => (
                  <div key={idx} className="text-sm">
                    <span className={`font-medium ${
                      up.type === 'grant' ? 'text-yellow-700' : 'text-red-700'
                    }`}>
                      {up.type === 'grant' ? '➕' : '⛔'} {up.name}
                    </span>
                    {up.reason && (
                      <span className="text-gray-600 ml-2">- {up.reason}</span>
                    )}
                    {up.grantedBy && (
                      <span className="text-gray-500 text-xs ml-2">
                        (bởi {up.grantedBy})
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {!selectedUserId && (
        <div className="text-center py-12 text-gray-500">
          Chọn user để quản lý quyền đặc biệt
        </div>
      )}
    </div>
  )
}

