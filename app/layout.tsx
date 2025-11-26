import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Link from 'next/link'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Thi Trắc Nghiệm Online - Hệ thống thi trực tuyến chuyên nghiệp',
  description: 'Hệ thống thi trắc nghiệm trực tuyến với đầy đủ tính năng quản lý ngân hàng câu hỏi, tạo bài thi và làm bài thi',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="vi">
      <body className={inter.className}>
        <nav className="bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg sticky top-0 z-50">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <Link href="/" className="text-2xl font-bold flex items-center gap-2">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Thi Trắc Nghiệm Online
              </Link>
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
                <Link href="/exams/create" className="bg-white text-blue-600 px-4 py-2 rounded-lg font-semibold hover:bg-blue-50 transition-colors">
                  Tạo bài thi
                </Link>
              </div>
            </div>
          </div>
        </nav>
        <main className="min-h-screen bg-gray-50">
          {children}
        </main>
        <footer className="bg-gray-800 text-white py-8 mt-12">
          <div className="container mx-auto px-4 text-center">
            <p className="text-gray-400">© 2024 Hệ thống Thi Trắc Nghiệm Online. All rights reserved.</p>
          </div>
        </footer>
      </body>
    </html>
  )
}

