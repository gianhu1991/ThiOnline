'use client'

import { useState, useEffect } from 'react'


export default function DebugDBPage() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api/debug-db')
        const json = await res.json()
        setData(json)
      } catch (error: any) {
        setData({ error: error.message })
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Đang kiểm tra...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="max-w-2xl w-full bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-2xl font-bold mb-6">Kiểm tra DATABASE_URL</h1>
        
        {data?.error ? (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            <strong>Lỗi:</strong> {data.error}
          </div>
        ) : (
          <div className="space-y-4">
            <div className={`p-4 rounded-lg ${data?.isValid ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
              <p className={`font-semibold ${data?.isValid ? 'text-green-800' : 'text-red-800'}`}>
                {data?.message}
              </p>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600 mb-2">Thông tin DATABASE_URL:</p>
              <ul className="space-y-2 text-sm">
                <li><strong>Tồn tại:</strong> {data?.hasUrl ? '✅ Có' : '❌ Không'}</li>
                <li><strong>Format đúng:</strong> {data?.isValid ? '✅ Có' : '❌ Không'}</li>
                <li><strong>Bắt đầu với postgresql://:</strong> {data?.startsWithPostgresql ? '✅ Có' : '❌ Không'}</li>
                <li><strong>Bắt đầu với postgres://:</strong> {data?.startsWithPostgres ? '✅ Có' : '❌ Không'}</li>
                <li><strong>Độ dài:</strong> {data?.length} ký tự</li>
                <li><strong>Preview:</strong> <code className="bg-gray-200 px-2 py-1 rounded">{data?.preview}</code></li>
              </ul>
            </div>

            {!data?.isValid && (
              <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
                <p className="font-semibold text-yellow-800 mb-2">Cách sửa:</p>
                <ol className="list-decimal list-inside space-y-1 text-sm text-yellow-700">
                  <li>Vào Vercel Dashboard → Project → Settings → Environment Variables</li>
                  <li>Tìm biến <code className="bg-yellow-100 px-1 rounded">DATABASE_URL</code></li>
                  <li>Đảm bảo giá trị bắt đầu bằng <code className="bg-yellow-100 px-1 rounded">postgresql://</code> hoặc <code className="bg-yellow-100 px-1 rounded">postgres://</code></li>
                  <li>Giá trị đúng: <code className="bg-yellow-100 px-1 rounded">postgresql://postgres:Nhuchi%400105@db.fqgnechgzwckonjyqifq.supabase.co:5432/postgres</code></li>
                  <li>Save và Redeploy project</li>
                </ol>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

