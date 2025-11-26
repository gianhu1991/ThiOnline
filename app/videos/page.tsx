'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface Video {
  id: string
  title: string
  description: string | null
  url: string
  thumbnail: string | null
  category: string | null
  viewCount: number
  uploadedBy: string | null
  createdAt: string
}

export default function VideosPage() {
  const [videos, setVideos] = useState<Video[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [categories, setCategories] = useState<string[]>([])
  const [userRole, setUserRole] = useState<string | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    url: '',
    thumbnail: '',
    category: '',
    isPublic: true,
  })
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchVideos()
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

  const fetchVideos = async () => {
    setLoading(true)
    try {
      const url = selectedCategory === 'all'
        ? '/api/videos'
        : `/api/videos?category=${encodeURIComponent(selectedCategory)}`
      const res = await fetch(url)
      const data = await res.json()
      setVideos(Array.isArray(data) ? data : [])
      
      // Extract unique categories
      if (Array.isArray(data)) {
        const uniqueCategories = Array.from(new Set(data.map((v: Video) => v.category).filter(Boolean)))
        setCategories(uniqueCategories as string[])
      }
    } catch (error) {
      console.error('Error fetching videos:', error)
      setVideos([])
    } finally {
      setLoading(false)
    }
  }

  const getYouTubeEmbedUrl = (url: string) => {
    // Extract YouTube video ID
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/
    const match = url.match(regExp)
    const videoId = match && match[2].length === 11 ? match[2] : null
    
    if (videoId) {
      return `https://www.youtube.com/embed/${videoId}`
    }
    
    // If not YouTube, return original URL
    return url
  }

  const getYouTubeThumbnail = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/
    const match = url.match(regExp)
    const videoId = match && match[2].length === 11 ? match[2] : null
    
    if (videoId) {
      return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`
    }
    
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)

    try {
      const res = await fetch('/api/videos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await res.json()

      if (res.ok && data.success) {
        alert('Thêm video thành công!')
        setShowAddModal(false)
        setFormData({
          title: '',
          description: '',
          url: '',
          thumbnail: '',
          category: '',
          isPublic: true,
        })
        fetchVideos()
      } else {
        setError(data.error || 'Lỗi khi lưu video')
      }
    } catch (error) {
      setError('Lỗi khi lưu video')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Video thực hành</h1>
          <p className="text-gray-600">Xem các video hướng dẫn thực hành</p>
        </div>
        {userRole === 'admin' && (
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-semibold flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Thêm video
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
        <div className="py-12 text-center">
          <svg className="animate-spin h-8 w-8 text-blue-600 mx-auto mb-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-gray-600">Đang tải...</p>
        </div>
      ) : videos.length === 0 ? (
        <div className="py-12 text-center">
          <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
          <p className="text-gray-500 text-lg mb-2">Chưa có video nào</p>
          <p className="text-gray-400">Video sẽ được cập nhật sớm</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {videos.map((video) => {
            const thumbnail = video.thumbnail || getYouTubeThumbnail(video.url)
            return (
              <div key={video.id} className="card hover:shadow-xl transition-shadow">
                <Link href={`/videos/${video.id}`}>
                  {thumbnail ? (
                    <img
                      src={thumbnail}
                      alt={video.title}
                      className="w-full h-48 object-cover rounded-t-lg"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none'
                      }}
                    />
                  ) : (
                    <div className="w-full h-48 bg-gray-200 rounded-t-lg flex items-center justify-center">
                      <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}
                  <div className="p-4">
                    <h3 className="text-xl font-bold mb-2 text-gray-900">{video.title}</h3>
                    {video.description && (
                      <p className="text-gray-600 text-sm mb-3 line-clamp-2">{video.description}</p>
                    )}
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <span>{video.viewCount} lượt xem</span>
                      {video.category && (
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">
                          {video.category}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              </div>
            )
          })}
        </div>
      )}

      {/* Add Video Modal */}
      {showAddModal && userRole === 'admin' && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-6">Thêm video mới</h2>
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
                <label className="block mb-2 font-semibold text-gray-700">URL Video *</label>
                <input
                  type="url"
                  value={formData.url}
                  onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                  className="input-field"
                  placeholder="https://www.youtube.com/watch?v=... hoặc link video trực tiếp"
                  required
                />
                <p className="text-sm text-gray-500 mt-1">Hỗ trợ YouTube, Vimeo hoặc link video trực tiếp</p>
              </div>

              <div>
                <label className="block mb-2 font-semibold text-gray-700">Thumbnail URL (tùy chọn)</label>
                <input
                  type="url"
                  value={formData.thumbnail}
                  onChange={(e) => setFormData({ ...formData, thumbnail: e.target.value })}
                  className="input-field"
                  placeholder="https://..."
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
                      url: '',
                      thumbnail: '',
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
                  {submitting ? 'Đang lưu...' : 'Thêm video'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

