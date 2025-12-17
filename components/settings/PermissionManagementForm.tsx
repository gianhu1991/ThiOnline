'use client'

import { useState, useEffect } from 'react'

interface Permission {
  id: string
  code: string
  name: string
  description: string | null
  category: string
}

interface GroupedPermissions {
  [category: string]: Permission[]
}

const ROLES = [
  { value: 'admin', label: 'Admin', description: 'Quản trị viên - Toàn quyền' },
  { value: 'leader', label: 'Leader', description: 'Lãnh đạo - Xem và xuất báo cáo' },
  { value: 'user', label: 'User', description: 'Người dùng - Sử dụng cơ bản' },
]

const CATEGORY_LABELS: Record<string, string> = {
  exams: 'Bài thi',
  tasks: 'Nhiệm vụ',
  questions: 'Câu hỏi',
  users: 'Người dùng',
  videos: 'Video',
  documents: 'Tài liệu',
  system: 'Hệ thống',
}

export default function PermissionManagementForm() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [selectedRole, setSelectedRole] = useState('leader')
  const [allPermissions, setAllPermissions] = useState<Permission[]>([])
  const [groupedPermissions, setGroupedPermissions] = useState<GroupedPermissions>({})
  const [rolePermissions, setRolePermissions] = useState<string[]>([])
  const [originalPermissions, setOriginalPermissions] = useState<string[]>([])

  useEffect(() => {
    fetchPermissions()
  }, [])

  useEffect(() => {
    if (selectedRole) {
      fetchRolePermissions(selectedRole)
    }
  }, [selectedRole])

  const fetchPermissions = async () => {
    try {
      const res = await fetch('/api/permissions', {
        credentials: 'include',
      })
      const data = await res.json()
      
      if (res.ok && data.success) {
        setAllPermissions(data.permissions || [])
        setGroupedPermissions(data.grouped || {})
      } else {
        setError(data.error || 'Lỗi khi tải danh sách quyền')
      }
    } catch (error) {
      console.error('Error fetching permissions:', error)
      setError('Lỗi khi tải danh sách quyền')
    }
  }

  const fetchRolePermissions = async (role: string) => {
    try {
      setLoading(true)
      const res = await fetch(`/api/permissions/roles/${role}`, {
        credentials: 'include',
      })
      const data = await res.json()
      
      if (res.ok && data.success) {
        setRolePermissions(data.permissions || [])
        setOriginalPermissions(data.permissions || [])
      } else {
        setError(data.error || 'Lỗi khi tải quyền của role')
      }
    } catch (error) {
      console.error('Error fetching role permissions:', error)
      setError('Lỗi khi tải quyền của role')
    } finally {
      setLoading(false)
    }
  }

  const handleTogglePermission = (code: string) => {
    if (rolePermissions.includes(code)) {
      setRolePermissions(rolePermissions.filter(p => p !== code))
    } else {
      setRolePermissions([...rolePermissions, code])
    }
    setError('')
    setSuccess('')
  }

  const handleSelectAll = (category: string) => {
    const categoryPerms = groupedPermissions[category] || []
    const categoryCodes = categoryPerms.map(p => p.code)
    
    // Nếu tất cả đã được chọn, bỏ chọn tất cả
    const allSelected = categoryCodes.every(code => rolePermissions.includes(code))
    
    if (allSelected) {
      setRolePermissions(rolePermissions.filter(p => !categoryCodes.includes(p)))
    } else {
      // Thêm tất cả chưa được chọn
      const newPerms = [...rolePermissions]
      categoryCodes.forEach(code => {
        if (!newPerms.includes(code)) {
          newPerms.push(code)
        }
      })
      setRolePermissions(newPerms)
    }
    setError('')
    setSuccess('')
  }

  const handleSave = async () => {
    try {
      setLoading(true)
      setError('')
      setSuccess('')

      const res = await fetch(`/api/permissions/roles/${selectedRole}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ permissionCodes: rolePermissions })
      })

      const data = await res.json()

      if (res.ok && data.success) {
        setSuccess('Cập nhật quyền thành công!')
        setOriginalPermissions(rolePermissions)
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

  const handleReset = () => {
    setRolePermissions([...originalPermissions])
    setError('')
    setSuccess('')
  }

  const hasChanges = JSON.stringify(rolePermissions.sort()) !== JSON.stringify(originalPermissions.sort())

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h2 className="text-2xl font-bold mb-6">Quản lý phân quyền</h2>

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

      {/* Chọn role */}
      <div className="mb-6">
        <label className="block text-sm font-semibold text-gray-700 mb-3">Chọn vai trò</label>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {ROLES.map(role => (
            <button
              key={role.value}
              onClick={() => setSelectedRole(role.value)}
              className={`p-4 rounded-lg border-2 text-left transition-all ${
                selectedRole === role.value
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              <div className="font-semibold text-gray-900">{role.label}</div>
              <div className="text-xs text-gray-500 mt-1">{role.description}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Danh sách quyền */}
      {loading && !allPermissions.length ? (
        <div className="text-center py-8 text-gray-500">Đang tải...</div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedPermissions).map(([category, perms]) => {
            const allSelected = perms.every(p => rolePermissions.includes(p.code))
            const someSelected = perms.some(p => rolePermissions.includes(p.code))

            return (
              <div key={category} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-semibold text-gray-900">
                    {CATEGORY_LABELS[category] || category}
                  </h3>
                  <button
                    onClick={() => handleSelectAll(category)}
                    className={`text-sm px-3 py-1 rounded ${
                      allSelected
                        ? 'bg-blue-600 text-white'
                        : someSelected
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {allSelected ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
                  </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {perms.map(perm => (
                    <label
                      key={perm.code}
                      className="flex items-start gap-3 p-3 rounded hover:bg-gray-50 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={rolePermissions.includes(perm.code)}
                        onChange={() => handleTogglePermission(perm.code)}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <div className="font-medium text-sm text-gray-900">{perm.name}</div>
                        {perm.description && (
                          <div className="text-xs text-gray-500 mt-0.5">{perm.description}</div>
                        )}
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Actions */}
      {hasChanges && (
        <div className="mt-6 flex gap-3 justify-end border-t pt-4">
          <button
            onClick={handleReset}
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

      {!hasChanges && originalPermissions.length > 0 && (
        <div className="mt-6 text-center text-sm text-gray-500">
          Đã chọn {rolePermissions.length} quyền cho role {selectedRole}
        </div>
      )}
    </div>
  )
}

