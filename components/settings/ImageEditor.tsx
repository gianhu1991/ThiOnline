'use client'

import { useState, useRef, useEffect } from 'react'

interface ImageEditorProps {
  imageUrl: string
  onSave: (croppedImageBlob: Blob, position: { x: number; y: number }, scale: number) => void
  onCancel: () => void
  aspectRatio?: number // Tỷ lệ khung hình (width/height)
}

export default function ImageEditor({ imageUrl, onSave, onCancel, aspectRatio = 16/9 }: ImageEditorProps) {
  const [position, setPosition] = useState({ x: 50, y: 50 }) // Vị trí ảnh (percentage)
  const [scale, setScale] = useState(1) // Tỷ lệ phóng to/thu nhỏ
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const containerRef = useRef<HTMLDivElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // Reset position và scale khi imageUrl thay đổi
  useEffect(() => {
    setPosition({ x: 50, y: 50 })
    setScale(1)
  }, [imageUrl])

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true)
    setDragStart({ x: e.clientX, y: e.clientY })
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !containerRef.current) return

    const deltaX = e.clientX - dragStart.x
    const deltaY = e.clientY - dragStart.y

    const container = containerRef.current
    const rect = container.getBoundingClientRect()
    
    // Tính toán vị trí mới dựa trên phần trăm (nhạy hơn)
    const sensitivity = 1.5 // Độ nhạy khi kéo
    const newX = position.x + (deltaX / rect.width) * 100 * sensitivity
    const newY = position.y + (deltaY / rect.height) * 100 * sensitivity

    // Giới hạn vị trí để ảnh không bị kéo ra ngoài quá nhiều
    // Cho phép kéo ra ngoài một chút để có thể điều chỉnh tốt hơn
    setPosition({
      x: Math.max(-20, Math.min(120, newX)),
      y: Math.max(-20, Math.min(120, newY))
    })

    setDragStart({ x: e.clientX, y: e.clientY })
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault()
    const delta = e.deltaY > 0 ? -0.05 : 0.05
    setScale(prev => Math.max(0.5, Math.min(3, prev + delta)))
  }

  const handleReset = () => {
    setPosition({ x: 50, y: 50 })
    setScale(1)
  }

  const handleSave = async () => {
    if (!imageRef.current || !canvasRef.current || !containerRef.current) return

    const img = imageRef.current
    const canvas = canvasRef.current
    const container = containerRef.current
    const ctx = canvas.getContext('2d')

    if (!ctx) return

    // Đợi ảnh load xong
    if (!img.complete) {
      await new Promise((resolve) => {
        img.onload = resolve
      })
    }

    // Kích thước canvas = kích thước container (giữ tỷ lệ)
    const containerWidth = container.offsetWidth
    const containerHeight = container.offsetHeight
    canvas.width = containerWidth
    canvas.height = containerHeight

    // Tính toán kích thước ảnh sau khi scale (giống object-cover)
    const containerAspect = containerWidth / containerHeight
    const imgAspect = img.naturalWidth / img.naturalHeight
    
    let imgWidth, imgHeight
    if (imgAspect > containerAspect) {
      // Ảnh rộng hơn container -> scale theo height
      imgHeight = containerHeight * scale
      imgWidth = imgHeight * imgAspect
    } else {
      // Ảnh cao hơn container -> scale theo width
      imgWidth = containerWidth * scale
      imgHeight = imgWidth / imgAspect
    }
    
    // Vị trí ảnh (từ percentage sang pixel)
    // position.x và position.y là phần trăm từ 0-100, với 50 là center
    // Transform translate: (position.x - 50) * 2% nghĩa là di chuyển từ center
    const offsetX = ((position.x - 50) / 100) * containerWidth * 2
    const offsetY = ((position.y - 50) / 100) * containerHeight * 2
    
    const x = (containerWidth / 2) - (imgWidth / 2) + offsetX
    const y = (containerHeight / 2) - (imgHeight / 2) + offsetY

    // Vẽ background gradient (fallback)
    const gradient = ctx.createLinearGradient(0, 0, 0, containerHeight)
    gradient.addColorStop(0, '#0a1628')
    gradient.addColorStop(0.3, '#1a3a5c')
    gradient.addColorStop(0.6, '#2563eb')
    gradient.addColorStop(1, '#3b82f6')
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, containerWidth, containerHeight)

    // Vẽ ảnh lên canvas
    ctx.drawImage(img, x, y, imgWidth, imgHeight)

    // Chuyển canvas thành blob với chất lượng cao
    canvas.toBlob((blob) => {
      if (blob) {
        onSave(blob, position, scale)
      }
    }, 'image/jpeg', 0.92)
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-auto">
        <div className="p-6">
          <h3 className="text-2xl font-bold mb-4">Chỉnh sửa và xem trước ảnh nền</h3>
          
          {/* Preview giống màn hình đăng nhập */}
          <div className="mb-6">
            <h4 className="font-semibold mb-2">Xem trước trên màn hình đăng nhập:</h4>
            <div 
              ref={containerRef}
              className="relative w-full h-[500px] rounded-lg overflow-hidden border-2 border-gray-300 cursor-move"
              style={{
                background: 'linear-gradient(180deg, #0a1628 0%, #1a3a5c 30%, #2563eb 60%, #3b82f6 100%)',
              }}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onWheel={handleWheel}
            >
              {/* Overlay nhẹ */}
              <div className="absolute inset-0 bg-black/10 z-0"></div>
              
              {/* Ảnh nền có thể kéo */}
              <img
                ref={imageRef}
                src={imageUrl}
                alt="Background"
                className="absolute select-none pointer-events-none"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  transform: `translate(${(position.x - 50) * 2}%, ${(position.y - 50) * 2}%) scale(${scale})`,
                  transformOrigin: 'center center',
                  transition: isDragging ? 'none' : 'transform 0.2s ease-out',
                  willChange: isDragging ? 'transform' : 'auto',
                }}
                draggable={false}
                onLoad={() => {
                  // Đảm bảo ảnh load xong
                }}
              />

              {/* Form đăng nhập giả lập */}
              <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
                <div className="bg-white/95 backdrop-blur-sm rounded-lg shadow-2xl p-8 w-full max-w-md mx-4">
                  <h2 className="text-3xl font-bold text-center mb-2">Đăng nhập</h2>
                  <p className="text-center text-gray-600 mb-6">TTVT Nho Quan - Phần mềm đào tạo kỹ thuật</p>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Tên đăng nhập</label>
                      <input 
                        type="text" 
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg" 
                        value="admin"
                        readOnly
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Mật khẩu</label>
                      <input 
                        type="password" 
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg" 
                        value="••••••••"
                        readOnly
                      />
                    </div>
                    <button className="w-full bg-blue-600 text-white py-2 rounded-lg font-semibold">
                      Đăng nhập
                    </button>
                  </div>
                </div>
              </div>

              {/* Canvas ẩn để crop ảnh */}
              <canvas ref={canvasRef} className="hidden" />
            </div>
          </div>

          {/* Controls */}
          <div className="space-y-4 mb-6">
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Phóng to/Thu nhỏ: {Math.round(scale * 100)}%
                </label>
                <button
                  onClick={handleReset}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  Đặt lại
                </button>
              </div>
              <input
                type="range"
                min="0.5"
                max="3"
                step="0.05"
                value={scale}
                onChange={(e) => setScale(parseFloat(e.target.value))}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>50%</span>
                <span>100%</span>
                <span>200%</span>
                <span>300%</span>
              </div>
            </div>

            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Hướng dẫn:</strong>
                <br />• Kéo ảnh để điều chỉnh vị trí
                <br />• Cuộn chuột hoặc dùng thanh trượt để phóng to/thu nhỏ
                <br />• Xem trước sẽ hiển thị chính xác như trên màn hình đăng nhập
              </p>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 justify-end">
            <button
              onClick={onCancel}
              className="px-6 py-2 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Hủy
            </button>
            <button
              onClick={handleSave}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Lưu và cập nhật
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

