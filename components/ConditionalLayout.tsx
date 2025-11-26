'use client'

import { usePathname } from 'next/navigation'
import Navigation from './Navigation'

export default function ConditionalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isAuthPage = pathname === '/login' || pathname === '/register'

  if (isAuthPage) {
    return <>{children}</>
  }

  return (
    <>
      <Navigation />
      <main className="min-h-screen bg-gray-50">
        {children}
      </main>
      <footer className="bg-gray-800 text-white py-8 mt-12">
        <div className="container mx-auto px-4 text-center">
          <p className="text-gray-400 mb-2">© 2025 TTVT Nho Quan- Phần mềm đào tạo kỹ thuật</p>
          <p className="text-gray-500 text-sm">Phát triển bởi nhuqg.nbh</p>
        </div>
      </footer>
    </>
  )
}

