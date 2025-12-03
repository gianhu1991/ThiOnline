'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface LoginFormProps {
  initialBackgroundUrl: string | null
  initialFormPosition: { x: number; y: number; width: number; height: number } | null
  initialSubtitle: string
}

export default function LoginForm({ 
  initialBackgroundUrl, 
  initialFormPosition, 
  initialSubtitle 
}: LoginFormProps) {
  const router = useRouter()
  const [username, setUsername] = useState('admin')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [backgroundUrl, setBackgroundUrl] = useState<string | null>(null)
  const [formPosition, setFormPosition] = useState<{ x: number; y: number; width: number; height: number } | null>(initialFormPosition)
  const [loginSubtitle, setLoginSubtitle] = useState(initialSubtitle)
  const [isImageLoaded, setIsImageLoaded] = useState(false)

  // Load saved username từ localStorage khi component mount
  useEffect(() => {
    const savedUsername = localStorage.getItem('rememberedUsername')
    if (savedUsername) {
      setUsername(savedUsername)
      setRememberMe(true)
    }
  }, [])

  // Preload ảnh ngay khi component mount
  useEffect(() => {
    if (initialBackgroundUrl) {
      const img = new Image()
      img.onload = () => {
        setBackgroundUrl(initialBackgroundUrl)
        setIsImageLoaded(true)
      }
      img.onerror = () => {
        setIsImageLoaded(true)
      }
      img.src = initialBackgroundUrl
    } else {
      setIsImageLoaded(true)
    }
  }, [initialBackgroundUrl])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })

      const data = await res.json()

      if (res.ok && data.success) {
        // Lưu username vào localStorage nếu người dùng chọn nhớ
        if (rememberMe) {
          localStorage.setItem('rememberedUsername', username)
        } else {
          localStorage.removeItem('rememberedUsername')
        }
        
        // Force reload để Navigation component cập nhật
        window.location.href = '/'
      } else {
        setError(data.error || 'Đăng nhập thất bại')
      }
    } catch (error) {
      setError('Lỗi khi đăng nhập')
    } finally {
      setLoading(false)
    }
  }

  // Chỉ set background khi đã load xong để tránh flash
  const backgroundStyle = !isImageLoaded
    ? { 
        background: '#0a1628', // Màu tối trong lúc load để tránh flash
      }
    : backgroundUrl 
    ? { 
        backgroundImage: `url(${backgroundUrl})`,
        backgroundSize: '100% 100%', // Hiển thị toàn bộ ảnh, không cắt
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }
    : { 
        background: 'linear-gradient(180deg, #0a1628 0%, #1a3a5c 30%, #2563eb 60%, #3b82f6 100%)',
      }

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden" style={{ 
      ...backgroundStyle,
      marginTop: 0, 
      paddingTop: 0 
    }}>
      {/* Overlay nhẹ để đảm bảo form dễ đọc */}
      {backgroundUrl && (
        <div className="absolute inset-0 bg-black bg-opacity-10"></div>
      )}
      {/* Background decorative elements - chỉ hiển thị khi không có ảnh nền và không đang load */}
      {!backgroundUrl && isImageLoaded && (
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Grid pattern on ground */}
        <svg className="absolute bottom-0 left-0 w-full h-1/3 opacity-30" viewBox="0 0 1200 400" fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
              <path d="M 50 0 L 0 0 0 50" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)"/>
          {/* Glowing dots */}
          <circle cx="100" cy="300" r="3" fill="white" opacity="0.6"/>
          <circle cx="300" cy="280" r="2" fill="white" opacity="0.5"/>
          <circle cx="500" cy="290" r="2.5" fill="white" opacity="0.6"/>
          <circle cx="700" cy="270" r="2" fill="white" opacity="0.5"/>
          <circle cx="900" cy="285" r="3" fill="white" opacity="0.6"/>
        </svg>

        {/* City skyline in middle */}
        <svg className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-2/3 h-2/3 opacity-25" viewBox="0 0 800 500" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Buildings */}
          <rect x="50" y="350" width="40" height="100" stroke="white" strokeWidth="2" fill="rgba(255,255,255,0.1)"/>
          <rect x="60" y="360" width="8" height="8" stroke="white" strokeWidth="1" fill="rgba(255,255,255,0.3)"/>
          <rect x="72" y="360" width="8" height="8" stroke="white" strokeWidth="1" fill="rgba(255,255,255,0.3)"/>
          
          <rect x="120" y="380" width="50" height="70" stroke="white" strokeWidth="2" fill="rgba(255,255,255,0.1)"/>
          <rect x="130" y="390" width="10" height="10" stroke="white" strokeWidth="1" fill="rgba(255,255,255,0.3)"/>
          <rect x="145" y="390" width="10" height="10" stroke="white" strokeWidth="1" fill="rgba(255,255,255,0.3)"/>
          
          {/* Central tallest building */}
          <rect x="300" y="200" width="80" height="250" stroke="white" strokeWidth="3" fill="rgba(255,255,255,0.15)"/>
          <rect x="310" y="210" width="15" height="15" stroke="white" strokeWidth="1" fill="rgba(255,255,255,0.4)"/>
          <rect x="330" y="210" width="15" height="15" stroke="white" strokeWidth="1" fill="rgba(255,255,255,0.4)"/>
          <rect x="350" y="210" width="15" height="15" stroke="white" strokeWidth="1" fill="rgba(255,255,255,0.4)"/>
          <rect x="310" y="230" width="15" height="15" stroke="white" strokeWidth="1" fill="rgba(255,255,255,0.4)"/>
          <rect x="350" y="230" width="15" height="15" stroke="white" strokeWidth="1" fill="rgba(255,255,255,0.4)"/>
          
          <rect x="420" y="320" width="60" height="130" stroke="white" strokeWidth="2" fill="rgba(255,255,255,0.1)"/>
          <rect x="430" y="330" width="12" height="12" stroke="white" strokeWidth="1" fill="rgba(255,255,255,0.3)"/>
          
          <rect x="520" y="360" width="45" height="90" stroke="white" strokeWidth="2" fill="rgba(255,255,255,0.1)"/>
          <rect x="530" y="370" width="10" height="10" stroke="white" strokeWidth="1" fill="rgba(255,255,255,0.3)"/>
          
          <rect x="600" y="340" width="55" height="110" stroke="white" strokeWidth="2" fill="rgba(255,255,255,0.1)"/>
          <rect x="610" y="350" width="12" height="12" stroke="white" strokeWidth="1" fill="rgba(255,255,255,0.3)"/>
        </svg>
        
        {/* High-speed train on right foreground */}
        <svg className="absolute right-0 bottom-0 w-1/2 h-1/3 opacity-30" viewBox="0 0 600 300" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Train body */}
          <path d="M100 200 L200 180 L400 160 L500 150 L600 140 L600 250 L500 240 L400 230 L200 250 L100 270 L100 200 Z" 
                stroke="white" strokeWidth="3" fill="rgba(255,255,255,0.15)"/>
          
          {/* Train front section */}
          <rect x="400" y="160" width="100" height="80" stroke="white" strokeWidth="2" fill="rgba(255,255,255,0.2)" rx="5"/>
          <rect x="410" y="170" width="20" height="15" stroke="white" strokeWidth="1" fill="rgba(255,255,255,0.3)"/>
          <rect x="435" y="170" width="20" height="15" stroke="white" strokeWidth="1" fill="rgba(255,255,255,0.3)"/>
          
          {/* 4G logo on train */}
          <text x="420" y="210" fill="white" fontSize="24" fontWeight="bold" opacity="0.9">4G</text>
          
          {/* Train wheels */}
          <circle cx="250" cy="260" r="18" stroke="white" strokeWidth="2" fill="none"/>
          <circle cx="250" cy="260" r="8" fill="white" opacity="0.5"/>
          <circle cx="350" cy="245" r="18" stroke="white" strokeWidth="2" fill="none"/>
          <circle cx="350" cy="245" r="8" fill="white" opacity="0.5"/>
          
          {/* Speed lines */}
          <line x1="300" y1="180" x2="280" y2="175" stroke="white" strokeWidth="2" opacity="0.6"/>
          <line x1="300" y1="190" x2="280" y2="185" stroke="white" strokeWidth="2" opacity="0.6"/>
          <line x1="300" y1="200" x2="280" y2="195" stroke="white" strokeWidth="2" opacity="0.6"/>
        </svg>
        
        {/* Light rays connecting logo to central building */}
        <svg className="absolute top-0 left-1/2 transform -translate-x-1/2 w-full h-full opacity-20" viewBox="0 0 1200 800" fill="none" xmlns="http://www.w3.org/2000/svg">
          <line x1="600" y1="100" x2="340" y2="200" stroke="white" strokeWidth="2" opacity="0.4"/>
          <line x1="600" y1="100" x2="380" y2="200" stroke="white" strokeWidth="2" opacity="0.4"/>
        </svg>
      </div>
      )}

      {/* Logo VNPT at top with glow effect - chỉ hiển thị khi không có ảnh nền */}
      {!backgroundUrl && (
      <div className="absolute top-8 left-1/2 transform -translate-x-1/2 z-10">
        <div className="flex items-center gap-4">
          {/* VNPT Logo symbol */}
          <svg className="w-16 h-16" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <filter id="glow">
                <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>
            <path d="M30 50 L50 30 L70 50 L50 70 Z" stroke="white" strokeWidth="3" fill="rgba(255,255,255,0.2)" filter="url(#glow)"/>
            <path d="M20 50 L50 20 L80 50 L50 80 Z" stroke="white" strokeWidth="2" fill="none" opacity="0.5" filter="url(#glow)"/>
          </svg>
          <h1 className="text-5xl font-bold text-white drop-shadow-2xl" style={{ 
            textShadow: '0 0 20px rgba(255,255,255,0.5), 0 0 40px rgba(255,255,255,0.3)'
          }}>VNPT</h1>
        </div>
      </div>
      )}

      <div 
        className="relative z-10"
        style={formPosition ? {
          position: 'absolute',
          left: `${formPosition.x}%`,
          top: `${formPosition.y}%`,
          width: `${formPosition.width}%`,
          height: `${formPosition.height}%`,
          transform: 'translate(-50%, -50%)',
          maxWidth: '90%',
          maxHeight: '90%',
        } : {
          maxWidth: '28rem',
          width: '100%',
          margin: '0 1rem',
        }}
      >
        <div className="card shadow-2xl bg-white/95 backdrop-blur-sm h-full">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Đăng nhập</h1>
            <p className="text-gray-600">{loginSubtitle}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block mb-2 font-semibold text-gray-700">Tên đăng nhập</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="input-field"
                placeholder="Nhập tên đăng nhập"
                required
                disabled={loading}
              />
            </div>

            <div>
              <label className="block mb-2 font-semibold text-gray-700">Mật khẩu</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field pr-10"
                  placeholder="Nhập mật khẩu"
                  required
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            <div className="flex items-center">
              <input
                type="checkbox"
                id="rememberMe"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                disabled={loading}
              />
              <label htmlFor="rememberMe" className="ml-2 text-sm text-gray-700 cursor-pointer">
                Nhớ tên đăng nhập
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Đang đăng nhập...
                </span>
              ) : (
                'Đăng nhập'
              )}
            </button>

            <div className="text-center">
              <Link href="/register" className="text-blue-600 hover:text-blue-700 text-sm">
                Chưa có tài khoản? Đăng ký
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

