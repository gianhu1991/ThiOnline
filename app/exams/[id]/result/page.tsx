'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'

export default function ExamResultPage() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const score = parseFloat(searchParams.get('score') || '0')
  const correct = parseInt(searchParams.get('correct') || '0')
  const total = parseInt(searchParams.get('total') || '0')

  const percentage = (score / 10) * 100
  const getGrade = () => {
    if (score >= 8.5) return { text: 'Xuất sắc', color: 'text-green-600' }
    if (score >= 7) return { text: 'Khá', color: 'text-blue-600' }
    if (score >= 5.5) return { text: 'Trung bình', color: 'text-yellow-600' }
    return { text: 'Yếu', color: 'text-red-600' }
  }

  const grade = getGrade()

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white p-8 rounded-lg shadow-lg text-center">
        <h1 className="text-3xl font-bold mb-6">Kết quả bài thi</h1>

        <div className="mb-6">
          <div className="text-6xl font-bold text-blue-600 mb-2">{score.toFixed(1)}</div>
          <div className="text-2xl font-semibold mb-1">Điểm số</div>
          <div className={`text-xl font-medium ${grade.color}`}>{grade.text}</div>
        </div>

        <div className="bg-gray-100 p-6 rounded-lg mb-6">
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <div className="text-3xl font-bold text-green-600">{correct}</div>
              <div className="text-gray-600">Câu đúng</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-gray-700">{total - correct}</div>
              <div className="text-gray-600">Câu sai</div>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t">
            <div className="text-sm text-gray-600">Tổng số câu hỏi: {total}</div>
            <div className="text-sm text-gray-600">Tỷ lệ đúng: {percentage.toFixed(1)}%</div>
          </div>
        </div>

        <div className="flex gap-4 justify-center">
          <Link
            href="/exams"
            className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
          >
            Về danh sách bài thi
          </Link>
          <button
            onClick={() => router.back()}
            className="bg-gray-500 text-white px-6 py-2 rounded hover:bg-gray-600"
          >
            Quay lại
          </button>
        </div>
      </div>
    </div>
  )
}

