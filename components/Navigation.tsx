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

  // Ẩn navigation trên trang login và register
  if (pathname === '/login' || pathname === '/register') {
    return null
  }

  if (loading) {
    return (
      <nav className="bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="text-lg md:text-xl font-bold whitespace-nowrap">
              Đang tải...
            </div>
          </div>
        </div>
      </nav>
    )
  }

  return (
    <nav className="bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between gap-4">
          {isAuthenticated && username ? (
            <div className="text-lg md:text-xl font-bold whitespace-nowrap">
              Xin chào {username}
            </div>
          ) : (
            <div className="text-lg md:text-xl font-bold whitespace-nowrap">
              TTVT Nho Quan
            </div>
          )}
          {isAuthenticated && (
            <div className="flex gap-2 md:gap-3 lg:gap-4 items-center overflow-x-auto">
              {userRole === 'admin' ? (
                <>
                  <Link href="/" className="hover:text-blue-200 transition-colors font-medium whitespace-nowrap text-sm md:text-base">
                    Trang chủ
                  </Link>
                  <Link href="/questions" className="hover:text-blue-200 transition-colors font-medium whitespace-nowrap text-sm md:text-base">
                    Ngân hàng câu hỏi
                  </Link>
                  <Link href="/exams" className="hover:text-blue-200 transition-colors font-medium whitespace-nowrap text-sm md:text-base">
                    Quản lý bài thi
                  </Link>
                  <Link href="/exams/create" className="hover:text-blue-200 transition-colors font-medium whitespace-nowrap text-sm md:text-base">
                    Tạo bài thi
                  </Link>
                  <Link href="/videos" className="hover:text-blue-200 transition-colors font-medium whitespace-nowrap text-sm md:text-base">
                    Video thực hành
                  </Link>
                  <Link href="/documents" className="hover:text-blue-200 transition-colors font-medium whitespace-nowrap text-sm md:text-base">
                    Tài liệu KT
                  </Link>
                  <Link href="/settings" className="hover:text-blue-200 transition-colors font-medium whitespace-nowrap text-sm md:text-base">
                    Cài đặt
                  </Link>
                </>
              ) : (
                <>
                  <Link href="/videos" className="hover:text-blue-200 transition-colors font-medium whitespace-nowrap text-sm md:text-base">
                    Video thực hành
                  </Link>
                  <Link href="/documents" className="hover:text-blue-200 transition-colors font-medium whitespace-nowrap text-sm md:text-base">
                    Tài liệu KT
                  </Link>
                  <Link href="/settings" className="hover:text-blue-200 transition-colors font-medium whitespace-nowrap text-sm md:text-base">
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
                className="text-white hover:text-blue-200 transition-colors font-medium cursor-pointer whitespace-nowrap text-sm md:text-base"
              >
                Đăng xuất
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}

