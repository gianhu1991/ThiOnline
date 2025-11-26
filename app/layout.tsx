import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Navigation from '@/components/Navigation'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'TTVT Nho Quan- Phần mềm đào tạo kỹ thuật',
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
        <Navigation />
        <main className="min-h-screen bg-gray-50">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  )
}

function Footer() {
  return (
    <footer className="bg-gray-800 text-white py-8 mt-12">
      <div className="container mx-auto px-4 text-center">
        <p className="text-gray-400 mb-2">© 2025 TTVT Nho Quan- Phần mềm đào tạo kỹ thuật</p>
        <p className="text-gray-500 text-sm">Phát triển bởi nhuqg.nbh</p>
      </div>
    </footer>
  )
}

