'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
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


export default function VideoDetailPage() {
  const params = useParams()
  const router = useRouter()
  const videoId = params.id as string
  const [video, setVideo] = useState<Video | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchVideo()
  }, [videoId])

  const fetchVideo = async () => {
    try {
      const res = await fetch(`/api/videos/${videoId}`)
      const data = await res.json()
      if (res.ok && data) {
        setVideo(data)
      } else {
        alert('Không tìm thấy video')
        router.push('/videos')
      }
    } catch (error) {
      console.error('Error fetching video:', error)
      alert('Lỗi khi tải video')
      router.push('/videos')
    } finally {
      setLoading(false)
    }
  }

  const getYouTubeEmbedUrl = (url: string | null | undefined) => {
    if (!url) {
      return ''
    }
    
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/
    const match = url.match(regExp)
    const videoId = match && match[2].length === 11 ? match[2] : null
    
    if (videoId) {
      return `https://www.youtube.com/embed/${videoId}`
    }
    
    return url
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col items-center justify-center py-20">
          <svg className="animate-spin h-12 w-12 text-blue-600 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-gray-600 text-lg">Đang tải dữ liệu...</p>
        </div>
      </div>
    )
  }

  if (!video) {
    return null
  }

  const embedUrl = getYouTubeEmbedUrl(video.url)
  const isYouTube = video.url ? (video.url.includes('youtube.com') || video.url.includes('youtu.be')) : false

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <Link href="/videos" className="text-blue-600 hover:text-blue-700 mb-6 inline-flex items-center gap-2 font-medium">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Quay lại danh sách video
      </Link>

      <div className="grid lg:grid-cols-3 gap-4">
        {/* Video Player - Main Content */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            {/* Video Player - Giới hạn kích thước tối đa */}
            <div className="bg-black max-w-full" style={{ maxHeight: '70vh' }}>
              {isYouTube ? (
                <div className="relative" style={{ paddingBottom: '56.25%', maxHeight: '70vh' }}>
                  <div className="absolute inset-0">
                    <iframe
                      className="w-full h-full"
                      src={embedUrl}
                      title={video.title}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowFullScreen
                      style={{ maxHeight: '70vh' }}
                    ></iframe>
                  </div>
                </div>
              ) : video.url ? (
                <video
                  controls
                  className="w-full"
                  src={video.url}
                  poster={video.thumbnail || undefined}
                  style={{ maxHeight: '70vh', objectFit: 'contain' }}
                >
                  Trình duyệt của bạn không hỗ trợ video.
                </video>
              ) : (
                <div className="flex items-center justify-center h-64 text-white">
                  <p>Video không khả dụng</p>
                </div>
              )}
            </div>

            {/* Video Info */}
            <div className="p-4">
              <h1 className="text-xl font-bold text-gray-900 mb-2">{video.title}</h1>
              
              {/* Stats Bar */}
              <div className="flex items-center gap-4 text-xs text-gray-600 mb-3 pb-3 border-b">
                <div className="flex items-center gap-1.5">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  <span className="font-medium">{video.viewCount.toLocaleString('vi-VN')} lượt xem</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span>{new Date(video.createdAt).toLocaleDateString('vi-VN', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}</span>
                </div>
                {video.category && (
                  <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                    {video.category}
                  </span>
                )}
              </div>

              {/* Description */}
              {video.description && (
                <div className="bg-gray-50 rounded-md p-3 mb-3">
                  <h2 className="text-sm font-semibold mb-1.5 text-gray-900">Mô tả</h2>
                  <p className="text-sm text-gray-700 whitespace-pre-line leading-relaxed">{video.description}</p>
                </div>
              )}

              {/* Upload Info */}
              {video.uploadedBy && (
                <div className="pt-2 border-t">
                  <div className="flex items-center gap-1.5 text-xs text-gray-600">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <span><span className="font-medium">Người upload:</span> {video.uploadedBy}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar - Related Info */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-md p-4 sticky top-4">
            <h3 className="text-base font-bold mb-3 text-gray-900">Thông tin video</h3>
            <div className="space-y-3">
              <div>
                <div className="text-xs text-gray-500 mb-1">Lượt xem</div>
                <div className="text-base font-semibold text-gray-900">{video.viewCount.toLocaleString('vi-VN')}</div>
              </div>
              {video.category && (
                <div>
                  <div className="text-xs text-gray-500 mb-1">Danh mục</div>
                  <div className="text-base font-semibold text-gray-900">{video.category}</div>
                </div>
              )}
              <div>
                <div className="text-xs text-gray-500 mb-1">Ngày đăng</div>
                <div className="text-sm font-semibold text-gray-900">
                  {new Date(video.createdAt).toLocaleDateString('vi-VN', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

