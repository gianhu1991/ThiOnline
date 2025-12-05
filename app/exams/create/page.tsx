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
  const [categories, setCategories] = useState<string[]>([])
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [availableQuestionCount, setAvailableQuestionCount] = useState(0)
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
      const questionsData = Array.isArray(data) ? data : []
      setQuestions(questionsData)
      
      // Lấy danh sách các category duy nhất
      const uniqueCategories = Array.from(
        new Set(questionsData.map((q: any) => q.category).filter((cat: string | null) => cat))
      ) as string[]
      setCategories(uniqueCategories.sort())
      
      // Đếm số câu hỏi có category
      setAvailableQuestionCount(questionsData.length)
    } catch (error) {
      console.error('Error fetching questions:', error)
      setQuestions([])
      setCategories([])
    } finally {
      setLoading(false)
    }
  }

  // Cập nhật số câu hỏi khả dụng khi chọn category
  useEffect(() => {
    if (selectedCategories.length === 0) {
      setAvailableQuestionCount(questions.length)
    } else {
      const filtered = questions.filter((q: any) => 
        q.category && selectedCategories.includes(q.category)
      )
      setAvailableQuestionCount(filtered.length)
    }
  }, [selectedCategories, questions])

  const onSubmit = async (data: any) => {
    setSubmitting(true)
    try {
      // datetime-local input trả về local time (không có timezone)
      // Cần convert sang ISO string để gửi lên server
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

      const res = await fetch('/api/exams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: data.title,
          description: data.description,
          questionCount: parseInt(data.questionCount),
          timeLimit: parseInt(data.timeLimit),
          startDate: convertToISO(data.startDate),
          endDate: convertToISO(data.endDate),
          shuffleQuestions: data.shuffleQuestions === 'true',
          shuffleAnswers: data.shuffleAnswers === 'true',
          requireAllQuestions: data.requireAllQuestions === 'true',
          maxAttempts: parseInt(data.maxAttempts) || 1,
          categories: selectedCategories.length > 0 ? selectedCategories : null, // null = lấy từ tất cả category
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
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white z-50">
        <div className="text-center">
          <svg className="animate-spin h-8 w-8 text-blue-600 mx-auto mb-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-gray-600">Đang tải...</p>
        </div>
      </div>
    )
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

        {categories.length > 0 && (
          <div>
            <label className="block mb-2 font-medium">Lĩnh vực câu hỏi</label>
            <div className="space-y-2">
              <div className="flex items-center gap-2 mb-2">
                <input
                  type="checkbox"
                  id="selectAllCategories"
                  checked={selectedCategories.length === categories.length && categories.length > 0}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedCategories(categories)
                    } else {
                      setSelectedCategories([])
                    }
                  }}
                  className="mr-2"
                />
                <label htmlFor="selectAllCategories" className="text-sm font-medium cursor-pointer">
                  Chọn tất cả ({categories.length} lĩnh vực)
                </label>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-48 overflow-y-auto border rounded p-3">
                {categories.map((category) => (
                  <div key={category} className="flex items-center">
                    <input
                      type="checkbox"
                      id={`category-${category}`}
                      checked={selectedCategories.includes(category)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedCategories([...selectedCategories, category])
                        } else {
                          setSelectedCategories(selectedCategories.filter(c => c !== category))
                        }
                      }}
                      className="mr-2"
                    />
                    <label htmlFor={`category-${category}`} className="text-sm cursor-pointer">
                      {category}
                    </label>
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-500">
                {selectedCategories.length === 0 
                  ? `Tất cả lĩnh vực (${availableQuestionCount} câu hỏi)`
                  : `Đã chọn ${selectedCategories.length} lĩnh vực (${availableQuestionCount} câu hỏi)`}
              </p>
            </div>
          </div>
        )}

        <div>
          <label className="block mb-2 font-medium">
            Số lượng câu hỏi * (Tối đa: {availableQuestionCount})
          </label>
          <input
            type="number"
            {...register('questionCount', {
              required: 'Vui lòng nhập số lượng câu hỏi',
              min: { value: 1, message: 'Tối thiểu 1 câu hỏi' },
              max: { value: availableQuestionCount, message: `Tối đa ${availableQuestionCount} câu hỏi` },
            })}
            className="border rounded px-4 py-2 w-full"
            min="1"
            max={availableQuestionCount}
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

          <div className="flex items-center">
            <input
              type="checkbox"
              id="requireAllQuestions"
              {...register('requireAllQuestions')}
              value="true"
              className="mr-2"
            />
            <label htmlFor="requireAllQuestions" className="font-medium">
              Bắt buộc làm hết câu hỏi mới được nộp bài
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

