'use client'

import { useEffect, useState } from 'react'

export default function DebugPermissionsPage() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 seconds timeout
    
    fetch('/api/debug/permissions', {
      credentials: 'include',
      signal: controller.signal
    })
      .then(async res => {
        if (!res.ok) {
          const errorData = await res.json().catch(() => ({ error: `HTTP ${res.status}` }))
          throw new Error(errorData.error || `HTTP ${res.status}`)
        }
        return res.json()
      })
      .then(data => {
        if (data.error) {
          throw new Error(data.error)
        }
        setData(data)
        setLoading(false)
      })
      .catch(err => {
        if (err.name === 'AbortError') {
          setError('Request timeout - API đang chạy quá lâu. Vui lòng thử lại.')
        } else {
          setError(err.message || 'Lỗi không xác định')
        }
        setLoading(false)
      })
      .finally(() => {
        clearTimeout(timeoutId)
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
      <div className="p-8 max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">Debug Permissions</h1>
        <div className="bg-red-50 border border-red-200 rounded p-4">
          <p className="text-red-700 font-semibold mb-2">❌ Lỗi:</p>
          <p className="text-red-600">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Thử lại
          </button>
        </div>
        <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded p-4">
          <p className="text-sm text-yellow-800">
            💡 <strong>Gợi ý:</strong> Mở Console (F12) → Network tab → Xem request <code>/api/debug/permissions</code> để xem lỗi chi tiết.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Debug Permissions</h1>
      
      <div className="space-y-6">
        <div className="bg-gray-50 p-4 rounded">
          <h2 className="font-semibold mb-2">JWT Info:</h2>
          <pre className="text-sm overflow-auto max-h-40">{JSON.stringify(data.jwt, null, 2)}</pre>
        </div>

        <div className="bg-gray-50 p-4 rounded">
          <h2 className="font-semibold mb-2">Database Info:</h2>
          <pre className="text-sm overflow-auto max-h-40">{JSON.stringify(data.database, null, 2)}</pre>
          {data.database?.userIdMatch === false && (
            <div className="mt-2 p-2 bg-red-100 rounded text-red-700">
              ⚠️ WARNING: userId trong JWT KHÔNG khớp với userId trong database!
            </div>
          )}
        </div>

        <div className="bg-gray-50 p-4 rounded">
          <h2 className="font-semibold mb-2">User Permissions (by JWT userId):</h2>
          {data.userPermissions?.byJwtUserId?.length > 0 ? (
            <ul className="list-disc list-inside">
              {data.userPermissions.byJwtUserId.map((up: any, i: number) => (
                <li key={i} className="text-sm">
                  {up.code} ({up.type}) - userId: {up.userId}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500 text-sm">Không có quyền nào tìm thấy với JWT userId</p>
          )}
        </div>

        <div className="bg-gray-50 p-4 rounded">
          <h2 className="font-semibold mb-2">User Permissions (by Database userId):</h2>
          {data.userPermissions?.byDbUserId?.length > 0 ? (
            <ul className="list-disc list-inside">
              {data.userPermissions.byDbUserId.map((up: any, i: number) => (
                <li key={i} className="text-sm">
                  {up.code} ({up.type}) - userId: {up.userId}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500 text-sm">Không có quyền nào tìm thấy với Database userId</p>
          )}
        </div>

        {data.allUserPermissionsForGianhu1991 && data.allUserPermissionsForGianhu1991.length > 0 && (
          <div className="bg-yellow-50 p-4 rounded border border-yellow-200">
            <h2 className="font-semibold mb-2">⚠️ Tất cả UserPermissions của gianhu1991:</h2>
            <ul className="list-disc list-inside">
              {data.allUserPermissionsForGianhu1991.map((up: any, i: number) => (
                <li key={i} className="text-sm">
                  {up.code} ({up.type}) - userId: {up.userId}, username: {up.userUsername}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="bg-gray-50 p-4 rounded">
          <h2 className="font-semibold mb-2">Permission Checks (tất cả quyền):</h2>
          <div className="grid grid-cols-2 gap-2">
            {data.permissionChecks && Object.entries(data.permissionChecks).map(([code, check]: [string, any]) => (
              <div key={code} className={`p-2 rounded text-sm ${check.hasUserPermission ? 'bg-green-100' : 'bg-red-100'}`}>
                <strong>{code}:</strong> {check.hasUserPermission ? '✅ CÓ' : '❌ KHÔNG'}
                {check.checkPermission && (
                  <div className="text-xs mt-1 text-gray-600">
                    Reason: {check.checkPermission.reason || 'OK'}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="bg-blue-50 p-4 rounded border border-blue-200">
          <h2 className="font-semibold mb-2">📋 Copy JSON này để gửi cho tôi:</h2>
          <button
            onClick={() => {
              navigator.clipboard.writeText(JSON.stringify(data, null, 2))
              alert('Đã copy!')
            }}
            className="mb-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Copy toàn bộ JSON
          </button>
          <pre className="text-xs overflow-auto max-h-96 bg-white p-2 border rounded">
            {JSON.stringify(data, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  )
}

