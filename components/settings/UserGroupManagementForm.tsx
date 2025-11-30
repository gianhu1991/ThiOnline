'use client'

import { useState, useEffect } from 'react'

interface UserGroup {
  id: string
  name: string
  description: string | null
  createdAt: string
  _count: {
    members: number
    videoGroups: number
    documentGroups: number
  }
}

interface User {
  id: string
  username: string
  fullName: string | null
  email: string | null
}

interface Video {
  id: string
  title: string
}

interface Document {
  id: string
  title: string
}

export default function UserGroupManagementForm() {
  const [groups, setGroups] = useState<UserGroup[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [editingGroup, setEditingGroup] = useState<UserGroup | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  })
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [selectedGroup, setSelectedGroup] = useState<UserGroup | null>(null)
  const [groupDetail, setGroupDetail] = useState<any>(null)
  const [loadingDetail, setLoadingDetail] = useState(false)
  const [allUsers, setAllUsers] = useState<User[]>([])
  const [allVideos, setAllVideos] = useState<Video[]>([])
  const [allDocuments, setAllDocuments] = useState<Document[]>([])
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([])
  const [selectedVideoIds, setSelectedVideoIds] = useState<string[]>([])
  const [selectedDocumentIds, setSelectedDocumentIds] = useState<string[]>([])

  useEffect(() => {
    fetchGroups()
  }, [])

  useEffect(() => {
    if (selectedGroup) {
      fetchGroupDetail(selectedGroup.id)
      fetchAllUsers()
      fetchAllVideos()
      fetchAllDocuments()
    }
  }, [selectedGroup])

  const fetchGroups = async () => {
    try {
      const res = await fetch('/api/user-groups', {
        credentials: 'include',
      })
      const data = await res.json()
      if (res.ok && data.success) {
        setGroups(data.groups || [])
      }
    } catch (error) {
      console.error('Error fetching groups:', error)
      setGroups([])
    }
  }

  const fetchGroupDetail = async (groupId: string) => {
    setLoadingDetail(true)
    try {
      const res = await fetch(`/api/user-groups/${groupId}`, {
        credentials: 'include',
      })
      const data = await res.json()
      if (res.ok && data.success) {
        setGroupDetail(data.group)
        setSelectedUserIds(data.group.members.map((m: any) => m.user.id))
        setSelectedVideoIds(data.group.videoGroups.map((vg: any) => vg.video.id))
        setSelectedDocumentIds(data.group.documentGroups.map((dg: any) => dg.document.id))
      }
    } catch (error) {
      console.error('Error fetching group detail:', error)
    } finally {
      setLoadingDetail(false)
    }
  }

  const fetchAllUsers = async () => {
    try {
      const res = await fetch('/api/users', {
        credentials: 'include',
      })
      const data = await res.json()
      if (res.ok && data.success) {
        setAllUsers(data.users || [])
      }
    } catch (error) {
      console.error('Error fetching users:', error)
    }
  }

  const fetchAllVideos = async () => {
    try {
      const res = await fetch('/api/videos', {
        credentials: 'include',
      })
      const data = await res.json()
      if (Array.isArray(data)) {
        setAllVideos(data)
      }
    } catch (error) {
      console.error('Error fetching videos:', error)
    }
  }

  const fetchAllDocuments = async () => {
    try {
      const res = await fetch('/api/documents', {
        credentials: 'include',
      })
      const data = await res.json()
      if (Array.isArray(data)) {
        setAllDocuments(data)
      }
    } catch (error) {
      console.error('Error fetching documents:', error)
    }
  }

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!formData.name.trim()) {
      setError('Vui lòng nhập tên nhóm')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/user-groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(formData),
      })

      const data = await res.json()

      if (res.ok && data.success) {
        setSuccess('Tạo nhóm thành công!')
        setFormData({ name: '', description: '' })
        setShowCreateForm(false)
        fetchGroups()
      } else {
        setError(data.error || 'Tạo nhóm thất bại')
      }
    } catch (error) {
      setError('Lỗi khi tạo nhóm')
    } finally {
      setLoading(false)
    }
  }

  const handleEditGroup = (group: UserGroup) => {
    setEditingGroup(group)
    setFormData({
      name: group.name,
      description: group.description || '',
    })
    setError('')
    setSuccess('')
  }

  const handleUpdateGroup = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingGroup) return

    setError('')
    setSuccess('')

    if (!formData.name.trim()) {
      setError('Vui lòng nhập tên nhóm')
      return
    }

    setLoading(true)
    try {
      const res = await fetch(`/api/user-groups/${editingGroup.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(formData),
      })

      const data = await res.json()

      if (res.ok && data.success) {
        setSuccess('Cập nhật nhóm thành công!')
        setEditingGroup(null)
        setFormData({ name: '', description: '' })
        fetchGroups()
        if (selectedGroup?.id === editingGroup.id) {
          fetchGroupDetail(editingGroup.id)
        }
      } else {
        setError(data.error || 'Cập nhật nhóm thất bại')
      }
    } catch (error) {
      setError('Lỗi khi cập nhật nhóm')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteGroup = async (id: string, name: string) => {
    if (!confirm(`Bạn có chắc muốn xóa nhóm "${name}"?`)) return

    try {
      const res = await fetch(`/api/user-groups/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      })

      const data = await res.json()

      if (res.ok && data.success) {
        setSuccess('Xóa nhóm thành công!')
        fetchGroups()
        if (selectedGroup?.id === id) {
          setSelectedGroup(null)
          setGroupDetail(null)
        }
      } else {
        setError(data.error || 'Xóa nhóm thất bại')
      }
    } catch (error) {
      setError('Lỗi khi xóa nhóm')
    }
  }

  const handleSaveMembers = async () => {
    if (!selectedGroup) return

    setLoading(true)
    try {
      // Lấy danh sách user hiện tại trong nhóm
      const currentUserIds = groupDetail?.members.map((m: any) => m.user.id) || []
      
      // Tìm user cần thêm và cần xóa
      const toAdd = selectedUserIds.filter(id => !currentUserIds.includes(id))
      const toRemove = currentUserIds.filter((id: string) => !selectedUserIds.includes(id))

      // Thêm thành viên
      if (toAdd.length > 0) {
        await fetch(`/api/user-groups/${selectedGroup.id}/members`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ userIds: toAdd, action: 'add' }),
        })
      }

      // Xóa thành viên
      if (toRemove.length > 0) {
        await fetch(`/api/user-groups/${selectedGroup.id}/members`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ userIds: toRemove, action: 'remove' }),
        })
      }

      setSuccess('Cập nhật thành viên thành công!')
      fetchGroupDetail(selectedGroup.id)
    } catch (error) {
      setError('Lỗi khi cập nhật thành viên')
    } finally {
      setLoading(false)
    }
  }

  const handleSaveVideos = async () => {
    if (!selectedGroup) return

    setLoading(true)
    try {
      const currentVideoIds = groupDetail?.videoGroups.map((vg: any) => vg.video.id) || []
      const toAdd = selectedVideoIds.filter(id => !currentVideoIds.includes(id))
      const toRemove = currentVideoIds.filter((id: string) => !selectedVideoIds.includes(id))

      if (toAdd.length > 0) {
        await fetch(`/api/user-groups/${selectedGroup.id}/videos`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ videoIds: toAdd, action: 'add' }),
        })
      }

      if (toRemove.length > 0) {
        await fetch(`/api/user-groups/${selectedGroup.id}/videos`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ videoIds: toRemove, action: 'remove' }),
        })
      }

      setSuccess('Cập nhật video thành công!')
      fetchGroupDetail(selectedGroup.id)
    } catch (error) {
      setError('Lỗi khi cập nhật video')
    } finally {
      setLoading(false)
    }
  }

  const handleSaveDocuments = async () => {
    if (!selectedGroup) return

    setLoading(true)
    try {
      const currentDocumentIds = groupDetail?.documentGroups.map((dg: any) => dg.document.id) || []
      const toAdd = selectedDocumentIds.filter(id => !currentDocumentIds.includes(id))
      const toRemove = currentDocumentIds.filter((id: string) => !selectedDocumentIds.includes(id))

      if (toAdd.length > 0) {
        await fetch(`/api/user-groups/${selectedGroup.id}/documents`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ documentIds: toAdd, action: 'add' }),
        })
      }

      if (toRemove.length > 0) {
        await fetch(`/api/user-groups/${selectedGroup.id}/documents`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ documentIds: toRemove, action: 'remove' }),
        })
      }

      setSuccess('Cập nhật tài liệu thành công!')
      fetchGroupDetail(selectedGroup.id)
    } catch (error) {
      setError('Lỗi khi cập nhật tài liệu')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="card">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Quản lý nhóm người dùng</h2>
        <button
          onClick={() => {
            setShowCreateForm(!showCreateForm)
            setEditingGroup(null)
            setFormData({ name: '', description: '' })
            setError('')
            setSuccess('')
          }}
          className="btn-primary"
        >
          {showCreateForm ? 'Hủy' : '+ Tạo nhóm mới'}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-4">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm mb-4">
          {success}
        </div>
      )}

      {/* Form tạo/sửa nhóm */}
      {(showCreateForm || editingGroup) && (
        <form
          onSubmit={editingGroup ? handleUpdateGroup : handleCreateGroup}
          className="bg-gray-50 p-4 rounded-lg mb-6 space-y-4"
        >
          <h3 className="font-semibold text-gray-700 mb-3">
            {editingGroup ? `Sửa nhóm: ${editingGroup.name}` : 'Tạo nhóm mới'}
          </h3>

          <div>
            <label className="block mb-2 font-semibold text-gray-700 text-sm">Tên nhóm *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="input-field"
              required
              disabled={loading}
            />
          </div>

          <div>
            <label className="block mb-2 font-semibold text-gray-700 text-sm">Mô tả</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="input-field"
              rows={3}
              disabled={loading}
            />
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={loading}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Đang xử lý...' : editingGroup ? 'Cập nhật' : 'Tạo nhóm'}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowCreateForm(false)
                setEditingGroup(null)
                setFormData({ name: '', description: '' })
                setError('')
                setSuccess('')
              }}
              className="bg-gray-300 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-400"
              disabled={loading}
            >
              Hủy
            </button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Danh sách nhóm */}
        <div>
          <h3 className="font-semibold text-gray-700 mb-3">Danh sách nhóm ({groups.length})</h3>
          {groups.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>Chưa có nhóm nào</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {groups.map((group) => (
                <div
                  key={group.id}
                  className={`p-3 rounded-lg transition-colors cursor-pointer ${
                    selectedGroup?.id === group.id
                      ? 'bg-blue-100 border-2 border-blue-500'
                      : 'bg-gray-50 hover:bg-gray-100'
                  }`}
                  onClick={() => setSelectedGroup(group)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{group.name}</div>
                      {group.description && (
                        <p className="text-sm text-gray-600 mt-1">{group.description}</p>
                      )}
                      <div className="flex gap-4 mt-2 text-xs text-gray-500">
                        <span>{group._count.members} thành viên</span>
                        <span>{group._count.videoGroups} video</span>
                        <span>{group._count.documentGroups} tài liệu</span>
                      </div>
                    </div>
                    <div className="flex gap-2 ml-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleEditGroup(group)
                          setShowCreateForm(false)
                        }}
                        className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 p-2 rounded-lg transition-colors"
                        title="Sửa nhóm"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeleteGroup(group.id, group.name)
                        }}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 p-2 rounded-lg transition-colors"
                        title="Xóa nhóm"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Chi tiết nhóm */}
        <div>
          {selectedGroup ? (
            <div>
              <h3 className="font-semibold text-gray-700 mb-3">Chi tiết nhóm: {selectedGroup.name}</h3>
              {loadingDetail ? (
                <div className="text-center py-8 text-gray-500">Đang tải...</div>
              ) : (
                <div className="space-y-4">
                  {/* Thành viên */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-gray-700 mb-2">Thành viên</h4>
                    <div className="max-h-40 overflow-y-auto space-y-2 mb-3">
                      {allUsers.map((user) => (
                        <label key={user.id} className="flex items-center gap-2 cursor-pointer">
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
                            className="rounded"
                          />
                          <span className="text-sm text-gray-700">
                            {user.username} {user.fullName && `(${user.fullName})`}
                          </span>
                        </label>
                      ))}
                    </div>
                    <button
                      onClick={handleSaveMembers}
                      disabled={loading}
                      className="btn-primary text-sm py-1 px-3 disabled:opacity-50"
                    >
                      Lưu thành viên
                    </button>
                  </div>

                  {/* Video */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-gray-700 mb-2">Video</h4>
                    <div className="max-h-40 overflow-y-auto space-y-2 mb-3">
                      {allVideos.map((video) => (
                        <label key={video.id} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={selectedVideoIds.includes(video.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedVideoIds([...selectedVideoIds, video.id])
                              } else {
                                setSelectedVideoIds(selectedVideoIds.filter(id => id !== video.id))
                              }
                            }}
                            className="rounded"
                          />
                          <span className="text-sm text-gray-700">{video.title}</span>
                        </label>
                      ))}
                    </div>
                    <button
                      onClick={handleSaveVideos}
                      disabled={loading}
                      className="btn-primary text-sm py-1 px-3 disabled:opacity-50"
                    >
                      Lưu video
                    </button>
                  </div>

                  {/* Tài liệu */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-gray-700 mb-2">Tài liệu</h4>
                    <div className="max-h-40 overflow-y-auto space-y-2 mb-3">
                      {allDocuments.map((doc) => (
                        <label key={doc.id} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={selectedDocumentIds.includes(doc.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedDocumentIds([...selectedDocumentIds, doc.id])
                              } else {
                                setSelectedDocumentIds(selectedDocumentIds.filter(id => id !== doc.id))
                              }
                            }}
                            className="rounded"
                          />
                          <span className="text-sm text-gray-700">{doc.title}</span>
                        </label>
                      ))}
                    </div>
                    <button
                      onClick={handleSaveDocuments}
                      disabled={loading}
                      className="btn-primary text-sm py-1 px-3 disabled:opacity-50"
                    >
                      Lưu tài liệu
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>Chọn một nhóm để xem chi tiết</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

