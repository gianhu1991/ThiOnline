'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import Navigation from './Navigation'

export default function ConditionalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isAuthPage = pathname === '/login' || pathname === '/register'
  const [footerText, setFooterText] = useState({
    copyright: '© 2025 TTVT Nho Quan- Phần mềm đào tạo kỹ thuật',
    developer: 'Phát triển bởi nhuqg.nbh'
  })

  useEffect(() => {
    if (!isAuthPage) {
      fetchFooter()
    }
  }, [isAuthPage])

  const fetchFooter = async () => {
    try {
      const res = await fetch('/api/settings/footer')
      const data = await res.json()
      if (res.ok && data.success) {
        setFooterText({
          copyright: data.copyright,
          developer: data.developer,
        })
      }
    } catch (error) {
      console.error('Error fetching footer:', error)
    }
  }

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
          <p className="text-gray-400 mb-2">{footerText.copyright}</p>
          <p className="text-gray-500 text-sm">{footerText.developer}</p>
        </div>
      </footer>
    </>
  )
}

