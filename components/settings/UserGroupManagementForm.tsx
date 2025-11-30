'use client'

import { useState, useEffect, useRef } from 'react'
import CheckboxDropdown from './CheckboxDropdown'

interface UserGroup {
  id: string
  name: string
  description: string | null
  createdAt: string
  _count: {
    members: number
    videoGroups: number
    documentGroups: number
    examGroups: number
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

interface Exam {
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
  const [allExams, setAllExams] = useState<Exam[]>([])
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([])
  const [selectedVideoIds, setSelectedVideoIds] = useState<string[]>([])
  const [selectedDocumentIds, setSelectedDocumentIds] = useState<string[]>([])
  const [selectedExamIds, setSelectedExamIds] = useState<string[]>([])
  const [isGroupDropdownOpen, setIsGroupDropdownOpen] = useState(false)
  const groupDropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchGroups()
  }, [])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (groupDropdownRef.current && !groupDropdownRef.current.contains(event.target as Node)) {
        setIsGroupDropdownOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  useEffect(() => {
    if (selectedGroup) {
      fetchGroupDetail(selectedGroup.id)
      fetchAllUsers()
      fetchAllVideos()
      fetchAllDocuments()
      fetchAllExams()
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
        setSelectedExamIds(data.group.examGroups?.map((eg: any) => eg.exam.id) || [])
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

  const fetchAllExams = async () => {
    try {
      const res = await fetch('/api/exams', {
        credentials: 'include',
      })
      const data = await res.json()
      if (res.ok && Array.isArray(data)) {
        setAllExams(data)
      }
    } catch (error) {
      console.error('Error fetching exams:', error)
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

  const handleSaveExams = async () => {
    if (!selectedGroup) return

    setLoading(true)
    try {
      const currentExamIds = groupDetail?.examGroups?.map((eg: any) => eg.exam.id) || []
      const toAdd = selectedExamIds.filter(id => !currentExamIds.includes(id))
      const toRemove = currentExamIds.filter((id: string) => !selectedExamIds.includes(id))

      if (toAdd.length > 0) {
        await fetch(`/api/user-groups/${selectedGroup.id}/exams`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ examIds: toAdd, action: 'add' }),
        })
      }

      if (toRemove.length > 0) {
        await fetch(`/api/user-groups/${selectedGroup.id}/exams`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ examIds: toRemove, action: 'remove' }),
        })
      }

      setSuccess('Cập nhật bài thi thành công!')
      fetchGroupDetail(selectedGroup.id)
    } catch (error) {
      setError('Lỗi khi cập nhật bài thi')
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

      {/* Layout: Danh sách nhóm bên trái, Chi tiết bên phải */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mb-6">
        {/* Danh sách nhóm - Dropdown checkbox - Chiếm 5 cột (mở rộng) */}
        <div className="lg:col-span-5 bg-white border border-gray-200 rounded-lg shadow-sm p-4">
          <h3 className="font-semibold text-gray-800 mb-3 text-sm">Danh sách nhóm ({groups.length})</h3>
          
          <div className="relative" ref={groupDropdownRef}>
            <button
              type="button"
              onClick={() => setIsGroupDropdownOpen(!isGroupDropdownOpen)}
              className={`w-full px-4 py-3 text-left flex items-center justify-between bg-white border-2 rounded-lg transition-all ${
                isGroupDropdownOpen 
                  ? 'border-blue-500 shadow-md' 
                  : selectedGroup
                  ? 'border-blue-300 shadow-sm'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              <div className="flex-1 min-w-0">
                {selectedGroup ? (
                  <div>
                    <div className="font-semibold text-gray-900 text-sm truncate">{selectedGroup.name}</div>
                    {selectedGroup.description && (
                      <div className="text-xs text-gray-500 mt-1 truncate">{selectedGroup.description}</div>
                    )}
                    <div className="flex flex-wrap gap-1 mt-2">
                      <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded text-xs">{selectedGroup._count.members} TV</span>
                      <span className="px-1.5 py-0.5 bg-green-100 text-green-700 rounded text-xs">{selectedGroup._count.videoGroups} V</span>
                      <span className="px-1.5 py-0.5 bg-purple-100 text-purple-700 rounded text-xs">{selectedGroup._count.documentGroups} TL</span>
                      <span className="px-1.5 py-0.5 bg-orange-100 text-orange-700 rounded text-xs">{selectedGroup._count.examGroups || 0} BT</span>
                    </div>
                  </div>
                ) : (
                  <span className="text-sm text-gray-400">Chọn nhóm để quản lý...</span>
                )}
              </div>
              <svg
                className={`w-5 h-5 text-gray-500 transition-transform flex-shrink-0 ml-2 ${isGroupDropdownOpen ? 'transform rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {isGroupDropdownOpen && (
              <div className="absolute z-50 w-full mt-2 bg-white border-2 border-gray-200 rounded-lg shadow-xl max-h-[500px] overflow-y-auto">
                <div className="p-2">
                  {groups.length === 0 ? (
                    <div className="text-sm text-gray-500 p-3 text-center">Chưa có nhóm nào</div>
                  ) : (
                    groups.map((group) => {
                      const isSelected = selectedGroup?.id === group.id
                      return (
                        <label
                          key={group.id}
                          className={`flex items-start p-3 cursor-pointer rounded-lg transition-all border ${
                            isSelected 
                              ? 'bg-blue-50 border-blue-300 shadow-sm' 
                              : 'hover:bg-gray-50 border-transparent hover:border-gray-200'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {
                              setSelectedGroup(isSelected ? null : group)
                              setIsGroupDropdownOpen(false)
                            }}
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 focus:ring-2 mt-1 flex-shrink-0"
                          />
                          <div className="ml-3 flex-1 min-w-0">
                            <div className={`font-semibold text-sm ${isSelected ? 'text-blue-900' : 'text-gray-900'} break-words`}>
                              {group.name}
                            </div>
                            {group.description && (
                              <p className={`text-xs mt-1 line-clamp-2 break-words ${isSelected ? 'text-blue-700' : 'text-gray-600'}`}>
                                {group.description}
                              </p>
                            )}
                            <div className="flex flex-wrap gap-1.5 mt-2">
                              <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded text-xs">{group._count.members} TV</span>
                              <span className="px-1.5 py-0.5 bg-green-100 text-green-700 rounded text-xs">{group._count.videoGroups} V</span>
                              <span className="px-1.5 py-0.5 bg-purple-100 text-purple-700 rounded text-xs">{group._count.documentGroups} TL</span>
                              <span className="px-1.5 py-0.5 bg-orange-100 text-orange-700 rounded text-xs">{group._count.examGroups || 0} BT</span>
                            </div>
                          </div>
                          <div className="flex gap-1 flex-shrink-0 ml-2" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                e.preventDefault()
                                handleEditGroup(group)
                                setShowCreateForm(false)
                                setIsGroupDropdownOpen(false)
                              }}
                              className="text-blue-600 hover:text-blue-700 hover:bg-blue-100 p-1.5 rounded transition-colors"
                              title="Sửa nhóm"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                e.preventDefault()
                                handleDeleteGroup(group.id, group.name)
                                setIsGroupDropdownOpen(false)
                              }}
                              className="text-red-600 hover:text-red-700 hover:bg-red-100 p-1.5 rounded transition-colors"
                              title="Xóa nhóm"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </label>
                      )
                    })
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Chi tiết nhóm - Chiếm 7 cột, bên trong chia thành 2 cột để tránh chồng chéo */}
        {selectedGroup ? (
          loadingDetail ? (
            <div className="lg:col-span-8 bg-white border border-gray-200 rounded-lg shadow-sm p-8">
              <div className="text-center py-8 text-gray-500">
                <svg className="animate-spin h-8 w-8 text-blue-600 mx-auto mb-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <p>Đang tải...</p>
              </div>
            </div>
          ) : (
            <div className="lg:col-span-7 grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Thành viên */}
              <div className="bg-gradient-to-br from-blue-50 to-white border-l-4 border-blue-500 rounded-lg shadow-md hover:shadow-lg transition-shadow p-5">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  </div>
                  <h4 className="font-bold text-gray-800 text-sm">Thành viên</h4>
                </div>
                <CheckboxDropdown
                  label=""
                  items={allUsers.map(user => ({
                    id: user.id,
                    label: `${user.username}${user.fullName ? ` (${user.fullName})` : ''}`,
                  }))}
                  selectedIds={selectedUserIds}
                  onSelectionChange={setSelectedUserIds}
                  placeholder="Chọn thành viên..."
                />
                <button
                  onClick={handleSaveMembers}
                  disabled={loading}
                  className="bg-blue-600 hover:bg-blue-700 text-white text-sm py-2.5 px-4 disabled:opacity-50 w-full mt-3 rounded-lg font-medium transition-colors shadow-sm"
                >
                  Lưu thành viên
                </button>
              </div>

              {/* Video */}
              <div className="bg-gradient-to-br from-green-50 to-white border-l-4 border-green-500 rounded-lg shadow-md hover:shadow-lg transition-shadow p-5">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h4 className="font-bold text-gray-800 text-sm">Video</h4>
                </div>
                <CheckboxDropdown
                  label=""
                  items={allVideos.map(video => ({
                    id: video.id,
                    label: video.title,
                  }))}
                  selectedIds={selectedVideoIds}
                  onSelectionChange={setSelectedVideoIds}
                  placeholder="Chọn video..."
                />
                <button
                  onClick={handleSaveVideos}
                  disabled={loading}
                  className="bg-green-600 hover:bg-green-700 text-white text-sm py-2.5 px-4 disabled:opacity-50 w-full mt-3 rounded-lg font-medium transition-colors shadow-sm"
                >
                  Lưu video
                </button>
              </div>

              {/* Tài liệu */}
              <div className="bg-gradient-to-br from-purple-50 to-white border-l-4 border-purple-500 rounded-lg shadow-md hover:shadow-lg transition-shadow p-5">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h4 className="font-bold text-gray-800 text-sm">Tài liệu</h4>
                </div>
                <CheckboxDropdown
                  label=""
                  items={allDocuments.map(doc => ({
                    id: doc.id,
                    label: doc.title,
                  }))}
                  selectedIds={selectedDocumentIds}
                  onSelectionChange={setSelectedDocumentIds}
                  placeholder="Chọn tài liệu..."
                />
                <button
                  onClick={handleSaveDocuments}
                  disabled={loading}
                  className="bg-purple-600 hover:bg-purple-700 text-white text-sm py-2.5 px-4 disabled:opacity-50 w-full mt-3 rounded-lg font-medium transition-colors shadow-sm"
                >
                  Lưu tài liệu
                </button>
              </div>

              {/* Bài thi */}
              <div className="bg-gradient-to-br from-orange-50 to-white border-l-4 border-orange-500 rounded-lg shadow-md hover:shadow-lg transition-shadow p-5">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h4 className="font-bold text-gray-800 text-sm">Bài thi</h4>
                </div>
                <CheckboxDropdown
                  label=""
                  items={allExams.map(exam => ({
                    id: exam.id,
                    label: exam.title,
                  }))}
                  selectedIds={selectedExamIds}
                  onSelectionChange={setSelectedExamIds}
                  placeholder="Chọn bài thi..."
                />
                <button
                  onClick={handleSaveExams}
                  disabled={loading}
                  className="bg-orange-600 hover:bg-orange-700 text-white text-sm py-2.5 px-4 disabled:opacity-50 w-full mt-3 rounded-lg font-medium transition-colors shadow-sm"
                >
                  Lưu bài thi
                </button>
              </div>
            </div>
          )
        ) : (
          <div className="lg:col-span-7 grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Placeholder cards với màu sắc đẹp hơn */}
            <div className="bg-gradient-to-br from-blue-50 to-white border-l-4 border-blue-300 rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
              <div className="text-center py-6">
                <div className="w-16 h-16 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
                <p className="text-sm font-semibold text-gray-600">Thành viên</p>
                <p className="text-xs text-gray-400 mt-1">Chọn nhóm để quản lý</p>
              </div>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-white border-l-4 border-green-300 rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
              <div className="text-center py-6">
                <div className="w-16 h-16 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </div>
                <p className="text-sm font-semibold text-gray-600">Video</p>
                <p className="text-xs text-gray-400 mt-1">Chọn nhóm để quản lý</p>
              </div>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-white border-l-4 border-purple-300 rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
              <div className="text-center py-6">
                <div className="w-16 h-16 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                </div>
                <p className="text-sm font-semibold text-gray-600">Tài liệu</p>
                <p className="text-xs text-gray-400 mt-1">Chọn nhóm để quản lý</p>
              </div>
            </div>
            <div className="bg-gradient-to-br from-orange-50 to-white border-l-4 border-orange-300 rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
              <div className="text-center py-6">
                <div className="w-16 h-16 bg-orange-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <p className="text-sm font-semibold text-gray-600">Bài thi</p>
                <p className="text-xs text-gray-400 mt-1">Chọn nhóm để quản lý</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

