'use client'

import { useState, useEffect } from 'react'

interface User {
  id: string
  username: string
  fullName: string | null
  email: string | null
  role: string
  createdAt: string
}

export default function UserManagementForm() {
  const [users, setUsers] = useState<User[]>([])
  const [userLoading, setUserLoading] = useState(false)
  const [userError, setUserError] = useState('')
  const [userSuccess, setUserSuccess] = useState('')
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [editFormData, setEditFormData] = useState({
    username: '',
    fullName: '',
    email: '',
    password: '',
    role: 'user',
  })
  const [showEditPassword, setShowEditPassword] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [isSuperAdmin, setIsSuperAdmin] = useState(false)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [createFormData, setCreateFormData] = useState({
    username: '',
    fullName: '',
    email: '',
    password: '',
    role: 'user',
  })

  useEffect(() => {
    fetchUsers()
    fetchCurrentUser()
  }, [])

  const fetchCurrentUser = async () => {
    try {
      const res = await fetch('/api/auth/me', {
        credentials: 'include',
      })
      if (res.ok) {
        const data = await res.json()
        setCurrentUserId(data.user?.id || null)
        
        // Kiểm tra xem có phải super admin không
        if (data.user?.id) {
          const superAdminRes = await fetch('/api/users/check-super-admin', {
            credentials: 'include',
          })
          if (superAdminRes.ok) {
            const superAdminData = await superAdminRes.json()
            setIsSuperAdmin(superAdminData.isSuperAdmin || false)
          }
        }
      }
    } catch (error) {
      console.error('Error fetching current user:', error)
    }
  }

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/users', {
        credentials: 'include',
      })
      const data = await res.json()
      if (res.ok && data.success) {
        setUsers(Array.isArray(data.users) ? data.users : [])
      }
    } catch (error) {
      console.error('Error fetching users:', error)
      setUsers([])
    }
  }

  const handleDeleteUser = async (id: string, username: string) => {
    if (!confirm(`Bạn có chắc muốn xóa user "${username}"?`)) return

    try {
      const res = await fetch(`/api/users/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      })

      const data = await res.json()

      if (res.ok && data.success) {
        setUserSuccess('Xóa user thành công!')
        fetchUsers()
      } else {
        setUserError(data.error || 'Xóa user thất bại')
      }
    } catch (error) {
      setUserError('Lỗi khi xóa user')
    }
  }

  const handleEditUser = async (user: User) => {
    // Clear errors trước
    setUserError('')
    setUserSuccess('')
    
    // Kiểm tra lại super admin status
    if (currentUserId) {
      try {
        const superAdminRes = await fetch('/api/users/check-super-admin', {
          credentials: 'include',
        })
        if (superAdminRes.ok) {
          const superAdminData = await superAdminRes.json()
          setIsSuperAdmin(superAdminData.isSuperAdmin || false)
        }
      } catch (error) {
        console.error('Error checking super admin:', error)
      }
    }
    
    setEditingUser(user)
    setEditFormData({
      username: user.username,
      fullName: user.fullName || '',
      email: user.email || '',
      password: '',
      role: user.role,
    })
  }

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingUser) return

    setUserError('')
    setUserSuccess('')

    if (editFormData.password && editFormData.password.length < 6) {
      setUserError('Mật khẩu phải có ít nhất 6 ký tự')
      return
    }

    setUserLoading(true)
    try {
      const updateData: any = {
        username: editFormData.username,
        fullName: editFormData.fullName || null,
        email: editFormData.email || null,
        role: editFormData.role,
      }
      if (editFormData.password) {
        updateData.password = editFormData.password
      }

      const res = await fetch(`/api/users/${editingUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(updateData),
      })

      const data = await res.json()

      if (res.ok && data.success) {
        setUserSuccess('Cập nhật user thành công!')
        setEditingUser(null)
        setEditFormData({
          username: '',
          fullName: '',
          email: '',
          password: '',
          role: 'user',
        })
        fetchUsers()
      } else {
        setUserError(data.error || 'Cập nhật user thất bại')
      }
    } catch (error) {
      setUserError('Lỗi khi cập nhật user')
    } finally {
      setUserLoading(false)
    }
  }

  return (
    <div className="card">
      <h2 className="text-2xl font-bold mb-6">Quản lý người dùng</h2>

      {userError && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-4">
          {userError}
        </div>
      )}

      {userSuccess && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm mb-4">
          {userSuccess}
        </div>
      )}

      {/* Form sửa user */}
      {editingUser && (
        <form onSubmit={handleUpdateUser} className="bg-gray-50 p-4 rounded-lg mb-6 space-y-4">
          <h3 className="font-semibold text-gray-700 mb-3">Sửa thông tin user: {editingUser.username}</h3>
          
          <div>
            <label className="block mb-2 font-semibold text-gray-700 text-sm">Tên đăng nhập</label>
            <input
              type="text"
              value={editFormData.username}
              onChange={(e) => setEditFormData({ ...editFormData, username: e.target.value })}
              className="input-field"
              required
              disabled={userLoading}
            />
          </div>

          <div>
            <label className="block mb-2 font-semibold text-gray-700 text-sm">Họ và tên</label>
            <input
              type="text"
              value={editFormData.fullName}
              onChange={(e) => setEditFormData({ ...editFormData, fullName: e.target.value })}
              className="input-field"
              disabled={userLoading}
            />
          </div>

          <div>
            <label className="block mb-2 font-semibold text-gray-700 text-sm">Email</label>
            <input
              type="email"
              value={editFormData.email}
              onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
              className="input-field"
              disabled={userLoading}
            />
          </div>

          <div>
            <label className="block mb-2 font-semibold text-gray-700 text-sm">Mật khẩu mới (để trống nếu không đổi)</label>
            <div className="relative">
              <input
                type={showEditPassword ? 'text' : 'password'}
                value={editFormData.password}
                onChange={(e) => setEditFormData({ ...editFormData, password: e.target.value })}
                className="input-field pr-10"
                placeholder="Nhập mật khẩu mới (tối thiểu 6 ký tự)"
                disabled={userLoading}
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowEditPassword(!showEditPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                tabIndex={-1}
              >
                {showEditPassword ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <div>
            <label className="block mb-2 font-semibold text-gray-700 text-sm">Vai trò</label>
            <select
              value={editFormData.role}
              onChange={(e) => {
                setEditFormData({ ...editFormData, role: e.target.value })
                setUserError('') // Clear error when changing role
              }}
              className="input-field"
              disabled={userLoading || (!isSuperAdmin && editingUser && editingUser.id === currentUserId)}
            >
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
            {!isSuperAdmin && editingUser && editingUser.id === currentUserId && (
              <p className="text-xs text-gray-500 mt-1">Bạn không thể tự hạ cấp mình</p>
            )}
            {isSuperAdmin && (
              <p className="text-xs text-blue-600 mt-1">Super Admin: Bạn có thể thay đổi role của tất cả người dùng</p>
            )}
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={userLoading}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {userLoading ? 'Đang cập nhật...' : 'Cập nhật'}
            </button>
            <button
              type="button"
              onClick={() => {
                setEditingUser(null)
                setEditFormData({
                  username: '',
                  fullName: '',
                  email: '',
                  password: '',
                  role: 'user',
                })
                setUserError('')
                setUserSuccess('')
              }}
              className="bg-gray-300 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-400"
              disabled={userLoading}
            >
              Hủy
            </button>
          </div>
        </form>
      )}

      {/* Form tạo user mới - chỉ hiển thị cho Super Admin */}
      {isSuperAdmin && (
        <div className="mb-6">
          {!showCreateForm ? (
            <button
              onClick={() => setShowCreateForm(true)}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 mb-4"
            >
              + Tạo user mới
            </button>
          ) : (
            <form
              onSubmit={async (e) => {
                e.preventDefault()
                setUserError('')
                setUserSuccess('')

                if (createFormData.password.length < 6) {
                  setUserError('Mật khẩu phải có ít nhất 6 ký tự')
                  return
                }

                setUserLoading(true)
                try {
                  const res = await fetch('/api/users', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify(createFormData),
                  })

                  const data = await res.json()

                  if (res.ok && data.success) {
                    setUserSuccess('Tạo user thành công!')
                    setCreateFormData({
                      username: '',
                      fullName: '',
                      email: '',
                      password: '',
                      role: 'user',
                    })
                    setShowCreateForm(false)
                    fetchUsers()
                  } else {
                    setUserError(data.error || 'Tạo user thất bại')
                  }
                } catch (error) {
                  setUserError('Lỗi khi tạo user')
                } finally {
                  setUserLoading(false)
                }
              }}
              className="bg-green-50 p-4 rounded-lg mb-4 space-y-4 border border-green-200"
            >
              <h3 className="font-semibold text-gray-700 mb-3">Tạo user mới</h3>
              
              <div>
                <label className="block mb-2 font-semibold text-gray-700 text-sm">Tên đăng nhập *</label>
                <input
                  type="text"
                  value={createFormData.username}
                  onChange={(e) => setCreateFormData({ ...createFormData, username: e.target.value })}
                  className="input-field"
                  required
                  disabled={userLoading}
                />
              </div>

              <div>
                <label className="block mb-2 font-semibold text-gray-700 text-sm">Họ và tên</label>
                <input
                  type="text"
                  value={createFormData.fullName}
                  onChange={(e) => setCreateFormData({ ...createFormData, fullName: e.target.value })}
                  className="input-field"
                  disabled={userLoading}
                />
              </div>

              <div>
                <label className="block mb-2 font-semibold text-gray-700 text-sm">Email</label>
                <input
                  type="email"
                  value={createFormData.email}
                  onChange={(e) => setCreateFormData({ ...createFormData, email: e.target.value })}
                  className="input-field"
                  disabled={userLoading}
                />
              </div>

              <div>
                <label className="block mb-2 font-semibold text-gray-700 text-sm">Mật khẩu *</label>
                <input
                  type="password"
                  value={createFormData.password}
                  onChange={(e) => setCreateFormData({ ...createFormData, password: e.target.value })}
                  className="input-field"
                  required
                  disabled={userLoading}
                  minLength={6}
                  placeholder="Tối thiểu 6 ký tự"
                />
              </div>

              <div>
                <label className="block mb-2 font-semibold text-gray-700 text-sm">Vai trò *</label>
                <select
                  value={createFormData.role}
                  onChange={(e) => setCreateFormData({ ...createFormData, role: e.target.value })}
                  className="input-field"
                  disabled={userLoading}
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
                <p className="text-xs text-blue-600 mt-1">Super Admin: Bạn có thể tạo user hoặc admin mới</p>
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={userLoading}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  {userLoading ? 'Đang tạo...' : 'Tạo user'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateForm(false)
                    setCreateFormData({
                      username: '',
                      fullName: '',
                      email: '',
                      password: '',
                      role: 'user',
                    })
                    setUserError('')
                    setUserSuccess('')
                  }}
                  className="bg-gray-300 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-400"
                  disabled={userLoading}
                >
                  Hủy
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      <div>
        <h3 className="font-semibold text-gray-700 mb-3">Danh sách người dùng ({users.length})</h3>
        {users.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>Chưa có người dùng nào</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {users.map((user) => (
              <div
                key={user.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900">{user.username}</span>
                    <span className={`text-xs px-2 py-1 rounded ${
                      user.role === 'admin' ? 'bg-blue-100 text-blue-800' : 'bg-gray-200 text-gray-700'
                    }`}>
                      {user.role === 'admin' ? 'Admin' : 'User'}
                    </span>
                  </div>
                  {user.fullName && (
                    <p className="text-sm text-gray-600 mt-1">{user.fullName}</p>
                  )}
                  {user.email && (
                    <p className="text-xs text-gray-500 mt-1">{user.email}</p>
                  )}
                  <p className="text-xs text-gray-400 mt-1">
                    Đăng ký: {new Date(user.createdAt).toLocaleDateString('vi-VN')}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEditUser(user)}
                    className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 p-2 rounded-lg transition-colors"
                    title="Sửa user"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleDeleteUser(user.id, user.username)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 p-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title={user.role === 'admin' && !isSuperAdmin ? 'Không thể xóa admin khác' : 'Xóa user'}
                    disabled={user.role === 'admin' && !isSuperAdmin}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

