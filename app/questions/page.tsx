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
  const [categories, setCategories] = useState<string[]>([])
  
  // Add question state
  const [showAddForm, setShowAddForm] = useState(false)
  const [newContent, setNewContent] = useState('')
  const [newOptions, setNewOptions] = useState<string[]>(['A. ', 'B. '])
  const [newCorrectAnswers, setNewCorrectAnswers] = useState<string[]>([])
  const [newType, setNewType] = useState<'single' | 'multiple'>('single')
  const [newCategory, setNewCategory] = useState<string>('')
  const [addLoading, setAddLoading] = useState(false)

  // Edit question state
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null)
  const [editContent, setEditContent] = useState('')
  const [editOptions, setEditOptions] = useState<string[]>([])
  const [editCorrectAnswers, setEditCorrectAnswers] = useState<string[]>([])
  const [editType, setEditType] = useState<'single' | 'multiple'>('single')
  const [editCategory, setEditCategory] = useState<string>('')
  const [editLoading, setEditLoading] = useState(false)


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

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/categories')
      const data = await res.json()
      const categoryNames = Array.isArray(data) 
        ? data.map((cat: any) => cat.name)
        : []
      setCategories(categoryNames)
    } catch (error) {
      console.error('Error fetching categories:', error)
      // Fallback to default categories if API fails
      setCategories([
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
      ])
    }
  }

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

  const handleDeleteAll = async () => {
    if (questions.length === 0) {
      alert('Không có câu hỏi nào để xóa')
      return
    }

    const confirmMessage = `Bạn có chắc muốn xóa TẤT CẢ ${questions.length} câu hỏi?\n\nHành động này không thể hoàn tác!\n\nNhập "XÓA TẤT CẢ" để xác nhận:`
    const userInput = prompt(confirmMessage)
    
    if (userInput !== 'XÓA TẤT CẢ') {
      alert('Đã hủy xóa. Bạn cần nhập đúng "XÓA TẤT CẢ" để xác nhận.')
      return
    }

    try {
      const res = await fetch('/api/questions?all=true', {
        method: 'DELETE',
      })

      const data = await res.json()

      if (res.ok && data.success) {
        alert(`Đã xóa thành công ${data.count} câu hỏi`)
        fetchQuestions()
      } else {
        alert('Lỗi: ' + (data.error || 'Không thể xóa câu hỏi'))
      }
    } catch (error) {
      alert('Lỗi khi xóa câu hỏi')
    }
  }

  const handleEdit = (question: Question) => {
    let options: string[] = []
    let correctAnswers: string[] = []
    try {
      const parsedOptions = JSON.parse(question.options)
      options = Array.isArray(parsedOptions) ? parsedOptions : []
      const parsedAnswers = JSON.parse(question.correctAnswers)
      correctAnswers = Array.isArray(parsedAnswers) ? parsedAnswers : []
    } catch {
      options = []
      correctAnswers = []
    }

    setEditingQuestion(question)
    setEditContent(question.content)
    setEditOptions(options)
    setEditCorrectAnswers(correctAnswers)
    setEditType(question.type === 'multiple' ? 'multiple' : 'single')
    setEditCategory(question.category || '')
  }

  const handleCancelEdit = () => {
    setEditingQuestion(null)
    setEditContent('')
    setEditOptions([])
    setEditCorrectAnswers([])
    setEditType('single')
    setEditCategory('')
  }

  const handleUpdateOption = (index: number, value: string) => {
    const newOptions = [...editOptions]
    const label = String.fromCharCode(65 + index) // A, B, C, D...
    // Giữ nguyên label nếu đã có, nếu không thì thêm label mới
    if (value.startsWith(label + '.')) {
      newOptions[index] = value
    } else {
      // Lấy phần sau label hiện tại (nếu có)
      const currentOption = newOptions[index]
      const currentLabel = currentOption.charAt(0)
      const currentText = currentOption.substring(currentOption.indexOf('.') + 1).trim()
      // Nếu value không có label, thêm label mới
      if (!value.match(/^[A-Z]\.\s/)) {
        newOptions[index] = `${label}. ${value.replace(/^[A-Z]\.\s*/, '')}`
      } else {
        newOptions[index] = value
      }
    }
    setEditOptions(newOptions)
  }

  const handleAddOption = () => {
    const label = String.fromCharCode(65 + editOptions.length) // A, B, C, D...
    setEditOptions([...editOptions, `${label}. `])
  }

  const handleRemoveOption = (index: number) => {
    const optionLabel = String.fromCharCode(65 + index)
    const newOptions = editOptions.filter((_, i) => i !== index)
    // Cập nhật lại label cho các option còn lại
    const updatedOptions = newOptions.map((opt, i) => {
      const newLabel = String.fromCharCode(65 + i)
      const text = opt.substring(opt.indexOf('.') + 1).trim()
      return `${newLabel}. ${text}`
    })
    setEditOptions(updatedOptions)
    // Remove correct answer if it was for this option
    setEditCorrectAnswers(editCorrectAnswers.filter(a => a !== optionLabel))
    // Cập nhật lại label của các correct answers còn lại
    const updatedCorrectAnswers = editCorrectAnswers
      .filter(a => a !== optionLabel)
      .map(a => {
        const oldIndex = a.charCodeAt(0) - 65
        if (oldIndex > index) {
          return String.fromCharCode(65 + oldIndex - 1)
        }
        return a
      })
    setEditCorrectAnswers(updatedCorrectAnswers)
  }

  const handleToggleCorrectAnswer = (optionLabel: string) => {
    if (editType === 'single') {
      setEditCorrectAnswers([optionLabel])
    } else {
      if (editCorrectAnswers.includes(optionLabel)) {
        setEditCorrectAnswers(editCorrectAnswers.filter(a => a !== optionLabel))
      } else {
        setEditCorrectAnswers([...editCorrectAnswers, optionLabel])
      }
    }
  }

  const handleAddQuestion = async () => {
    if (!newContent.trim()) {
      alert('Vui lòng nhập nội dung câu hỏi')
      return
    }

    if (newOptions.length < 2) {
      alert('Cần ít nhất 2 đáp án')
      return
    }

    if (newCorrectAnswers.length === 0) {
      alert('Vui lòng chọn ít nhất 1 đáp án đúng')
      return
    }

    setAddLoading(true)
    try {
      const res = await fetch('/api/questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: newContent,
          options: newOptions,
          correctAnswers: newCorrectAnswers,
          type: newType,
          category: newCategory || null,
        }),
      })

      const data = await res.json()

      if (res.ok && data.success) {
        alert('Thêm câu hỏi thành công!')
        setShowAddForm(false)
        setNewContent('')
        setNewOptions(['A. ', 'B. '])
        setNewCorrectAnswers([])
        setNewType('single')
        setNewCategory('')
        fetchQuestions()
      } else {
        alert('Lỗi: ' + (data.error || 'Không thể thêm câu hỏi'))
      }
    } catch (error) {
      alert('Lỗi khi thêm câu hỏi')
    } finally {
      setAddLoading(false)
    }
  }

  const handleAddNewOption = () => {
    const label = String.fromCharCode(65 + newOptions.length)
    setNewOptions([...newOptions, `${label}. `])
  }

  const handleRemoveNewOption = (index: number) => {
    const optionLabel = String.fromCharCode(65 + index)
    const updatedOptions = newOptions.filter((_, i) => i !== index)
    const updatedWithLabels = updatedOptions.map((opt, i) => {
      const newLabel = String.fromCharCode(65 + i)
      const text = opt.substring(opt.indexOf('.') + 1).trim()
      return `${newLabel}. ${text}`
    })
    setNewOptions(updatedWithLabels)
    setNewCorrectAnswers(newCorrectAnswers.filter(a => a !== optionLabel))
    const updatedCorrectAnswers = newCorrectAnswers
      .filter(a => a !== optionLabel)
      .map(a => {
        const oldIndex = a.charCodeAt(0) - 65
        if (oldIndex > index) {
          return String.fromCharCode(65 + oldIndex - 1)
        }
        return a
      })
    setNewCorrectAnswers(updatedCorrectAnswers)
  }

  const handleUpdateNewOption = (index: number, value: string) => {
    const newOptionsList = [...newOptions]
    const label = String.fromCharCode(65 + index)
    if (value.startsWith(label + '.')) {
      newOptionsList[index] = value
    } else {
      if (!value.match(/^[A-Z]\.\s/)) {
        newOptionsList[index] = `${label}. ${value.replace(/^[A-Z]\.\s*/, '')}`
      } else {
        newOptionsList[index] = value
      }
    }
    setNewOptions(newOptionsList)
  }

  const handleToggleNewCorrectAnswer = (optionLabel: string) => {
    if (newType === 'single') {
      setNewCorrectAnswers([optionLabel])
    } else {
      if (newCorrectAnswers.includes(optionLabel)) {
        setNewCorrectAnswers(newCorrectAnswers.filter(a => a !== optionLabel))
      } else {
        setNewCorrectAnswers([...newCorrectAnswers, optionLabel])
      }
    }
  }

  const handleSaveEdit = async () => {
    if (!editContent.trim()) {
      alert('Vui lòng nhập nội dung câu hỏi')
      return
    }

    if (editOptions.length < 2) {
      alert('Cần ít nhất 2 đáp án')
      return
    }

    if (editCorrectAnswers.length === 0) {
      alert('Vui lòng chọn ít nhất 1 đáp án đúng')
      return
    }

    setEditLoading(true)
    try {
      const res = await fetch(`/api/questions?id=${editingQuestion!.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: editContent,
          options: editOptions,
          correctAnswers: editCorrectAnswers,
          type: editType,
          category: editCategory || null,
        }),
      })

      const data = await res.json()

      if (res.ok && data.success) {
        alert('Cập nhật câu hỏi thành công!')
        handleCancelEdit()
        fetchQuestions()
      } else {
        alert('Lỗi: ' + (data.error || 'Không thể cập nhật câu hỏi'))
      }
    } catch (error) {
      alert('Lỗi khi cập nhật câu hỏi')
    } finally {
      setEditLoading(false)
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

          <div className="flex gap-4">
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
            <button
              type="button"
              onClick={() => setShowAddForm(true)}
              className="border-2 border-red-600 text-red-600 px-6 py-3 rounded-lg font-semibold hover:bg-red-50 transition-colors"
            >
              Thêm câu hỏi
            </button>
          </div>
        </form>
      </div>

      {/* Danh sách câu hỏi */}
      <div className="card">
        <div className="flex items-center justify-between mb-6 pb-4 border-b">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Danh sách câu hỏi</h2>
            <p className="text-gray-600 mt-1">Tổng số: <span className="font-semibold text-blue-600">{questions.length}</span> câu hỏi</p>
          </div>
          <div className="flex items-end gap-4">
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
            {questions.length > 0 && (
              <button
                onClick={handleDeleteAll}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2 whitespace-nowrap"
                title="Xóa tất cả câu hỏi"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Xóa tất cả
              </button>
            )}
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
                    <div className="flex-shrink-0 flex gap-2">
                      <button
                        onClick={() => handleEdit(q)}
                        className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 p-2 rounded-lg transition-colors"
                        title="Sửa câu hỏi"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDelete(q.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 p-2 rounded-lg transition-colors"
                        title="Xóa câu hỏi"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
            
            {/* Edit Modal */}
            {editingQuestion && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
                  <div className="p-6">
                    <div className="flex justify-between items-center mb-6">
                      <h2 className="text-2xl font-bold">Sửa câu hỏi</h2>
                      <button
                        onClick={handleCancelEdit}
                        className="text-gray-500 hover:text-gray-700"
                      >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block mb-2 font-semibold text-gray-700">Nội dung câu hỏi *</label>
                        <textarea
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          className="input-field"
                          rows={3}
                          required
                        />
                      </div>

                      <div>
                        <label className="block mb-2 font-semibold text-gray-700">Loại câu hỏi *</label>
                        <select
                          value={editType}
                          onChange={(e) => {
                            setEditType(e.target.value as 'single' | 'multiple')
                            if (e.target.value === 'single' && editCorrectAnswers.length > 1) {
                              setEditCorrectAnswers([editCorrectAnswers[0]])
                            }
                          }}
                          className="input-field"
                        >
                          <option value="single">Chọn 1 đáp án</option>
                          <option value="multiple">Chọn nhiều đáp án</option>
                        </select>
                      </div>

                      <div>
                        <label className="block mb-2 font-semibold text-gray-700">Lĩnh vực</label>
                        <select
                          value={editCategory}
                          onChange={(e) => setEditCategory(e.target.value)}
                          className="input-field"
                        >
                          <option value="">-- Chọn lĩnh vực --</option>
                          {categories.map((cat) => (
                            <option key={cat} value={cat}>{cat}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <label className="font-semibold text-gray-700">Đáp án *</label>
                          <button
                            type="button"
                            onClick={handleAddOption}
                            className="text-sm text-blue-600 hover:text-blue-700"
                          >
                            + Thêm đáp án
                          </button>
                        </div>
                        <div className="space-y-2">
                          {editOptions.map((opt, idx) => {
                            const optionLabel = opt.charAt(0)
                            const isCorrect = editCorrectAnswers.includes(optionLabel)
                            return (
                              <div key={idx} className="flex items-center gap-2">
                                <input
                                  type={editType === 'single' ? 'radio' : 'checkbox'}
                                  checked={isCorrect}
                                  onChange={() => handleToggleCorrectAnswer(optionLabel)}
                                  className="mt-1"
                                />
                                <input
                                  type="text"
                                  value={opt}
                                  onChange={(e) => handleUpdateOption(idx, e.target.value)}
                                  className="input-field flex-1"
                                  placeholder={`Đáp án ${optionLabel}`}
                                />
                                {editOptions.length > 2 && (
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveOption(idx)}
                                    className="text-red-600 hover:text-red-700 p-2"
                                  >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                  </button>
                                )}
                              </div>
                            )
                          })}
                        </div>
                        {editOptions.length < 2 && (
                          <p className="text-sm text-red-600 mt-1">Cần ít nhất 2 đáp án</p>
                        )}
                      </div>

                      <div className="flex gap-4 pt-4">
                        <button
                          onClick={handleSaveEdit}
                          disabled={editLoading || editOptions.length < 2 || editCorrectAnswers.length === 0}
                          className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {editLoading ? 'Đang lưu...' : 'Lưu thay đổi'}
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          className="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600"
                        >
                          Hủy
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

