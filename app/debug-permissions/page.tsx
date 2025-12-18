'use client'

import { useEffect, useState } from 'react'

export default function DebugPermissionsPage() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/debug/permissions', {
      credentials: 'include'
    })
      .then(res => res.json())
      .then(data => {
        setData(data)
        setLoading(false)
      })
      .catch(err => {
        setError(err.message)
        setLoading(false)
      })
  }, [])

  if (loading) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4">Debug Permissions</h1>
        <p>Đang tải...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4">Debug Permissions</h1>
        <p className="text-red-600">Lỗi: {error}</p>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Debug Permissions</h1>
      
      <div className="space-y-6">
        <div className="bg-gray-50 p-4 rounded">
          <h2 className="font-semibold mb-2">JWT Info:</h2>
          <pre className="text-sm overflow-auto">{JSON.stringify(data.jwt, null, 2)}</pre>
        </div>

        <div className="bg-gray-50 p-4 rounded">
          <h2 className="font-semibold mb-2">Database Info:</h2>
          <pre className="text-sm overflow-auto">{JSON.stringify(data.database, null, 2)}</pre>
        </div>

        <div className="bg-gray-50 p-4 rounded">
          <h2 className="font-semibold mb-2">Permission Checks:</h2>
          <div className="space-y-2">
            <div className={`p-2 rounded ${data.checks.view_tasks ? 'bg-green-100' : 'bg-red-100'}`}>
              <strong>view_tasks:</strong> {data.checks.view_tasks ? '✅ CÓ' : '❌ KHÔNG'}
            </div>
            <div className={`p-2 rounded ${data.checks.create_tasks ? 'bg-green-100' : 'bg-red-100'}`}>
              <strong>create_tasks:</strong> {data.checks.create_tasks ? '✅ CÓ' : '❌ KHÔNG'}
            </div>
          </div>
        </div>

        <div className="bg-blue-50 p-4 rounded">
          <h2 className="font-semibold mb-2">Kết luận:</h2>
          {data.checks.view_tasks ? (
            <p className="text-green-700">✅ User có quyền VIEW_TASKS - Có thể vào /tasks</p>
          ) : (
            <p className="text-red-700">❌ User KHÔNG có quyền VIEW_TASKS - Bị chặn bởi middleware</p>
          )}
        </div>
      </div>
    </div>
  )
}

