'use client'

import { useEffect, useState } from 'react'

interface Question {
  id: string
  content: string
  type: string
  options: string
  correctAnswers: string
  category: string | null
  createdAt: string
}

export default function QuestionsPage() {
  const [questions, setQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [fileType, setFileType] = useState<'excel' | 'pdf'>('excel')
  const [category, setCategory] = useState<string>('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  
  // Danh sách lĩnh vực mẫu
  const categories = [
    'Toán học',
    'Vật lý',
    'Hóa học',
    'Sinh học',
    'Văn học',
    'Lịch sử',
    'Địa lý',
    'Tiếng Anh',
    'Tin học',
    'GDCD',
    'Khác'
  ]


  const fetchQuestions = async () => {
    try {
      const url = selectedCategory === 'all' 
        ? '/api/questions' 
        : `/api/questions?category=${encodeURIComponent(selectedCategory)}`
      const res = await fetch(url)
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

  useEffect(() => {
    fetchQuestions()
  }, [selectedCategory])

  const handleImport = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) {
      alert('Vui lòng chọn file')
      return
    }

    if (!category.trim()) {
      alert('Vui lòng chọn lĩnh vực câu hỏi')
      return
    }

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('type', fileType)
      formData.append('category', category)

      const res = await fetch('/api/questions/import', {
        method: 'POST',
        body: formData,
      })

      const data = await res.json()
      if (data.success) {
        alert(data.message)
        setFile(null)
        setCategory('')
        fetchQuestions()
      } else {
        alert('Lỗi: ' + data.error)
      }
    } catch (error) {
      alert('Lỗi khi import file')
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc muốn xóa câu hỏi này?')) return

    try {
      const res = await fetch(`/api/questions?id=${id}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        fetchQuestions()
      } else {
        alert('Lỗi khi xóa câu hỏi')
      }
    } catch (error) {
      alert('Lỗi khi xóa câu hỏi')
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Ngân hàng câu hỏi</h1>
        <p className="text-gray-600">Quản lý và import câu hỏi từ file Excel hoặc PDF</p>
      </div>

      {/* Form import */}
      <div className="card mb-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold">Import câu hỏi</h2>
        </div>
        <form onSubmit={handleImport} className="space-y-6">
          <div className="flex items-center gap-4 mb-4">
            <button
              type="button"
              onClick={() => {
                window.open('/api/questions/template', '_blank')
              }}
              className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Tải file Excel mẫu
            </button>
          </div>

          <div>
            <label className="block mb-2 font-semibold text-gray-700">Lĩnh vực câu hỏi *:</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="input-field"
              required
            >
              <option value="">-- Chọn lĩnh vực --</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            <p className="text-sm text-gray-500 mt-1">Lĩnh vực này sẽ được áp dụng cho tất cả câu hỏi trong file import</p>
          </div>

          <div>
            <label className="block mb-2 font-semibold text-gray-700">Loại file:</label>
            <select
              value={fileType}
              onChange={(e) => setFileType(e.target.value as 'excel' | 'pdf')}
              className="input-field"
            >
              <option value="excel">Excel (.xlsx, .xls)</option>
              <option value="pdf">PDF (.pdf)</option>
            </select>
          </div>

          <div>
            <label className="block mb-2 font-semibold text-gray-700">Chọn file:</label>
            <input
              type="file"
              accept={fileType === 'excel' ? '.xlsx,.xls' : '.pdf'}
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="input-field"
              required
            />
            <div className="mt-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-800 font-medium mb-1">📋 Format yêu cầu:</p>
              <p className="text-sm text-blue-700">
                {fileType === 'excel' 
                  ? 'Excel: Câu hỏi | Đáp án 1 | Đáp án 2 | ... | Đáp án đúng (A,B) | Loại (single/multiple) | Lĩnh vực (tùy chọn)'
                  : 'PDF: Câu hỏi\nA. Đáp án 1\nB. Đáp án 2\nĐáp án: A'}
              </p>
              <p className="text-xs text-blue-600 mt-2">
                💡 Lưu ý: Nếu file Excel có cột "Lĩnh vực", giá trị trong file sẽ được ưu tiên. Nếu không có, sẽ dùng lĩnh vực bạn chọn ở trên.
              </p>
            </div>
          </div>

          <button
            type="submit"
            disabled={uploading || !file}
            className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {uploading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Đang import...
              </span>
            ) : (
              'Import câu hỏi'
            )}
          </button>
        </form>
      </div>

      {/* Danh sách câu hỏi */}
      <div className="card">
        <div className="flex items-center justify-between mb-6 pb-4 border-b">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Danh sách câu hỏi</h2>
            <p className="text-gray-600 mt-1">Tổng số: <span className="font-semibold text-blue-600">{questions.length}</span> câu hỏi</p>
          </div>
          <div>
            <label className="block mb-2 text-sm font-medium text-gray-700">Lọc theo lĩnh vực:</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="input-field"
            >
              <option value="all">Tất cả</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="py-12 text-center">
            <svg className="animate-spin h-8 w-8 text-blue-600 mx-auto mb-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="text-gray-600">Đang tải...</p>
          </div>
        ) : questions.length === 0 ? (
          <div className="py-12 text-center">
            <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-gray-500 text-lg mb-2">Chưa có câu hỏi nào</p>
            <p className="text-gray-400">Hãy import câu hỏi từ file Excel hoặc PDF</p>
          </div>
        ) : (
          <div className="space-y-4">
            {questions.map((q, index) => {
              let options: string[] = []
              let correctAnswers: string[] = []
              try {
                const parsedOptions = JSON.parse(q.options)
                options = Array.isArray(parsedOptions) ? parsedOptions : []
                const parsedAnswers = JSON.parse(q.correctAnswers)
                correctAnswers = Array.isArray(parsedAnswers) ? parsedAnswers : []
              } catch {
                options = []
                correctAnswers = []
              }
              
              return (
                <div key={q.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1">
                      <div className="flex items-start gap-3 mb-4">
                        <span className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold">
                          {index + 1}
                        </span>
                        <p className="font-semibold text-lg text-gray-900 flex-1">{q.content}</p>
                      </div>
                      <div className="ml-11 space-y-2 mb-4">
                        {options.map((opt: string, idx: number) => {
                          const isCorrect = correctAnswers.includes(opt.charAt(0))
                          return (
                            <div key={idx} className={`flex items-center gap-2 p-2 rounded ${isCorrect ? 'bg-green-50 border border-green-200' : 'bg-gray-50'}`}>
                              <span className="font-medium text-gray-700">{opt}</span>
                              {isCorrect && (
                                <span className="ml-auto bg-green-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">✓</span>
                              )}
                            </div>
                          )
                        })}
                      </div>
                      <div className="ml-11 flex items-center gap-3">
                        {q.category && (
                          <span className="px-3 py-1 rounded-full text-sm font-medium bg-indigo-100 text-indigo-700">
                            {q.category}
                          </span>
                        )}
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                          q.type === 'single' 
                            ? 'bg-blue-100 text-blue-700' 
                            : 'bg-purple-100 text-purple-700'
                        }`}>
                          {q.type === 'single' ? 'Chọn 1 đáp án' : 'Chọn nhiều đáp án'}
                        </span>
                        <span className="text-sm text-gray-500">
                          {new Date(q.createdAt).toLocaleDateString('vi-VN', { 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric' 
                          })}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDelete(q.id)}
                      className="flex-shrink-0 text-red-600 hover:text-red-700 hover:bg-red-50 p-2 rounded-lg transition-colors"
                      title="Xóa câu hỏi"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

