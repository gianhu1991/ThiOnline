'use client'

import { useState, useEffect } from 'react'
import ImageEditor from './ImageEditor'

interface HomepageTextFormProps {
  title: string
  subtitle: string
  description: string
  onUpdate: (title: string, subtitle: string, description: string) => void
  loading: boolean
}

function HomepageTextForm({ title, subtitle, description, onUpdate, loading }: HomepageTextFormProps) {
  const [formData, setFormData] = useState({ title, subtitle, description })

  useEffect(() => {
    setFormData({ title, subtitle, description })
  }, [title, subtitle, description])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onUpdate(formData.title, formData.subtitle, formData.description)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block mb-2 font-semibold text-gray-700">Tiêu đề chính *</label>
        <input
          type="text"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          className="input-field"
          placeholder="TTVT Nho Quan"
          required
          disabled={loading}
        />
      </div>

      <div>
        <label className="block mb-2 font-semibold text-gray-700">Phụ đề *</label>
        <input
          type="text"
          value={formData.subtitle}
          onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
          className="input-field"
          placeholder="Phần mềm đào tạo kỹ thuật"
          required
          disabled={loading}
        />
      </div>

      <div>
        <label className="block mb-2 font-semibold text-gray-700">Mô tả *</label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          className="input-field"
          rows={3}
          placeholder="Quản lý ngân hàng câu hỏi, tạo bài thi và tổ chức thi trắc nghiệm trực tuyến một cách dễ dàng và hiệu quả"
          required
          disabled={loading}
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'Đang cập nhật...' : 'Cập nhật nội dung'}
      </button>
    </form>
  )
}

