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

  const getYouTubeEmbedUrl = (url: string) => {
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
      <div className="container mx-auto px-4 py-8 text-center">
        <svg className="animate-spin h-8 w-8 text-blue-600 mx-auto mb-4" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <p className="text-gray-600">Đang tải video...</p>
      </div>
    )
  }

  if (!video) {
    return null
  }

  const embedUrl = getYouTubeEmbedUrl(video.url)
  const isYouTube = video.url.includes('youtube.com') || video.url.includes('youtu.be')

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Link href="/videos" className="text-blue-600 hover:text-blue-700 mb-4 inline-block">
        ← Quay lại danh sách video
      </Link>

      <div className="card">
        <h1 className="text-3xl font-bold mb-4">{video.title}</h1>
        
        {video.category && (
          <span className="inline-block px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm mb-4">
            {video.category}
          </span>
        )}

        <div className="mb-6">
          {isYouTube ? (
            <div className="relative pb-[56.25%] h-0 overflow-hidden rounded-lg">
              <iframe
                className="absolute top-0 left-0 w-full h-full"
                src={embedUrl}
                title={video.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            </div>
          ) : (
            <video
              controls
              className="w-full rounded-lg"
              src={video.url}
            >
              Trình duyệt của bạn không hỗ trợ video.
            </video>
          )}
        </div>

        {video.description && (
          <div className="mb-6">
            <h2 className="text-xl font-bold mb-2">Mô tả</h2>
            <p className="text-gray-700 whitespace-pre-line">{video.description}</p>
          </div>
        )}

        <div className="flex items-center justify-between text-sm text-gray-600 border-t pt-4">
          <div>
            <span className="font-medium">Lượt xem:</span> {video.viewCount}
          </div>
          {video.uploadedBy && (
            <div>
              <span className="font-medium">Người upload:</span> {video.uploadedBy}
            </div>
          )}
          <div>
            <span className="font-medium">Ngày đăng:</span>{' '}
            {new Date(video.createdAt).toLocaleDateString('vi-VN')}
          </div>
        </div>
      </div>
    </div>
  )
}

