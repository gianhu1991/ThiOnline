import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import ConditionalLayout from '@/components/ConditionalLayout'

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
        <ConditionalLayout>{children}</ConditionalLayout>
      </body>
    </html>
  )
}

