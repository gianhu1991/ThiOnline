import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Link from 'next/link'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Thi Trắc Nghiệm Online',
  description: 'Hệ thống thi trắc nghiệm trực tuyến',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="vi">
      <body className={inter.className}>
        <nav className="bg-blue-600 text-white shadow-lg">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <Link href="/" className="text-2xl font-bold">
                Thi Trắc Nghiệm Online
              </Link>
              <div className="flex gap-4">
                <Link href="/" className="hover:underline">
                  Trang chủ
                </Link>
                <Link href="/questions" className="hover:underline">
                  Ngân hàng câu hỏi
                </Link>
                <Link href="/exams" className="hover:underline">
                  Quản lý bài thi
                </Link>
                <Link href="/exams/create" className="hover:underline">
                  Tạo bài thi
                </Link>
              </div>
            </div>
          </div>
        </nav>
        <main className="container mx-auto px-4 py-8">
          {children}
        </main>
      </body>
    </html>
  )
}