export default function LoginBackgroundForm() {
  const [backgroundUrl, setBackgroundUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [preview, setPreview] = useState<string | null>(null)
  const [showEditor, setShowEditor] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  
  // Homepage text states
  const [homepageText, setHomepageText] = useState({
    title: 'TTVT Nho Quan',
    subtitle: 'Phần mềm đào tạo kỹ thuật',
    description: 'Quản lý ngân hàng câu hỏi, tạo bài thi và tổ chức thi trắc nghiệm trực tuyến một cách dễ dàng và hiệu quả',
  })
  const [textLoading, setTextLoading] = useState(false)
  const [textError, setTextError] = useState('')
  const [textSuccess, setTextSuccess] = useState('')

  useEffect(() => {
    fetchBackground()
    fetchHomepageText()
  }, [])

  const fetchHomepageText = async () => {
    try {
      const res = await fetch('/api/settings/homepage-text')
      const data = await res.json()
      if (res.ok && data.success) {
        setHomepageText({
          title: data.title,
          subtitle: data.subtitle,
          description: data.description,
        })
      }
    } catch (error) {
      console.error('Error fetching homepage text:', error)
    }
  }

  const handleUpdateHomepageText = async (title: string, subtitle: string, description: string) => {
    setTextLoading(true)
    setTextError('')
    setTextSuccess('')

    try {
      const res = await fetch('/api/settings/homepage-text', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ title, subtitle, description }),
      })

      const data = await res.json()

      if (res.ok && data.success) {
        setTextSuccess('Cập nhật nội dung trang chủ thành công!')
        setHomepageText({ title, subtitle, description })
      } else {
        setTextError(data.error || 'Cập nhật thất bại')
      }
    } catch (error) {
      setTextError('Lỗi khi cập nhật nội dung')
    } finally {
      setTextLoading(false)
    }
  }

  const fetchBackground = async () => {
    try {
      const res = await fetch('/api/settings/login-background')
      const data = await res.json()
      if (res.ok && data.success) {
        setBackgroundUrl(data.backgroundUrl)
      }
    } catch (error) {
      console.error('Error fetching background:', error)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      // Tạo preview URL để hiển thị trong editor
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreview(reader.result as string)
        setShowEditor(true) // Mở editor ngay khi chọn file
      }
      reader.readAsDataURL(file)
      setError('')
      setSuccess('')
    }
  }

  const handleSaveFromEditor = async (file: File | Blob, cropArea?: { x: number; y: number; width: number; height: number }, formPosition?: { x: number; y: number; width: number; height: number }) => {
    setUploading(true)
    setError('')
    setSuccess('')
    setShowEditor(false)

    try {
      const formData = new FormData()
      // Nếu là Blob (đã crop), tạo File từ Blob. Nếu là File gốc, dùng trực tiếp
      if (file instanceof Blob && !(file instanceof File)) {
        const fileName = selectedFile?.name || 'background.jpg'
        const fileObj = new File([file], fileName, { type: 'image/jpeg' })
        formData.append('file', fileObj)
      } else {
        formData.append('file', file as File)
      }

      // Thêm formPosition nếu có
      if (formPosition) {
        formData.append('formPosition', JSON.stringify(formPosition))
      }

      const res = await fetch('/api/settings/login-background', {
        method: 'POST',
        credentials: 'include',
        body: formData,
      })

      const data = await res.json()

      if (res.ok && data.success) {
        setSuccess(cropArea ? 'Cập nhật ảnh nền (đã crop) thành công!' : 'Cập nhật ảnh nền thành công!')
        setBackgroundUrl(data.url)
        setPreview(null)
        setSelectedFile(null)
        const fileInput = document.getElementById('background-file') as HTMLInputElement
        if (fileInput) fileInput.value = ''
      } else {
        setError(data.error || 'Upload thất bại')
      }
    } catch (error) {
      setError('Lỗi khi upload ảnh')
    } finally {
      setUploading(false)
    }
  }

  const handleCancelEditor = () => {
    setShowEditor(false)
    setPreview(null)
    setSelectedFile(null)
    const fileInput = document.getElementById('background-file') as HTMLInputElement
    if (fileInput) fileInput.value = ''
  }

  const handleDelete = async () => {
    if (!confirm('Bạn có chắc muốn xóa ảnh nền và trở về mặc định?')) return

    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const res = await fetch('/api/settings/login-background', {
        method: 'DELETE',
        credentials: 'include',
      })

      const data = await res.json()

      if (res.ok && data.success) {
        setSuccess('Đã xóa ảnh nền, trở về mặc định')
        setBackgroundUrl(null)
        setPreview(null)
      } else {
        setError(data.error || 'Xóa thất bại')
      }
    } catch (error) {
      setError('Lỗi khi xóa ảnh nền')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Quản lý ảnh nền đăng nhập */}
      <div className="card">
        <h2 className="text-2xl font-bold mb-6">Quản lý ảnh nền đăng nhập</h2>

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

      {/* Preview current background */}
      {backgroundUrl && (
        <div className="mb-6">
          <h3 className="font-semibold text-gray-700 mb-2">Ảnh nền hiện tại:</h3>
          <div className="relative w-full h-48 rounded-lg overflow-hidden border border-gray-200">
            <img 
              src={backgroundUrl} 
              alt="Login background" 
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      )}

      {/* Upload form */}
      <form className="space-y-4">
        <div>
          <label className="block mb-2 font-semibold text-gray-700">
            Chọn ảnh nền mới
          </label>
          <input
            id="background-file"
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            disabled={uploading}
          />
          <p className="text-xs text-gray-500 mt-1">
            Hỗ trợ: JPG, PNG, GIF, WebP. Kích thước tối đa: 10MB
          </p>
        </div>

        <div className="flex gap-2">
          {backgroundUrl && (
            <button
              type="button"
              onClick={handleDelete}
              disabled={loading}
              className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Đang xóa...' : 'Xóa ảnh nền'}
            </button>
          )}
        </div>
      </form>

      {/* Image Editor Modal */}
      {showEditor && preview && selectedFile && (
        <ImageEditor
          imageUrl={preview}
          originalFile={selectedFile}
          onSave={handleSaveFromEditor}
          onCancel={handleCancelEditor}
        />
      )}

      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <p className="text-sm text-blue-800">
          <strong>Lưu ý:</strong> Ảnh nền sẽ được hiển thị trên màn hình đăng nhập. 
          Nên chọn ảnh có độ phân giải cao và kích thước phù hợp để hiển thị đẹp trên mọi thiết bị.
        </p>
      </div>
      </div>

      {/* Quản lý nội dung trang chủ */}
      <div className="card">
        <h2 className="text-2xl font-bold mb-6">Quản lý nội dung trang chủ</h2>

        {textError && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-4">
            {textError}
          </div>
        )}

        {textSuccess && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm mb-4">
            {textSuccess}
          </div>
        )}

        <HomepageTextForm
          title={homepageText.title}
          subtitle={homepageText.subtitle}
          description={homepageText.description}
          onUpdate={handleUpdateHomepageText}
          loading={textLoading}
        />

        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>Lưu ý:</strong> Các thay đổi sẽ được hiển thị ngay trên trang chủ. 
            Tiêu đề và phụ đề sẽ hiển thị ở phần hero section.
          </p>
        </div>
      </div>
    </div>
  )
}

