'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { format } from 'date-fns'
import { vi } from 'date-fns/locale'

interface Exam {
  id: string
  title: string
  description: string | null
  questionCount: number
  timeLimit: number
  startDate: string
  endDate: string
  isActive: boolean
  isPublic: boolean
  maxAttempts: number
  createdAt: string
  _count?: {
    examResults: number
  }
}


export default function MyExamsPage() {
  const [exams, setExams] = useState<Exam[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchMyExams()
  }, [])

  const fetchMyExams = async () => {
    try {
      setError(null)
      const timestamp = Date.now()
      const random = Math.random()
      const res = await fetch(`/api/exams/my-exams?t=${timestamp}&r=${random}`, {
        cache: 'no-store',
        credentials: 'include',
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
          'Pragma': 'no-cache',
        },
      })
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: 'Lỗi không xác định' }))
        throw new Error(errorData.error || `Lỗi ${res.status}: ${res.statusText}`)
      }
      
      const data = await res.json()
      
      // Đảm bảo data là array
      if (Array.isArray(data)) {
        // Normalize data: đảm bảo mỗi exam đều có _count
        const normalizedExams = data
          .filter(exam => exam != null) // Loại bỏ null/undefined
          .map(exam => ({
            ...exam,
            _count: exam._count || { examResults: 0 }
          }))
        setExams(normalizedExams)
      } else {
        console.error('API trả về dữ liệu không phải array:', data)
        setExams([])
        setError('Dữ liệu không hợp lệ từ server')
      }
    } catch (error: any) {
      console.error('Error fetching my exams:', error)
      setExams([])
      setError(error.message || 'Lỗi khi tải danh sách bài thi')
    } finally {
      setLoading(false)
    }
  }

  const getStatus = (exam: Exam) => {
    const now = new Date()
    const start = new Date(exam.startDate)
    const end = new Date(exam.endDate)

    if (now < start) return { text: 'Chưa mở', color: 'bg-gray-500' }
    if (now > end) return { text: 'Đã đóng', color: 'bg-red-500' }
    return { text: 'Đang mở', color: 'bg-green-500' }
  }

  const getCurrentTime = () => {
    return new Date().toLocaleString('vi-VN', {
      timeZone: 'Asia/Ho_Chi_Minh',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Bài thi của tôi</h1>
          <p className="text-sm text-gray-500 mt-1">Thời gian hiện tại: {getCurrentTime()}</p>
        </div>
      </div>

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
      ) : error ? (
        <div className="bg-red-50 border border-red-200 p-8 rounded-lg shadow-lg text-center">
          <p className="text-red-600 font-semibold mb-2">Lỗi: {error}</p>
          <button
            onClick={fetchMyExams}
            className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 mt-4"
          >
            Thử lại
          </button>
        </div>
      ) : exams.length === 0 ? (
        <div className="bg-white p-8 rounded-lg shadow-lg text-center text-gray-500">
          Bạn chưa có bài thi nào được gán. Vui lòng liên hệ admin để được gán bài thi.
        </div>
      ) : (
        <div className="space-y-4">
          {Array.isArray(exams) && exams.map((exam) => {
            const status = getStatus(exam)
            return (
              <div key={exam.id} className="bg-white p-6 rounded-lg shadow-lg">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h2 className="text-2xl font-semibold">{exam.title}</h2>
                      <span className={`${status.color} text-white text-xs px-2 py-1 rounded`}>
                        {status.text}
                      </span>
                    </div>
                    {exam.description && (
                      <p className="text-gray-600 mb-4">{exam.description}</p>
                    )}
                    <div className="grid md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Số câu hỏi:</span> {exam.questionCount}
                      </div>
                      <div>
                        <span className="font-medium">Thời gian:</span> {exam.timeLimit} phút
                      </div>
                      <div>
                        <span className="font-medium">Thời gian mở:</span>{' '}
                        {new Date(exam.startDate).toLocaleString('vi-VN', {
                          timeZone: 'Asia/Ho_Chi_Minh',
                          year: 'numeric',
                          month: '2-digit',
                          day: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                      <div>
                        <span className="font-medium">Thời gian đóng:</span>{' '}
                        {new Date(exam.endDate).toLocaleString('vi-VN', {
                          timeZone: 'Asia/Ho_Chi_Minh',
                          year: 'numeric',
                          month: '2-digit',
                          day: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                      <div>
                        <span className="font-medium">Số lần làm:</span> {exam.maxAttempts}
                      </div>
                      <div>
                        <span className="font-medium">Đã có:</span> {exam._count?.examResults || 0} kết quả
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 ml-4">
                    <Link
                      href={`/exams/${exam.id}/take`}
                      className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 text-center"
                    >
                      Làm bài
                    </Link>
                    <Link
                      href={`/exams/${exam.id}/results`}
                      className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 text-center"
                    >
                      Xem kết quả
                    </Link>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

