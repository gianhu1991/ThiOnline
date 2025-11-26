'use client'

import { useSearchParams, useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { useEffect, useState } from 'react'

interface QuestionDetail {
  id: string
  content: string
  type: string
  options: string[]
  correctAnswers: string[]
  userAnswers: string[]
  isCorrect: boolean
  order: number
}

interface ResultDetail {
  id: string
  score: number
  totalQuestions: number
  correctAnswers: number
  attemptNumber: number
  timeSpent: number
  completedAt: string
}

interface ExamInfo {
  id: string
  title: string
  maxAttempts: number
}

export default function ExamResultPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const params = useParams()
  const examId = params.id as string
  const resultId = searchParams.get('resultId')

  const [loading, setLoading] = useState(true)
  const [result, setResult] = useState<ResultDetail | null>(null)
  const [exam, setExam] = useState<ExamInfo | null>(null)
  const [questions, setQuestions] = useState<QuestionDetail[]>([])
  const [showAnswers, setShowAnswers] = useState(false)
  const [canRetake, setCanRetake] = useState(false)

  useEffect(() => {
    if (resultId) {
      fetchResultDetails()
      checkCanRetake()
    } else {
      // Fallback cho URL cũ (không có resultId)
      const score = parseFloat(searchParams.get('score') || '0')
      const correct = parseInt(searchParams.get('correct') || '0')
      const total = parseInt(searchParams.get('total') || '0')
      setResult({
        id: '',
        score,
        totalQuestions: total,
        correctAnswers: correct,
        attemptNumber: 0,
        timeSpent: 0,
        completedAt: new Date().toISOString(),
      })
      setLoading(false)
    }
  }, [resultId])

  const fetchResultDetails = async () => {
    try {
      const res = await fetch(`/api/exams/${examId}/results/${resultId}`)
      const data = await res.json()
      if (res.ok && data) {
        setResult(data.result)
        setExam(data.exam)
        setQuestions(Array.isArray(data.questions) ? data.questions : [])
      } else {
        alert('Lỗi: ' + (data.error || 'Không thể tải kết quả'))
      }
    } catch (error) {
      console.error('Error fetching result:', error)
      alert('Lỗi khi tải kết quả')
    } finally {
      setLoading(false)
    }
  }

  const checkCanRetake = async () => {
    try {
      const res = await fetch(`/api/exams/${examId}`)
      const data = await res.json()
      if (res.ok && data) {
        // Kiểm tra số lần đã làm
        const resultsRes = await fetch(`/api/exams/${examId}/results`)
        const resultsData = await resultsRes.json()
        const attemptCount = Array.isArray(resultsData) ? resultsData.length : 0
        setCanRetake(attemptCount < data.maxAttempts)
      }
    } catch (error) {
      console.error('Error checking retake:', error)
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins} phút ${secs} giây`
  }

  const percentage = result ? (result.score / 10) * 100 : 0
  const getGrade = () => {
    if (!result) return { text: '', color: '' }
    if (result.score >= 8.5) return { text: 'Xuất sắc', color: 'text-green-600' }
    if (result.score >= 7) return { text: 'Khá', color: 'text-blue-600' }
    if (result.score >= 5.5) return { text: 'Trung bình', color: 'text-yellow-600' }
    return { text: 'Yếu', color: 'text-red-600' }
  }

  const grade = getGrade()

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto text-center py-8">
        <div className="animate-spin h-8 w-8 text-blue-600 mx-auto mb-4"></div>
        <p>Đang tải kết quả...</p>
      </div>
    )
  }

  if (!result) {
    return (
      <div className="max-w-2xl mx-auto text-center py-8">
        <p className="text-red-600">Không tìm thấy kết quả</p>
        <Link href="/exams" className="text-blue-600 hover:underline mt-4 inline-block">
          Về danh sách bài thi
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="bg-white p-8 rounded-lg shadow-lg">
        <h1 className="text-3xl font-bold mb-6 text-center">Kết quả bài thi</h1>
        {exam && <h2 className="text-xl font-semibold mb-6 text-center text-gray-700">{exam.title}</h2>}

        {/* Thông tin tổng quan */}
        <div className="text-center mb-8">
          <div className="text-6xl font-bold text-blue-600 mb-2">{result.score.toFixed(1)}</div>
          <div className="text-2xl font-semibold mb-1">Điểm số</div>
          <div className={`text-xl font-medium ${grade.color}`}>{grade.text}</div>
        </div>

        <div className="bg-gray-100 p-6 rounded-lg mb-6">
          <div className="grid grid-cols-2 gap-4 text-center mb-4">
            <div>
              <div className="text-3xl font-bold text-green-600">{result.correctAnswers}</div>
              <div className="text-gray-600">Câu đúng</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-red-600">
                {result.totalQuestions - result.correctAnswers}
              </div>
              <div className="text-gray-600">Câu sai</div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 text-center pt-4 border-t">
            <div>
              <div className="text-lg font-semibold text-gray-700">{result.totalQuestions}</div>
              <div className="text-sm text-gray-600">Tổng số câu hỏi</div>
            </div>
            <div>
              <div className="text-lg font-semibold text-gray-700">{percentage.toFixed(1)}%</div>
              <div className="text-sm text-gray-600">Tỷ lệ đúng</div>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t text-center">
            <div className="text-sm text-gray-600">
              Lần làm bài: {result.attemptNumber} / {exam?.maxAttempts || 'N/A'}
            </div>
            <div className="text-sm text-gray-600 mt-1">Thời gian làm bài: {formatTime(result.timeSpent)}</div>
          </div>
        </div>

        {/* Nút xem đáp án */}
        <div className="text-center mb-6">
          <button
            onClick={() => setShowAnswers(!showAnswers)}
            className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 font-semibold"
          >
            {showAnswers ? 'Ẩn đáp án' : 'Xem chi tiết đáp án'}
          </button>
        </div>

        {/* Chi tiết đáp án */}
        {showAnswers && questions.length > 0 && (
          <div className="mt-6 space-y-6">
            <h3 className="text-2xl font-bold mb-4">Chi tiết đáp án</h3>
            {questions.map((q, index) => (
              <div
                key={q.id}
                className={`border-2 rounded-lg p-6 ${
                  q.isCorrect ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50'
                }`}
              >
                <div className="flex items-start mb-4">
                  <span
                    className={`rounded-full w-8 h-8 flex items-center justify-center mr-3 flex-shrink-0 font-bold text-white ${
                      q.isCorrect ? 'bg-green-500' : 'bg-red-500'
                    }`}
                  >
                    {index + 1}
                  </span>
                  <p className="font-semibold text-lg flex-1">{q.content}</p>
                  <span
                    className={`ml-4 px-3 py-1 rounded-full text-sm font-semibold ${
                      q.isCorrect
                        ? 'bg-green-200 text-green-800'
                        : 'bg-red-200 text-red-800'
                    }`}
                  >
                    {q.isCorrect ? '✓ Đúng' : '✗ Sai'}
                  </span>
                </div>

                <div className="ml-11 space-y-2">
                  {q.options.map((option: string, optIndex: number) => {
                    const optionLabel = option.charAt(0) // A, B, C, D...
                    const isUserSelected = q.userAnswers.includes(optionLabel)
                    const isCorrect = q.correctAnswers.includes(optionLabel)
                    const optionText = option.substring(option.indexOf('.') + 1).trim()

                    let bgColor = 'bg-gray-50'
                    let borderColor = 'border-gray-200'
                    let textColor = 'text-gray-700'

                    if (isCorrect) {
                      bgColor = 'bg-green-100'
                      borderColor = 'border-green-300'
                      textColor = 'text-green-800'
                    }
                    if (isUserSelected && !isCorrect) {
                      bgColor = 'bg-red-100'
                      borderColor = 'border-red-300'
                      textColor = 'text-red-800'
                    }
                    if (isUserSelected && isCorrect) {
                      bgColor = 'bg-green-200'
                      borderColor = 'border-green-400'
                      textColor = 'text-green-900'
                    }

                    return (
                      <div
                        key={optIndex}
                        className={`border-2 ${borderColor} ${bgColor} ${textColor} p-3 rounded-lg flex items-center gap-2`}
                      >
                        <span className="font-bold">{optionLabel}.</span>
                        <span className="flex-1">{optionText}</span>
                        {isCorrect && (
                          <span className="bg-green-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
                            ✓
                          </span>
                        )}
                        {isUserSelected && !isCorrect && (
                          <span className="bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
                            ✗
                          </span>
                        )}
                      </div>
                    )
                  })}
                </div>

                <div className="ml-11 mt-4 text-sm">
                  <div className="text-gray-600">
                    <span className="font-semibold">Đáp án bạn chọn:</span>{' '}
                    {q.userAnswers.length > 0 ? q.userAnswers.join(', ') : '(Không chọn)'}
                  </div>
                  <div className="text-gray-600 mt-1">
                    <span className="font-semibold">Đáp án đúng:</span>{' '}
                    {q.correctAnswers.join(', ')}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Các nút hành động */}
        <div className="flex gap-4 justify-center mt-8">
          {canRetake && (
            <Link
              href={`/exams/${examId}/take`}
              className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 font-semibold"
            >
              Làm lại bài thi
            </Link>
          )}
          <Link
            href="/exams"
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-semibold"
          >
            Về danh sách bài thi
          </Link>
        </div>
      </div>
    </div>
  )
}

