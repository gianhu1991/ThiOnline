'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useForm } from 'react-hook-form'

interface Exam {
  id: string
  title: string
  description: string | null
  questionCount: number
  timeLimit: number
  startDate: string
  endDate: string
  shuffleQuestions: boolean
  shuffleAnswers: boolean
  maxAttempts: number
}

export default function EditExamPage() {
  const router = useRouter()
  const params = useParams()
  const examId = params.id as string
  const [exam, setExam] = useState<Exam | null>(null)
  const [questions, setQuestions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm()

  useEffect(() => {
    fetchExam()
    fetchQuestions()
  }, [])

  const fetchExam = async () => {
    try {
      const res = await fetch(`/api/exams/${examId}`)
      const data = await res.json()
      if (res.ok && data) {
        setExam(data)
        // Set form values
        setValue('title', data.title)
        setValue('description', data.description || '')
        setValue('questionCount', data.questionCount)
        setValue('timeLimit', data.timeLimit)
        // Format dates for datetime-local input (local time, not UTC)
        const startDate = new Date(data.startDate)
        const endDate = new Date(data.endDate)
        
        // Convert to local time for datetime-local input
        const formatLocalDateTime = (date: Date) => {
          const year = date.getFullYear()
          const month = String(date.getMonth() + 1).padStart(2, '0')
          const day = String(date.getDate()).padStart(2, '0')
          const hours = String(date.getHours()).padStart(2, '0')
          const minutes = String(date.getMinutes()).padStart(2, '0')
          return `${year}-${month}-${day}T${hours}:${minutes}`
        }
        
        setValue('startDate', formatLocalDateTime(startDate))
        setValue('endDate', formatLocalDateTime(endDate))
        setValue('maxAttempts', data.maxAttempts)
        setValue('shuffleQuestions', data.shuffleQuestions ? 'true' : '')
        setValue('shuffleAnswers', data.shuffleAnswers ? 'true' : '')
      } else {
        alert('Không tìm thấy bài thi')
        router.push('/exams')
      }
    } catch (error) {
      console.error('Error fetching exam:', error)
      alert('Lỗi khi tải thông tin bài thi')
      router.push('/exams')
    } finally {
      setLoading(false)
    }
  }

  const fetchQuestions = async () => {
    try {
      const res = await fetch('/api/questions')
      const data = await res.json()
      setQuestions(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Error fetching questions:', error)
      setQuestions([])
    }
  }

  const onSubmit = async (data: any) => {
    setSubmitting(true)
    try {
      // datetime-local input trả về local time (không có timezone)
      // Cần convert sang ISO string để gửi lên server
      // Format: "2025-11-26T14:20" -> "2025-11-26T14:20:00" (local time)
      const convertToISO = (dateTimeString: string) => {
        // Thêm seconds nếu chưa có
        if (dateTimeString.length === 16) {
          dateTimeString += ':00'
        }
        // Tạo Date object từ local time
        const localDate = new Date(dateTimeString)
        // Trả về ISO string (sẽ có timezone offset)
        return localDate.toISOString()
      }

      // Validate dates
      const startDateISO = convertToISO(data.startDate)
      const endDateISO = convertToISO(data.endDate)
      const startDate = new Date(startDateISO)
      const endDate = new Date(endDateISO)
      
      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        alert('Thời gian không hợp lệ. Vui lòng kiểm tra lại.')
        setSubmitting(false)
        return
      }
      
      if (startDate >= endDate) {
        alert('Thời gian mở phải nhỏ hơn thời gian đóng')
        setSubmitting(false)
        return
      }

      const res = await fetch(`/api/exams/${examId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: data.title,
          description: data.description,
          questionCount: parseInt(data.questionCount),
          timeLimit: parseInt(data.timeLimit),
          startDate: startDateISO,
          endDate: endDateISO,
          shuffleQuestions: data.shuffleQuestions === 'true',
          shuffleAnswers: data.shuffleAnswers === 'true',
          maxAttempts: parseInt(data.maxAttempts) || 1,
        }),
      })

      const result = await res.json()
      if (res.ok && result.success) {
        alert('Cập nhật bài thi thành công!')
        router.push('/exams')
        router.refresh()
      } else {
        alert('Lỗi: ' + (result.error || 'Không thể cập nhật bài thi'))
      }
    } catch (error: any) {
      console.error('Update exam error:', error)
      alert('Lỗi khi cập nhật bài thi: ' + (error.message || 'Unknown error'))
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return <div className="text-center py-8">Đang tải...</div>
  }

  if (!exam) {
    return null
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Chỉnh sửa bài thi</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="bg-white p-6 rounded-lg shadow-lg space-y-6">
        <div>
          <label className="block mb-2 font-medium">Tiêu đề bài thi *</label>
          <input
            type="text"
            {...register('title', { required: 'Vui lòng nhập tiêu đề' })}
            className="border rounded px-4 py-2 w-full"
            placeholder="Ví dụ: Kiểm tra giữa kỳ môn Toán"
          />
          {errors.title && (
            <p className="text-red-500 text-sm mt-1">{errors.title.message as string}</p>
          )}
        </div>

        <div>
          <label className="block mb-2 font-medium">Mô tả</label>
          <textarea
            {...register('description')}
            className="border rounded px-4 py-2 w-full"
            rows={3}
            placeholder="Mô tả về bài thi..."
          />
        </div>

        <div>
          <label className="block mb-2 font-medium">
            Số lượng câu hỏi * (Tối đa: {questions.length})
          </label>
          <input
            type="number"
            {...register('questionCount', {
              required: 'Vui lòng nhập số lượng câu hỏi',
              min: { value: 1, message: 'Tối thiểu 1 câu hỏi' },
              max: { value: questions.length, message: `Tối đa ${questions.length} câu hỏi` },
            })}
            className="border rounded px-4 py-2 w-full"
            min="1"
            max={questions.length}
          />
          {errors.questionCount && (
            <p className="text-red-500 text-sm mt-1">{errors.questionCount.message as string}</p>
          )}
        </div>

        <div>
          <label className="block mb-2 font-medium">Thời gian làm bài (phút) *</label>
          <input
            type="number"
            {...register('timeLimit', {
              required: 'Vui lòng nhập thời gian làm bài',
              min: { value: 1, message: 'Tối thiểu 1 phút' },
            })}
            className="border rounded px-4 py-2 w-full"
            min="1"
          />
          {errors.timeLimit && (
            <p className="text-red-500 text-sm mt-1">{errors.timeLimit.message as string}</p>
          )}
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block mb-2 font-medium">Thời gian mở bài thi *</label>
            <input
              type="datetime-local"
              {...register('startDate', { required: 'Vui lòng chọn thời gian mở' })}
              className="border rounded px-4 py-2 w-full"
            />
            {errors.startDate && (
              <p className="text-red-500 text-sm mt-1">{errors.startDate.message as string}</p>
            )}
          </div>

          <div>
            <label className="block mb-2 font-medium">Thời gian đóng bài thi *</label>
            <input
              type="datetime-local"
              {...register('endDate', { required: 'Vui lòng chọn thời gian đóng' })}
              className="border rounded px-4 py-2 w-full"
            />
            {errors.endDate && (
              <p className="text-red-500 text-sm mt-1">{errors.endDate.message as string}</p>
            )}
          </div>
        </div>

        <div>
          <label className="block mb-2 font-medium">Số lần làm bài tối đa *</label>
          <input
            type="number"
            {...register('maxAttempts', {
              required: 'Vui lòng nhập số lần làm bài',
              min: { value: 1, message: 'Tối thiểu 1 lần' },
            })}
            className="border rounded px-4 py-2 w-full"
            min="1"
          />
          {errors.maxAttempts && (
            <p className="text-red-500 text-sm mt-1">{errors.maxAttempts.message as string}</p>
          )}
        </div>

        <div className="space-y-3">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="shuffleQuestions"
              {...register('shuffleQuestions')}
              value="true"
              className="mr-2"
            />
            <label htmlFor="shuffleQuestions" className="font-medium">
              Trộn câu hỏi (Mỗi lần làm bài sẽ có thứ tự câu hỏi khác nhau)
            </label>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="shuffleAnswers"
              {...register('shuffleAnswers')}
              value="true"
              className="mr-2"
            />
            <label htmlFor="shuffleAnswers" className="font-medium">
              Trộn đáp án (Mỗi lần làm bài sẽ có thứ tự đáp án khác nhau)
            </label>
          </div>
        </div>

        <div className="flex gap-4">
          <button
            type="submit"
            disabled={submitting}
            className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 disabled:bg-gray-400"
          >
            {submitting ? 'Đang lưu...' : 'Lưu thay đổi'}
          </button>
          <button
            type="button"
            onClick={() => router.push('/exams')}
            className="bg-gray-500 text-white px-6 py-2 rounded hover:bg-gray-600"
          >
            Hủy
          </button>
        </div>
      </form>
    </div>
  )
}

