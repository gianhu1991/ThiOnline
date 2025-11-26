'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function InitAdminPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const handleInit = async () => {
    setLoading(true)
    setMessage('')
    setError('')

    try {
      const res = await fetch('/api/init-admin', {
        method: 'GET',
      })

      const data = await res.json()

      if (res.ok && data.success) {
        setMessage('✅ Tạo user admin thành công! Username: admin, Password: Bdnb@999')
        setTimeout(() => {
          router.push('/login')
        }, 2000)
      } else {
        const errorMsg = data.error || 'Lỗi khi tạo user admin'
        // Kiểm tra nếu là lỗi kết nối database
        if (errorMsg.includes('Can\'t reach database') || errorMsg.includes('database server')) {
          setError(
            '❌ Không thể kết nối database. Vui lòng kiểm tra:\n' +
            '1. DATABASE_URL trong Vercel Environment Variables\n' +
            '2. Thử dùng Connection Pooling URL (port 6543) thay vì Direct (port 5432)\n' +
            '3. Kiểm tra database server có đang chạy không'
          )
        } else {
          setError(errorMsg + (data.details ? '\n' + data.details : ''))
        }
      }
    } catch (error: any) {
      setError('Lỗi: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-md w-full mx-4">
        <div className="card">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Khởi tạo Admin</h1>
            <p className="text-gray-600">Tạo user admin để đăng nhập vào hệ thống</p>
          </div>

          <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <strong>Lưu ý:</strong> Chỉ chạy lần đầu tiên. Nếu user admin đã tồn tại, sẽ không tạo lại.
              </p>
            </div>

            {message && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
                {message}
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            <button
              onClick={handleInit}
              disabled={loading}
              className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Đang tạo...
                </span>
              ) : (
                'Tạo User Admin'
              )}
            </button>

            <div className="text-center text-sm text-gray-500">
              <p>Thông tin đăng nhập mặc định:</p>
              <p className="font-semibold">Username: admin</p>
              <p className="font-semibold">Password: Bdnb@999</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

