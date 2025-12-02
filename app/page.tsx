'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function Home() {
  const router = useRouter()
  const [stats, setStats] = useState({ questions: 0, exams: 0, results: 0 })
  const [checkingAuth, setCheckingAuth] = useState(true)
  const [userRole, setUserRole] = useState<string | null>(null)
  const [homepageText, setHomepageText] = useState({
    title: 'TTVT Nho Quan',
    subtitle: 'Phần mềm đào tạo kỹ thuật',
    description: 'Quản lý ngân hàng câu hỏi, tạo bài thi và tổ chức thi trắc nghiệm trực tuyến một cách dễ dàng và hiệu quả',
  })

  useEffect(() => {
    // Fetch homepage text
    const fetchHomepageText = async () => {
      try {
        const res = await fetch('/api/settings/homepage-text')
        const data = await res.json()
        if (res.ok && data.success) {
          setHomepageText({
            title: data.title,
            subtitle: data.subtitle,
            description: data.description,
          })
        }
      } catch (error) {
        console.error('Error fetching homepage text:', error)
      }
    }
    fetchHomepageText()

    // Kiểm tra authentication
    const checkAuth = async () => {
      try {
        const res = await fetch('/api/auth/me', {
          credentials: 'include',
        })
        if (!res.ok) {
          // Chưa đăng nhập, redirect về login
          router.push('/login')
          return
        }
        const data = await res.json()
        const role = data.user?.role
        setUserRole(role)
        
        // Cho phép cả admin và user thường xem trang chủ
        setCheckingAuth(false)
      } catch (error) {
        // Lỗi, redirect về login
        router.push('/login')
      }
    }

    checkAuth()
  }, [router])

  useEffect(() => {
    if (checkingAuth) return
    // Fetch stats với error handling tốt hơn
    const fetchStats = async () => {
      try {
        // Thêm timestamp và random để tránh cache hoàn toàn
        const timestamp = Date.now()
        const random = Math.random()
        const fetchOptions: RequestInit = {
          cache: 'no-store',
          credentials: 'include',
          headers: {
            'Cache-Control': 'no-store, no-cache, must-revalidate',
            'Pragma': 'no-cache',
          },
        }
        const [questionsRes, examsRes, resultsRes] = await Promise.allSettled([
          fetch(`/api/questions?t=${timestamp}&r=${random}`, fetchOptions),
          fetch(`/api/exams?t=${timestamp}&r=${random}`, fetchOptions),
          fetch(`/api/results/count?t=${timestamp}&r=${random}`, fetchOptions),
        ])

        let questions = 0
        if (questionsRes.status === 'fulfilled' && questionsRes.value instanceof Response && questionsRes.value.ok) {
          try {
            const data = await questionsRes.value.json()
            questions = Array.isArray(data) ? data.length : 0
          } catch {
            questions = 0
          }
        }

        let exams = 0
        if (examsRes.status === 'fulfilled' && examsRes.value instanceof Response && examsRes.value.ok) {
          try {
            const data = await examsRes.value.json()
            exams = Array.isArray(data) ? data.length : 0
          } catch {
            exams = 0
          }
        }

        let results = 0
        if (resultsRes.status === 'fulfilled' && resultsRes.value instanceof Response && resultsRes.value.ok) {
          try {
            const data = await resultsRes.value.json()
            results = typeof data.count === 'number' ? data.count : 0
          } catch {
            results = 0
          }
        }

        setStats({ questions, exams, results })
        console.log('Stats updated:', { questions, exams, results, timestamp: new Date().toISOString() })
      } catch (error) {
        // Ignore errors, keep default stats
        console.error('Error fetching stats:', error)
        setStats({ questions: 0, exams: 0, results: 0 })
      }
    }

    fetchStats()
    
    // Auto-refresh stats mỗi 10 giây để cập nhật real-time (giảm từ 30s xuống 10s)
    const interval = setInterval(fetchStats, 10000)
    
    return () => clearInterval(interval)
  }, [checkingAuth])

  // Hiển thị loading khi đang kiểm tra auth
  if (checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <svg className="animate-spin h-8 w-8 text-blue-600 mx-auto mb-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-gray-600">Đang tải...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-12">
      {/* Hero Section */}
      <div className="text-center mb-16">
        <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-4">
          {homepageText.title}
          <span className="text-blue-600 block">{homepageText.subtitle}</span>
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          {homepageText.description}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
        <div className="card text-center">
          <div className="text-4xl font-bold text-blue-600 mb-2">{stats.questions}</div>
          <div className="text-gray-600 font-medium">Câu hỏi trong ngân hàng</div>
        </div>
        <div className="card text-center">
          <div className="text-4xl font-bold text-green-600 mb-2">{stats.exams}</div>
          <div className="text-gray-600 font-medium">Bài thi đã tạo</div>
        </div>
        <div className="card text-center">
          <div className="text-4xl font-bold text-purple-600 mb-2">{stats.results}</div>
          <div className="text-gray-600 font-medium">Kết quả thi</div>
        </div>
      </div>

      {/* Features */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
        <div className="card hover:shadow-xl transition-shadow">
          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-xl font-bold mb-2">Ngân hàng câu hỏi</h3>
          <p className="text-gray-600 mb-4">
            Import và quản lý câu hỏi từ file Excel hoặc PDF. Hỗ trợ câu hỏi chọn 1 hoặc nhiều đáp án.
          </p>
          {userRole === 'admin' ? (
            <Link href="/questions" className="btn-primary inline-block">
              Quản lý câu hỏi
            </Link>
          ) : (
            <span className="btn-primary inline-block opacity-50 cursor-not-allowed">
              Quản lý câu hỏi
            </span>
          )}
        </div>

        <div className="card hover:shadow-xl transition-shadow">
          <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <h3 className="text-xl font-bold mb-2">Tạo bài thi</h3>
          <p className="text-gray-600 mb-4">
            Tạo bài thi với đầy đủ tùy chọn: thời gian, số câu hỏi, trộn câu hỏi/đáp án, số lần làm bài.
          </p>
          {userRole === 'admin' ? (
            <Link href="/exams/create" className="btn-primary inline-block">
              Tạo bài thi mới
            </Link>
          ) : (
            <span className="btn-primary inline-block opacity-50 cursor-not-allowed">
              Tạo bài thi mới
            </span>
          )}
        </div>

        <div className="card hover:shadow-xl transition-shadow">
          <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
            <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
          </div>
          <h3 className="text-xl font-bold mb-2">Quản lý bài thi</h3>
          <p className="text-gray-600 mb-4">
            Xem danh sách bài thi, quản lý thời gian mở/đóng, xem kết quả và thống kê.
          </p>
          {userRole === 'admin' ? (
            <Link href="/exams" className="btn-primary inline-block">
              Xem bài thi
            </Link>
          ) : (
            <span className="btn-primary inline-block opacity-50 cursor-not-allowed">
              Xem bài thi
            </span>
          )}
        </div>
      </div>

      {/* CTA Section */}
      <div className="card bg-gradient-to-r from-blue-600 to-blue-700 text-white text-center">
        <h2 className="text-3xl font-bold mb-4">Sẵn sàng bắt đầu?</h2>
        <p className="text-blue-100 mb-6 text-lg">
          Tạo bài thi đầu tiên của bạn ngay bây giờ
        </p>
        {userRole === 'admin' ? (
          <Link href="/exams/create" className="bg-white text-blue-600 px-8 py-3 rounded-lg font-bold hover:bg-blue-50 transition-colors inline-block">
            Tạo bài thi ngay
          </Link>
        ) : (
          <span className="bg-white bg-opacity-50 text-blue-600 px-8 py-3 rounded-lg font-bold cursor-not-allowed inline-block">
            Tạo bài thi ngay
          </span>
        )}
      </div>
    </div>
  )
}

