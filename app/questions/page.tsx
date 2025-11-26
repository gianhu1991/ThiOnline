'use client'

import { useEffect, useState } from 'react'

interface Question {
  id: string
  content: string
  type: string
  options: string
  correctAnswers: string
  createdAt: string
}

export default function QuestionsPage() {
  const [questions, setQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [fileType, setFileType] = useState<'excel' | 'pdf'>('excel')

  useEffect(() => {
    fetchQuestions()
  }, [])

  const fetchQuestions = async () => {
    try {
      const res = await fetch('/api/questions')
      const data = await res.json()
      setQuestions(data)
    } catch (error) {
      console.error('Error fetching questions:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleImport = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) {
      alert('Vui lòng chọn file')
      return
    }

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('type', fileType)

      const res = await fetch('/api/questions/import', {
        method: 'POST',
        body: formData,
      })

      const data = await res.json()
      if (data.success) {
        alert(data.message)
        setFile(null)
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
    <div className="max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Ngân hàng câu hỏi</h1>

      {/* Form import */}
      <div className="bg-white p-6 rounded-lg shadow-lg mb-6">
        <h2 className="text-xl font-semibold mb-4">Import câu hỏi</h2>
        <form onSubmit={handleImport} className="space-y-4">
          <div>
            <label className="block mb-2 font-medium">Loại file:</label>
            <select
              value={fileType}
              onChange={(e) => setFileType(e.target.value as 'excel' | 'pdf')}
              className="border rounded px-4 py-2 w-full"
            >
              <option value="excel">Excel (.xlsx, .xls)</option>
              <option value="pdf">PDF (.pdf)</option>
            </select>
          </div>

          <div>
            <label className="block mb-2 font-medium">Chọn file:</label>
            <input
              type="file"
              accept={fileType === 'excel' ? '.xlsx,.xls' : '.pdf'}
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="border rounded px-4 py-2 w-full"
              required
            />
            <p className="text-sm text-gray-500 mt-2">
              {fileType === 'excel' 
                ? 'Format Excel: Câu hỏi | Đáp án 1 | Đáp án 2 | ... | Đáp án đúng (A,B) | Loại (single/multiple)'
                : 'Format PDF: Câu hỏi\nA. Đáp án 1\nB. Đáp án 2\nĐáp án: A'}
            </p>
          </div>

          <button
            type="submit"
            disabled={uploading || !file}
            className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:bg-gray-400"
          >
            {uploading ? 'Đang import...' : 'Import câu hỏi'}
          </button>
        </form>
      </div>

      {/* Danh sách câu hỏi */}
      <div className="bg-white rounded-lg shadow-lg">
        <div className="p-4 border-b">
          <h2 className="text-xl font-semibold">
            Tổng số câu hỏi: {questions.length}
          </h2>
        </div>

        {loading ? (
          <div className="p-8 text-center">Đang tải...</div>
        ) : questions.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            Chưa có câu hỏi nào. Hãy import câu hỏi từ file Excel hoặc PDF.
          </div>
        ) : (
          <div className="divide-y">
            {questions.map((q) => {
              const options = JSON.parse(q.options)
              const correctAnswers = JSON.parse(q.correctAnswers)
              
              return (
                <div key={q.id} className="p-6 hover:bg-gray-50">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <p className="font-medium mb-2">{q.content}</p>
                      <div className="space-y-1 mb-2">
                        {options.map((opt: string, idx: number) => (
                          <div key={idx} className="text-sm text-gray-600">
                            {opt}
                            {correctAnswers.includes(opt.charAt(0)) && (
                              <span className="ml-2 text-green-600 font-semibold">✓</span>
                            )}
                          </div>
                        ))}
                      </div>
                      <div className="flex gap-2 text-sm">
                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                          {q.type === 'single' ? 'Chọn 1 đáp án' : 'Chọn nhiều đáp án'}
                        </span>
                        <span className="text-gray-500">
                          {new Date(q.createdAt).toLocaleDateString('vi-VN')}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDelete(q.id)}
                      className="ml-4 text-red-600 hover:text-red-800"
                    >
                      Xóa
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

