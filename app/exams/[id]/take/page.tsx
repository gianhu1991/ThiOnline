'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'

interface Question {
  id: string
  content: string
  type: string
  options: string
  correctAnswers: string
}

interface ExamData {
  exam: {
    id: string
    title: string
    description: string | null
    timeLimit: number
    questionCount: number
  }
  questions: Question[]
  attemptNumber: number
}

export default function TakeExamPage() {
  const router = useRouter()
  const params = useParams()
  const examId = params.id as string
  const [examData, setExamData] = useState<ExamData | null>(null)
  const [answers, setAnswers] = useState<Record<string, string[]>>({})
  const [timeLeft, setTimeLeft] = useState(0) // giây
  const [submitting, setSubmitting] = useState(false)
  const [studentName, setStudentName] = useState('')
  const [studentId, setStudentId] = useState('')

  useEffect(() => {
    startExam()
  }, [])

  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000)
      return () => clearTimeout(timer)
    } else if (timeLeft === 0 && examData) {
      handleSubmit()
    }
  }, [timeLeft])

  const startExam = async () => {
    try {
      const res = await fetch(`/api/exams/${examId}/start`, {
        method: 'POST',
      })

      const data = await res.json()
      if (res.ok) {
        setExamData(data)
        setTimeLeft(data.exam.timeLimit * 60) // Chuyển phút sang giây
      } else {
        alert('Lỗi: ' + data.error)
        router.push('/exams')
      }
    } catch (error) {
      alert('Lỗi khi bắt đầu bài thi')
      router.push('/exams')
    }
  }

  const handleAnswerChange = (questionId: string, option: string, checked: boolean) => {
    setAnswers((prev) => {
      const current = prev[questionId] || []
      if (checked) {
        return { ...prev, [questionId]: [...current, option] }
      } else {
        return { ...prev, [questionId]: current.filter((a) => a !== option) }
      }
    })
  }

  const handleSubmit = async () => {
    if (!studentName.trim()) {
      alert('Vui lòng nhập tên của bạn')
      return
    }

    setSubmitting(true)
    try {
      const timeSpent = examData!.exam.timeLimit * 60 - timeLeft

      const res = await fetch(`/api/exams/${examId}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          answers,
          timeSpent,
          studentName,
          studentId: studentId || null,
        }),
      })

      const data = await res.json()
      if (data.success) {
        router.push(`/exams/${examId}/result?score=${data.result.score}&correct=${data.result.correctAnswers}&total=${data.result.totalQuestions}`)
      } else {
        alert('Lỗi: ' + data.error)
      }
    } catch (error) {
      alert('Lỗi khi nộp bài')
    } finally {
      setSubmitting(false)
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  if (!examData) {
    return <div className="text-center py-8">Đang tải...</div>
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white p-6 rounded-lg shadow-lg mb-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-2xl font-bold">{examData.exam.title}</h1>
            {examData.exam.description && (
              <p className="text-gray-600 mt-1">{examData.exam.description}</p>
            )}
          </div>
          <div className="text-right">
            <div className={`text-2xl font-bold ${timeLeft < 300 ? 'text-red-600' : 'text-blue-600'}`}>
              {formatTime(timeLeft)}
            </div>
            <div className="text-sm text-gray-500">Thời gian còn lại</div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block mb-2 font-medium">Họ và tên *</label>
            <input
              type="text"
              value={studentName}
              onChange={(e) => setStudentName(e.target.value)}
              className="border rounded px-4 py-2 w-full"
              placeholder="Nhập họ và tên"
              required
            />
          </div>
          <div>
            <label className="block mb-2 font-medium">Mã số sinh viên</label>
            <input
              type="text"
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              className="border rounded px-4 py-2 w-full"
              placeholder="Nhập mã số sinh viên (nếu có)"
            />
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {Array.isArray(examData.questions) && examData.questions.map((q, index) => {
          let options: string[] = []
          try {
            const parsed = JSON.parse(q.options)
            options = Array.isArray(parsed) ? parsed : []
          } catch {
            options = []
          }
          const isMultiple = q.type === 'multiple'
          const selectedAnswers = answers[q.id] || []

          return (
            <div key={q.id} className="bg-white p-6 rounded-lg shadow-lg">
              <div className="flex items-start mb-4">
                <span className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center mr-3 flex-shrink-0">
                  {index + 1}
                </span>
                <p className="font-medium text-lg flex-1">{q.content}</p>
              </div>

              <div className="ml-11 space-y-2">
                {Array.isArray(options) && options.map((option: string, optIndex: number) => {
                  const optionLabel = option.charAt(0) // A, B, C, D...
                  const isChecked = selectedAnswers.includes(optionLabel)

                  return (
                    <label
                      key={optIndex}
                      className="flex items-start p-3 border rounded hover:bg-gray-50 cursor-pointer"
                    >
                      <input
                        type={isMultiple ? 'checkbox' : 'radio'}
                        name={q.id}
                        value={optionLabel}
                        checked={isChecked}
                        onChange={(e) =>
                          handleAnswerChange(q.id, optionLabel, e.target.checked)
                        }
                        className="mt-1 mr-3"
                      />
                      <span className="flex-1">{option}</span>
                    </label>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      <div className="mt-6 flex justify-center gap-4">
        <button
          onClick={handleSubmit}
          disabled={submitting || !studentName.trim()}
          className="bg-green-600 text-white px-8 py-3 rounded-lg hover:bg-green-700 disabled:bg-gray-400 text-lg font-semibold"
        >
          {submitting ? 'Đang nộp bài...' : 'Nộp bài'}
        </button>
      </div>
    </div>
  )
}

