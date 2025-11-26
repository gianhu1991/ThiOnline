'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function Navigation() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [username, setUsername] = useState<string | null>(null)
  const [userRole, setUserRole] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const pathname = usePathname()

  const checkAuth = async () => {
    try {
      const res = await fetch('/api/auth/me', {
        credentials: 'include',
      })
      if (res.ok) {
        const data = await res.json()
        setIsAuthenticated(true)
        setUsername(data.user?.username || null)
        setUserRole(data.user?.role || null)
      } else {
        setIsAuthenticated(false)
        setUsername(null)
        setUserRole(null)
      }
    } catch (error) {
      setIsAuthenticated(false)
      setUsername(null)
      setUserRole(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    checkAuth()
  }, [pathname]) // Re-check khi route thay đổi

  if (loading) {
    return (
      <nav className="bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="text-2xl font-bold flex items-center gap-2">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              TTVT Nho Quan- Phần mềm đào tạo kỹ thuật
            </Link>
          </div>
        </div>
      </nav>
    )
  }

  return (
    <nav className="bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold flex items-center gap-2">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            TTVT Nho Quan- Phần mềm đào tạo kỹ thuật
          </Link>
          {isAuthenticated && (
            <div className="hidden md:flex gap-6 items-center">
              <Link href="/" className="hover:text-blue-200 transition-colors font-medium">
                Trang chủ
              </Link>
              <Link href="/questions" className="hover:text-blue-200 transition-colors font-medium">
                Ngân hàng câu hỏi
              </Link>
              <Link href="/exams" className="hover:text-blue-200 transition-colors font-medium">
                Quản lý bài thi
              </Link>
              {userRole === 'admin' && (
                <Link href="/exams/create" className="bg-white text-blue-600 px-4 py-2 rounded-lg font-semibold hover:bg-blue-50 transition-colors">
                  Tạo bài thi
                </Link>
              )}
              <Link href="/videos" className="hover:text-blue-200 transition-colors font-medium">
                Video thực hành
              </Link>
              {userRole === 'admin' && (
                <>
                  <Link href="/videos/manage" className="hover:text-blue-200 transition-colors font-medium">
                    Quản lý video
                  </Link>
                  <Link href="/settings" className="hover:text-blue-200 transition-colors font-medium">
                    Cài đặt
                  </Link>
                </>
              )}
              <button
                onClick={async () => {
                  try {
                    const res = await fetch('/api/auth/logout', { method: 'POST' })
                    if (res.ok) {
                      setIsAuthenticated(false)
                      setUsername(null)
                      window.location.href = '/login'
                    }
                  } catch (error) {
                    console.error('Logout error:', error)
                  }
                }}
                className="text-white hover:text-blue-200 transition-colors font-medium cursor-pointer"
              >
                Đăng xuất{username ? ` (${username})` : ''}
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}

