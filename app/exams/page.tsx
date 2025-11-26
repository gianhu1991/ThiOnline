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
  maxAttempts: number
  createdAt: string
  _count: {
    examResults: number
  }
}

export default function ExamsPage() {
  const [exams, setExams] = useState<Exam[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchExams()
  }, [])

  const fetchExams = async () => {
    try {
      const res = await fetch('/api/exams')
      const data = await res.json()
      // Đảm bảo data là array
      setExams(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Error fetching exams:', error)
      setExams([])
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc muốn xóa bài thi này?')) return

    try {
      const res = await fetch(`/api/exams/${id}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        fetchExams()
      } else {
        alert('Lỗi khi xóa bài thi')
      }
    } catch (error) {
      alert('Lỗi khi xóa bài thi')
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

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Quản lý bài thi</h1>
        <Link
          href="/exams/create"
          className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700"
        >
          Tạo bài thi mới
        </Link>
      </div>

      {loading ? (
        <div className="text-center py-8">Đang tải...</div>
      ) : exams.length === 0 ? (
        <div className="bg-white p-8 rounded-lg shadow-lg text-center text-gray-500">
          Chưa có bài thi nào. Hãy tạo bài thi mới.
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
                        {format(new Date(exam.startDate), 'dd/MM/yyyy HH:mm', { locale: vi })}
                      </div>
                      <div>
                        <span className="font-medium">Thời gian đóng:</span>{' '}
                        {format(new Date(exam.endDate), 'dd/MM/yyyy HH:mm', { locale: vi })}
                      </div>
                      <div>
                        <span className="font-medium">Số lần làm:</span> {exam.maxAttempts}
                      </div>
                      <div>
                        <span className="font-medium">Đã có:</span> {exam._count.examResults} kết quả
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
                    <button
                      onClick={() => handleDelete(exam.id)}
                      className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
                    >
                      Xóa
                    </button>
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

