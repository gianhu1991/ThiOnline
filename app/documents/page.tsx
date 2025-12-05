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

  useEffect(() => {
    fetchDocuments()
    checkUserRole()
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

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B'
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
        fetchDocuments()
      } else {
        const data = await res.json()
        alert(data.error || 'Lỗi khi xóa tài liệu')
      }
    } catch (error) {
      alert('Lỗi khi xóa tài liệu')
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Tài liệu KT</h1>
          <p className="text-gray-600">Xem và tải xuống các tài liệu kỹ thuật</p>
        </div>
        {userRole === 'admin' && (
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

      {loading ? (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <svg className="animate-spin h-8 w-8 text-blue-600 mx-auto mb-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="text-gray-600">Đang tải...</p>
          </div>
        </div>
      ) : documents.length === 0 ? (
        <div className="py-12 text-center">
          <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
          <p className="text-gray-500 text-lg mb-2">Chưa có tài liệu nào</p>
          <p className="text-gray-400">Tài liệu sẽ được cập nhật sớm</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {documents.map((doc) => (
            <div key={doc.id} className="card hover:shadow-xl transition-shadow">
              <div className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold mb-2 text-gray-900">{doc.title}</h3>
                    {doc.description && (
                      <p className="text-gray-600 text-sm mb-3 line-clamp-2">{doc.description}</p>
                    )}
                  </div>
                  <div className="ml-2">
                    <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                  </div>
                </div>
                <div className="flex items-center justify-between text-sm text-gray-500 mb-3">
                  <span>{doc.downloadCount} lượt tải</span>
                  {doc.category && (
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">
                      {doc.category}
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between text-xs text-gray-400 mb-3">
                  <span>{formatFileSize(doc.fileSize)}</span>
                  <span>{new Date(doc.createdAt).toLocaleDateString('vi-VN')}</span>
                </div>
                <div className="flex gap-2">
                  <a
                    href={doc.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-center font-medium"
                  >
                    Tải xuống
                  </a>
                  {userRole === 'admin' && (
                    <>
                      <button
                        onClick={() => handleEdit(doc)}
                        className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 font-medium"
                      >
                        Sửa
                      </button>
                      <button
                        onClick={() => handleDelete(doc.id)}
                        className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 font-medium"
                      >
                        Xóa
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Document Modal */}
      {showEditModal && userRole === 'admin' && editingDocument && (
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
      {showAddModal && userRole === 'admin' && (
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

