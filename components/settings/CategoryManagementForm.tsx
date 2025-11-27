'use client'

import { useState, useEffect } from 'react'

interface Category {
  id: string
  name: string
  createdAt: string
}

export default function CategoryManagementForm() {
  const [categories, setCategories] = useState<Category[]>([])
  const [newCategoryName, setNewCategoryName] = useState('')
  const [categoryLoading, setCategoryLoading] = useState(false)
  const [categoryError, setCategoryError] = useState('')
  const [categorySuccess, setCategorySuccess] = useState('')

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/categories')
      const data = await res.json()
      setCategories(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Error fetching categories:', error)
      setCategories([])
    }
  }

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault()
    setCategoryError('')
    setCategorySuccess('')

    if (!newCategoryName.trim()) {
      setCategoryError('Tên lĩnh vực không được để trống')
      return
    }

    setCategoryLoading(true)
    try {
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newCategoryName }),
      })

      const data = await res.json()

      if (res.ok && data.success) {
        setCategorySuccess('Thêm lĩnh vực thành công!')
        setNewCategoryName('')
        fetchCategories()
      } else {
        setCategoryError(data.error || 'Thêm lĩnh vực thất bại')
      }
    } catch (error) {
      setCategoryError('Lỗi khi thêm lĩnh vực')
    } finally {
      setCategoryLoading(false)
    }
  }

  const handleDeleteCategory = async (id: string, name: string) => {
    if (!confirm(`Bạn có chắc muốn xóa lĩnh vực "${name}"?`)) return

    try {
      const res = await fetch(`/api/categories?id=${id}`, {
        method: 'DELETE',
      })

      const data = await res.json()

      if (res.ok && data.success) {
        setCategorySuccess('Xóa lĩnh vực thành công!')
        fetchCategories()
      } else {
        setCategoryError(data.error || 'Xóa lĩnh vực thất bại')
      }
    } catch (error) {
      setCategoryError('Lỗi khi xóa lĩnh vực')
    }
  }

  return (
    <div className="card">
      <h2 className="text-2xl font-bold mb-6">Quản lý lĩnh vực</h2>

      <form onSubmit={handleAddCategory} className="space-y-4 mb-6">
        <div>
          <label className="block mb-2 font-semibold text-gray-700">Thêm lĩnh vực mới</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              className="input-field flex-1"
              placeholder="Nhập tên lĩnh vực"
              required
              disabled={categoryLoading}
            />
            <button
              type="submit"
              disabled={categoryLoading}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
            >
              {categoryLoading ? 'Đang thêm...' : 'Thêm'}
            </button>
          </div>
        </div>

        {categoryError && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            {categoryError}
          </div>
        )}

        {categorySuccess && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
            {categorySuccess}
          </div>
        )}
      </form>

      <div>
        <h3 className="font-semibold text-gray-700 mb-3">Danh sách lĩnh vực ({categories.length})</h3>
        {categories.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>Chưa có lĩnh vực nào</p>
            <p className="text-sm mt-1">Thêm lĩnh vực mới ở trên</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {categories.map((category) => (
              <div
                key={category.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <span className="font-medium text-gray-900">{category.name}</span>
                <button
                  onClick={() => handleDeleteCategory(category.id, category.name)}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50 p-2 rounded-lg transition-colors"
                  title="Xóa lĩnh vực"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

