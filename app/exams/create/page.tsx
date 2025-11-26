'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'

interface Question {
  id: string
}

export default function CreateExamPage() {
  const router = useRouter()
  const [questions, setQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm()

  useEffect(() => {
    fetchQuestions()
  }, [])

  const fetchQuestions = async () => {
    try {
      const res = await fetch('/api/questions')
      const data = await res.json()
      // Đảm bảo data là array
      setQuestions(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Error fetching questions:', error)
      setQuestions([])
    } finally {
      setLoading(false)
    }
  }

  const onSubmit = async (data: any) => {
    setSubmitting(true)
    try {
      const res = await fetch('/api/exams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: data.title,
          description: data.description,
          questionCount: parseInt(data.questionCount),
          timeLimit: parseInt(data.timeLimit),
          startDate: data.startDate,
          endDate: data.endDate,
          shuffleQuestions: data.shuffleQuestions === 'true',
          shuffleAnswers: data.shuffleAnswers === 'true',
          maxAttempts: parseInt(data.maxAttempts) || 1,
        }),
      })

      const result = await res.json()
      if (res.ok) {
        alert('Tạo bài thi thành công!')
        router.push('/exams')
      } else {
        alert('Lỗi: ' + result.error)
      }
    } catch (error) {
      alert('Lỗi khi tạo bài thi')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return <div className="text-center py-8">Đang tải...</div>
  }

  if (questions.length === 0) {
    return (
      <div className="max-w-2xl mx-auto bg-white p-8 rounded-lg shadow-lg text-center">
        <p className="text-gray-600 mb-4">
          Ngân hàng câu hỏi đang trống. Vui lòng import câu hỏi trước.
        </p>
        <a href="/questions" className="text-blue-600 hover:underline">
          Đi đến trang ngân hàng câu hỏi
        </a>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Tạo bài thi mới</h1>

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
            defaultValue="1"
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
            {submitting ? 'Đang tạo...' : 'Tạo bài thi'}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="bg-gray-500 text-white px-6 py-2 rounded hover:bg-gray-600"
          >
            Hủy
          </button>
        </div>
      </form>
    </div>
  )
}

