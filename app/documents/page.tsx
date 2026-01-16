'use client'

import { useEffect, useState } from 'react'

interface Document {
  id: string
  title: string
  description: string | null
  url: string
  fileName: string | null
  fileSize: number
  category: string | null
  isPublic: boolean
  downloadCount: number
  uploadedBy: string | null
  createdAt: string
}


export default function DocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [categories, setCategories] = useState<string[]>([])
  const [userRole, setUserRole] = useState<string | null>(null)
  const [permissions, setPermissions] = useState<{ [key: string]: boolean }>({})
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingDocument, setEditingDocument] = useState<Document | null>(null)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    isPublic: true,
  })
  const [pdfFile, setPdfFile] = useState<File | null>(null)
  const [uploadingFile, setUploadingFile] = useState(false)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [selectedDocuments, setSelectedDocuments] = useState<Set<string>>(new Set())

  useEffect(() => {
    fetchDocuments()
    checkUserRole()
    fetchPermissions()
  }, [selectedCategory])

  const checkUserRole = async () => {
    try {
      const res = await fetch('/api/auth/me', {
        credentials: 'include',
      })
      if (res.ok) {
        const data = await res.json()
        setUserRole(data.user?.role || null)
      }
    } catch (error) {
      console.error('Error checking user role:', error)
    }
  }

  const fetchPermissions = async () => {
    try {
      const res = await fetch('/api/auth/permissions', {
        credentials: 'include',
      })
      if (res.ok) {
        const data = await res.json()
        setPermissions(data.permissions || {})
      } else {
        setPermissions({})
      }
    } catch (error) {
      console.error('Error fetching permissions:', error)
      setPermissions({})
    }
  }

  const fetchDocuments = async () => {
    setLoading(true)
    try {
      const url = selectedCategory === 'all'
        ? '/api/documents'
        : `/api/documents?category=${encodeURIComponent(selectedCategory)}`
      const res = await fetch(url)
      const data = await res.json()
      setDocuments(Array.isArray(data) ? data : [])
      
      // Extract unique categories
      if (Array.isArray(data)) {
        const uniqueCategories = Array.from(new Set(data.map((d: Document) => d.category).filter(Boolean)))
        setCategories(uniqueCategories as string[])
      }
    } catch (error) {
      console.error('Error fetching documents:', error)
      setDocuments([])
    } finally {
      setLoading(false)
    }
  }

  const formatFileSize = (bytes: number | null | undefined) => {
    if (!bytes || bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)

    try {
      if (!pdfFile) {
        setError('Vui lòng chọn file PDF để upload')
        setSubmitting(false)
        return
      }

      // Upload file
      setUploadingFile(true)
      const uploadFormData = new FormData()
      uploadFormData.append('file', pdfFile)

      const uploadRes = await fetch('/api/documents/upload', {
        method: 'POST',
        body: uploadFormData,
      })

      const uploadData = await uploadRes.json()

      if (!uploadRes.ok || !uploadData.success) {
        setError(uploadData.error || 'Lỗi khi upload file')
        setSubmitting(false)
        setUploadingFile(false)
        return
      }

      setUploadingFile(false)

      // Tạo document record
      const res = await fetch('/api/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          url: uploadData.url,
          fileName: uploadData.filename,
          fileSize: uploadData.size,
        }),
      })

      const data = await res.json()

      if (res.ok && data.success) {
        alert('Thêm tài liệu thành công!')
        setShowAddModal(false)
        setFormData({
          title: '',
          description: '',
          category: '',
          isPublic: true,
        })
        setPdfFile(null)
        fetchDocuments()
      } else {
        setError(data.error || 'Lỗi khi lưu tài liệu')
      }
    } catch (error) {
      setError('Lỗi khi lưu tài liệu')
    } finally {
      setSubmitting(false)
      setUploadingFile(false)
    }
  }

  const handleEdit = (doc: Document) => {
    setEditingDocument(doc)
    setFormData({
      title: doc.title,
      description: doc.description || '',
      category: doc.category || '',
      isPublic: doc.isPublic !== undefined ? doc.isPublic : true,
    })
    setPdfFile(null)
    setError('')
    setShowEditModal(true)
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingDocument) return

    setError('')
    setSubmitting(true)

    try {
      const res = await fetch(`/api/documents/${editingDocument.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(formData),
      })

      const data = await res.json()

      if (res.ok && data.success) {
        alert('Cập nhật tài liệu thành công!')
        setShowEditModal(false)
        setEditingDocument(null)
        setSelectedDocuments(new Set())
        setFormData({
          title: '',
          description: '',
          category: '',
          isPublic: true,
        })
        fetchDocuments()
      } else {
        setError(data.error || 'Lỗi khi cập nhật tài liệu')
      }
    } catch (error) {
      setError('Lỗi khi cập nhật tài liệu')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc muốn xóa tài liệu này?')) return

    try {
      const res = await fetch(`/api/documents/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      })

      if (res.ok) {
        alert('Xóa tài liệu thành công!')
        setSelectedDocuments(new Set())
        fetchDocuments()
      } else {
        const data = await res.json()
        alert(data.error || 'Lỗi khi xóa tài liệu')
      }
    } catch (error) {
      alert('Lỗi khi xóa tài liệu')
    }
  }

  const handleSelectDocument = (id: string) => {
    const newSelected = new Set(selectedDocuments)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedDocuments(newSelected)
  }

  const handleSelectAll = () => {
    if (selectedDocuments.size === documents.length) {
      setSelectedDocuments(new Set())
    } else {
      setSelectedDocuments(new Set(documents.map(doc => doc.id)))
    }
  }

  const handleBulkDelete = async () => {
    if (selectedDocuments.size === 0) return
    if (!confirm(`Bạn có chắc muốn xóa ${selectedDocuments.size} tài liệu đã chọn?`)) return

    try {
      const deletePromises = Array.from(selectedDocuments).map(id =>
        fetch(`/api/documents/${id}`, {
          method: 'DELETE',
          credentials: 'include',
        })
      )

      const results = await Promise.all(deletePromises)
      const allSuccess = results.every(res => res.ok)

      if (allSuccess) {
        alert(`Đã xóa ${selectedDocuments.size} tài liệu thành công!`)
        setSelectedDocuments(new Set())
        fetchDocuments()
      } else {
        alert('Có lỗi xảy ra khi xóa một số tài liệu')
        fetchDocuments()
      }
    } catch (error) {
      alert('Lỗi khi xóa tài liệu')
    }
  }

  const handleBulkDownload = () => {
    if (selectedDocuments.size === 0) return
    
    const selectedDocs = documents.filter(doc => selectedDocuments.has(doc.id))
    selectedDocs.forEach(doc => {
      if (doc.url) {
        const link = document.createElement('a')
        link.href = doc.url
        link.download = doc.fileName || doc.title
        link.target = '_blank'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      }
    })
  }

  const handleBulkEdit = () => {
    if (selectedDocuments.size !== 1) {
      alert('Vui lòng chọn đúng 1 tài liệu để sửa')
      return
    }
    const docId = Array.from(selectedDocuments)[0]
    const doc = documents.find(d => d.id === docId)
    if (doc) {
      handleEdit(doc)
      setSelectedDocuments(new Set())
    }
  }

  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white z-50">
        <div className="text-center">
          <svg className="animate-spin h-8 w-8 text-blue-600 mx-auto mb-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-gray-600">Đang tải...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Tài liệu KT</h1>
          <p className="text-gray-600">Xem và tải xuống các tài liệu kỹ thuật</p>
        </div>
        {(permissions['create_documents'] || userRole === 'admin') && (
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-semibold flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Thêm tài liệu
          </button>
        )}
      </div>

      {categories.length > 0 && (
        <div className="mb-6">
          <label className="block mb-2 text-sm font-medium text-gray-700">Lọc theo danh mục:</label>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="input-field"
          >
            <option value="all">Tất cả</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
      )}

      {/* Action buttons - chỉ hiện khi có tài liệu được chọn */}
      {selectedDocuments.size > 0 && (
        <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">
              Đã chọn: {selectedDocuments.size} tài liệu
            </span>
            <div className="flex gap-2">
              <button
                onClick={handleBulkDownload}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-medium text-sm flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Tải xuống ({selectedDocuments.size})
              </button>
              {(permissions['edit_documents'] || userRole === 'admin') && (
                <button
                  onClick={handleBulkEdit}
                  disabled={selectedDocuments.size !== 1}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Sửa
                </button>
              )}
              {(permissions['delete_documents'] || userRole === 'admin') && (
                <button
                  onClick={handleBulkDelete}
                  className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 font-medium text-sm flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Xóa ({selectedDocuments.size})
                </button>
              )}
              <button
                onClick={() => setSelectedDocuments(new Set())}
                className="bg-gray-300 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-400 font-medium text-sm"
              >
                Bỏ chọn
              </button>
            </div>
          </div>
        </div>
      )}

      {documents.length === 0 ? (
        <div className="py-12 text-center">
          <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
          <p className="text-gray-500 text-lg mb-2">Chưa có tài liệu nào</p>
          <p className="text-gray-400">Tài liệu sẽ được cập nhật sớm</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-12">
                    <input
                      type="checkbox"
                      checked={documents.length > 0 && selectedDocuments.size === documents.length}
                      onChange={handleSelectAll}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tài liệu
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Danh mục
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Kích thước
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Lượt tải
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ngày tạo
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {documents.map((doc) => (
                  <tr
                    key={doc.id}
                    className={`hover:bg-gray-50 cursor-pointer transition-colors ${
                      selectedDocuments.has(doc.id) ? 'bg-blue-50' : ''
                    }`}
                    onClick={() => handleSelectDocument(doc.id)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selectedDocuments.has(doc.id)}
                        onChange={() => handleSelectDocument(doc.id)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <svg className="w-8 h-8 text-red-600 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-gray-900">{doc.title}</div>
                          {doc.description && (
                            <div className="text-sm text-gray-500 truncate max-w-md">{doc.description}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {doc.category ? (
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                          {doc.category}
                        </span>
                      ) : (
                        <span className="text-gray-400 text-sm">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatFileSize(doc.fileSize)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {doc.downloadCount || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {doc.createdAt ? new Date(doc.createdAt).toLocaleDateString('vi-VN') : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Edit Document Modal */}
      {showEditModal && (permissions['edit_documents'] || userRole === 'admin') && editingDocument && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-6">Sửa tài liệu</h2>
            <form onSubmit={handleUpdate} className="space-y-4">
              <div>
                <label className="block mb-2 font-semibold text-gray-700">Tiêu đề *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="input-field"
                  required
                />
              </div>

              <div>
                <label className="block mb-2 font-semibold text-gray-700">Mô tả</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="input-field"
                  rows={4}
                />
              </div>

              <div>
                <label className="block mb-2 font-semibold text-gray-700">Danh mục</label>
                <input
                  type="text"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="input-field"
                  placeholder="Ví dụ: Hướng dẫn, Thực hành, Lý thuyết..."
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isPublicEdit"
                  checked={formData.isPublic}
                  onChange={(e) => setFormData({ ...formData, isPublic: e.target.checked })}
                  className="mr-2"
                />
                <label htmlFor="isPublicEdit" className="font-medium">Công khai (mọi người có thể xem)</label>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                  {error}
                </div>
              )}

              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false)
                    setEditingDocument(null)
                    setFormData({
                      title: '',
                      description: '',
                      category: '',
                      isPublic: true,
                    })
                    setError('')
                  }}
                  className="flex-1 bg-gray-300 text-gray-800 px-6 py-2 rounded-lg hover:bg-gray-400"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {submitting ? 'Đang lưu...' : 'Cập nhật'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Document Modal */}
      {showAddModal && (permissions['create_documents'] || userRole === 'admin') && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-6">Thêm tài liệu mới</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block mb-2 font-semibold text-gray-700">Tiêu đề *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="input-field"
                  required
                />
              </div>

              <div>
                <label className="block mb-2 font-semibold text-gray-700">File PDF *</label>
                <input
                  type="file"
                  accept=".pdf,application/pdf"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) {
                      // Kiểm tra kích thước (50MB)
                      const maxSize = 50 * 1024 * 1024
                      if (file.size > maxSize) {
                        alert('File quá lớn. Kích thước tối đa là 50MB')
                        e.target.value = ''
                        return
                      }
                      setPdfFile(file)
                    }
                  }}
                  className="input-field"
                  required
                />
                {pdfFile && (
                  <p className="text-sm text-gray-600 mt-2">
                    Đã chọn: {pdfFile.name} ({formatFileSize(pdfFile.size)})
                  </p>
                )}
                <p className="text-sm text-gray-500 mt-1">Chỉ hỗ trợ file PDF (tối đa 50MB)</p>
              </div>

              <div>
                <label className="block mb-2 font-semibold text-gray-700">Mô tả</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="input-field"
                  rows={4}
                />
              </div>

              <div>
                <label className="block mb-2 font-semibold text-gray-700">Danh mục</label>
                <input
                  type="text"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="input-field"
                  placeholder="Ví dụ: Hướng dẫn, Thực hành, Lý thuyết..."
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isPublic"
                  checked={formData.isPublic}
                  onChange={(e) => setFormData({ ...formData, isPublic: e.target.checked })}
                  className="mr-2"
                />
                <label htmlFor="isPublic" className="font-medium">Công khai (mọi người có thể xem)</label>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                  {error}
                </div>
              )}

              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false)
                    setFormData({
                      title: '',
                      description: '',
                      category: '',
                      isPublic: true,
                    })
                    setPdfFile(null)
                    setError('')
                  }}
                  className="flex-1 bg-gray-300 text-gray-800 px-6 py-2 rounded-lg hover:bg-gray-400"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submitting || uploadingFile}
                  className="flex-1 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {uploadingFile ? 'Đang upload...' : submitting ? 'Đang lưu...' : 'Thêm tài liệu'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

