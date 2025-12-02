'use client'

import { useState, useRef, useEffect } from 'react'

interface ImageEditorProps {
  imageUrl: string
  originalFile: File
  onSave: (file: File | Blob, cropArea?: { x: number; y: number; width: number; height: number }, formPosition?: { x: number; y: number; width: number; height: number }) => void
  onCancel: () => void
  aspectRatio?: number // Tỷ lệ khung hình (width/height)
}

export default function ImageEditor({ imageUrl, originalFile, onSave, onCancel, aspectRatio = 16/9 }: ImageEditorProps) {
  const [position, setPosition] = useState({ x: 50, y: 50 }) // Vị trí ảnh (percentage)
  const [scale, setScale] = useState(1) // Tỷ lệ phóng to/thu nhỏ
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [cropMode, setCropMode] = useState(false) // Chế độ crop
  const [cropArea, setCropArea] = useState({ x: 10, y: 10, width: 80, height: 80 }) // Crop area (percentage)
  const [isDraggingCrop, setIsDraggingCrop] = useState(false)
  const [dragCropHandle, setDragCropHandle] = useState<string | null>(null) // 'nw', 'ne', 'sw', 'se', 'n', 's', 'e', 'w', 'move'
  const [cropStart, setCropStart] = useState({ x: 0, y: 0, crop: { x: 0, y: 0, width: 0, height: 0 } })
  const [formPosition, setFormPosition] = useState({ x: 50, y: 50 }) // Vị trí form (percentage, center)
  const [formSize, setFormSize] = useState({ width: 90, height: 70 }) // Kích thước form (percentage)
  const [isDraggingForm, setIsDraggingForm] = useState(false)
  const [isResizingForm, setIsResizingForm] = useState(false)
  const [formDragStart, setFormDragStart] = useState({ x: 0, y: 0, form: { x: 50, y: 50, width: 90, height: 70 } })
  const [resizeHandle, setResizeHandle] = useState<string | null>(null) // 'nw', 'ne', 'sw', 'se', 'n', 's', 'e', 'w'
  const containerRef = useRef<HTMLDivElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const formRef = useRef<HTMLDivElement>(null)

  // Reset position và scale khi imageUrl thay đổi
  useEffect(() => {
    setPosition({ x: 50, y: 50 })
    setScale(1)
    setFormPosition({ x: 50, y: 50 })
    setFormSize({ width: 90, height: 70 })
    setCropMode(false) // Đảm bảo crop mode luôn TẮT mặc định
    if (containerRef.current) {
      const container = containerRef.current
      setCropArea({ x: 10, y: 10, width: 80, height: 80 })
    }
  }, [imageUrl])

  const handleMouseDown = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement
    
    // Kiểm tra nếu click vào form hoặc resize handle của form
    if (target.closest('.login-form-container')) {
      const formHandle = target.dataset.formHandle
      if (formHandle) {
        // Resize form
        e.stopPropagation()
        setIsResizingForm(true)
        setResizeHandle(formHandle)
        setFormDragStart({
          x: e.clientX,
          y: e.clientY,
          form: { ...formPosition, ...formSize }
        })
      } else if (target.closest('.login-form-draggable')) {
        // Kéo form
        e.stopPropagation()
        setIsDraggingForm(true)
        setFormDragStart({
          x: e.clientX,
          y: e.clientY,
          form: { ...formPosition, ...formSize }
        })
      }
      return
    }

    if (cropMode) {
      // Xử lý crop handles
      const handle = target.dataset.handle
      if (handle) {
        e.stopPropagation()
        setIsDraggingCrop(true)
        setDragCropHandle(handle)
        setCropStart({
          x: e.clientX,
          y: e.clientY,
          crop: { ...cropArea }
        })
      } else if (target.closest('.crop-area')) {
        // Kéo toàn bộ crop area
        e.stopPropagation()
        setIsDraggingCrop(true)
        setDragCropHandle('move')
        setCropStart({
          x: e.clientX,
          y: e.clientY,
          crop: { ...cropArea }
        })
      }
    } else {
      // Kéo ảnh như cũ
      setIsDragging(true)
      setDragStart({ x: e.clientX, y: e.clientY })
    }
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!containerRef.current) return

    const container = containerRef.current
    const rect = container.getBoundingClientRect()

    if (isDraggingForm) {
      // Kéo form - đảm bảo form không bị kéo ra ngoài khung
      const deltaX = ((e.clientX - formDragStart.x) / rect.width) * 100
      const deltaY = ((e.clientY - formDragStart.y) / rect.height) * 100
      
      // Tính toán vị trí mới
      let newX = formDragStart.form.x + deltaX
      let newY = formDragStart.form.y + deltaY
      
      // Giới hạn để form không bị kéo ra ngoài
      // Vì form dùng transform translate(-50%, -50%), nên cần tính toán dựa trên kích thước form
      const halfWidth = formDragStart.form.width / 2
      const halfHeight = formDragStart.form.height / 2
      
      // Giới hạn X: form không được vượt quá biên trái/phải
      newX = Math.max(halfWidth, Math.min(100 - halfWidth, newX))
      
      // Giới hạn Y: form không được vượt quá biên trên/dưới
      newY = Math.max(halfHeight, Math.min(100 - halfHeight, newY))
      
      setFormPosition({
        x: newX,
        y: newY
      })
    } else if (isResizingForm && resizeHandle) {
      // Resize form - đảm bảo form luôn nằm trong khung
      const deltaX = ((e.clientX - formDragStart.x) / rect.width) * 100
      const deltaY = ((e.clientY - formDragStart.y) / rect.height) * 100
      
      let newForm = { ...formDragStart.form }
      const minSize = 15 // Kích thước tối thiểu

      switch (resizeHandle) {
        case 'nw': // Góc trên trái
          newForm.width = Math.max(minSize, formDragStart.form.width - deltaX)
          newForm.height = Math.max(minSize, formDragStart.form.height - deltaY)
          // Điều chỉnh vị trí để form không tràn ra ngoài
          newForm.x = formDragStart.form.x - (formDragStart.form.width - newForm.width) / 2
          newForm.y = formDragStart.form.y - (formDragStart.form.height - newForm.height) / 2
          break
        case 'ne': // Góc trên phải
          newForm.width = Math.max(minSize, formDragStart.form.width + deltaX)
          newForm.height = Math.max(minSize, formDragStart.form.height - deltaY)
          newForm.x = formDragStart.form.x + (newForm.width - formDragStart.form.width) / 2
          newForm.y = formDragStart.form.y - (formDragStart.form.height - newForm.height) / 2
          break
        case 'sw': // Góc dưới trái
          newForm.width = Math.max(minSize, formDragStart.form.width - deltaX)
          newForm.height = Math.max(minSize, formDragStart.form.height + deltaY)
          newForm.x = formDragStart.form.x - (formDragStart.form.width - newForm.width) / 2
          newForm.y = formDragStart.form.y + (newForm.height - formDragStart.form.height) / 2
          break
        case 'se': // Góc dưới phải
          newForm.width = Math.max(minSize, formDragStart.form.width + deltaX)
          newForm.height = Math.max(minSize, formDragStart.form.height + deltaY)
          newForm.x = formDragStart.form.x + (newForm.width - formDragStart.form.width) / 2
          newForm.y = formDragStart.form.y + (newForm.height - formDragStart.form.height) / 2
          break
        case 'n': // Cạnh trên
          newForm.height = Math.max(minSize, formDragStart.form.height - deltaY)
          newForm.y = formDragStart.form.y - (formDragStart.form.height - newForm.height) / 2
          break
        case 's': // Cạnh dưới
          newForm.height = Math.max(minSize, formDragStart.form.height + deltaY)
          newForm.y = formDragStart.form.y + (newForm.height - formDragStart.form.height) / 2
          break
        case 'w': // Cạnh trái
          newForm.width = Math.max(minSize, formDragStart.form.width - deltaX)
          newForm.x = formDragStart.form.x - (formDragStart.form.width - newForm.width) / 2
          break
        case 'e': // Cạnh phải
          newForm.width = Math.max(minSize, formDragStart.form.width + deltaX)
          newForm.x = formDragStart.form.x + (newForm.width - formDragStart.form.width) / 2
          break
      }

      // Giới hạn kích thước tối đa để form không vượt quá container
      const maxWidth = 98 // Để lại 2% margin
      const maxHeight = 98
      
      if (newForm.width > maxWidth) {
        newForm.width = maxWidth
        newForm.x = formDragStart.form.x // Giữ nguyên vị trí center
      }
      if (newForm.height > maxHeight) {
        newForm.height = maxHeight
        newForm.y = formDragStart.form.y // Giữ nguyên vị trí center
      }
      
      // Đảm bảo form không bị tràn ra ngoài (tính với transform translate -50%)
      const halfWidth = newForm.width / 2
      const halfHeight = newForm.height / 2
      
      // Điều chỉnh vị trí nếu form bị tràn ra ngoài
      if (newForm.x - halfWidth < 0) {
        newForm.x = halfWidth
      }
      if (newForm.x + halfWidth > 100) {
        newForm.x = 100 - halfWidth
      }
      if (newForm.y - halfHeight < 0) {
        newForm.y = halfHeight
      }
      if (newForm.y + halfHeight > 100) {
        newForm.y = 100 - halfHeight
      }

      setFormPosition({ x: newForm.x, y: newForm.y })
      setFormSize({ width: newForm.width, height: newForm.height })
    } else if (isDraggingCrop && dragCropHandle) {
      // Xử lý kéo crop handles
      const deltaX = ((e.clientX - cropStart.x) / rect.width) * 100
      const deltaY = ((e.clientY - cropStart.y) / rect.height) * 100
      
      let newCrop = { ...cropStart.crop }

      switch (dragCropHandle) {
        case 'nw': // Góc trên trái
          newCrop.x = Math.max(0, Math.min(newCrop.x + newCrop.width - 5, cropStart.crop.x + deltaX))
          newCrop.y = Math.max(0, Math.min(newCrop.y + newCrop.height - 5, cropStart.crop.y + deltaY))
          newCrop.width = cropStart.crop.width - deltaX
          newCrop.height = cropStart.crop.height - deltaY
          break
        case 'ne': // Góc trên phải
          newCrop.y = Math.max(0, Math.min(newCrop.y + newCrop.height - 5, cropStart.crop.y + deltaY))
          newCrop.width = Math.max(5, cropStart.crop.width + deltaX)
          newCrop.height = cropStart.crop.height - deltaY
          break
        case 'sw': // Góc dưới trái
          newCrop.x = Math.max(0, Math.min(newCrop.x + newCrop.width - 5, cropStart.crop.x + deltaX))
          newCrop.width = cropStart.crop.width - deltaX
          newCrop.height = Math.max(5, cropStart.crop.height + deltaY)
          break
        case 'se': // Góc dưới phải
          newCrop.width = Math.max(5, Math.min(100 - newCrop.x, cropStart.crop.width + deltaX))
          newCrop.height = Math.max(5, Math.min(100 - newCrop.y, cropStart.crop.height + deltaY))
          break
        case 'n': // Cạnh trên
          newCrop.y = Math.max(0, Math.min(newCrop.y + newCrop.height - 5, cropStart.crop.y + deltaY))
          newCrop.height = cropStart.crop.height - deltaY
          break
        case 's': // Cạnh dưới
          newCrop.height = Math.max(5, Math.min(100 - newCrop.y, cropStart.crop.height + deltaY))
          break
        case 'w': // Cạnh trái
          newCrop.x = Math.max(0, Math.min(newCrop.x + newCrop.width - 5, cropStart.crop.x + deltaX))
          newCrop.width = cropStart.crop.width - deltaX
          break
        case 'e': // Cạnh phải
          newCrop.width = Math.max(5, Math.min(100 - newCrop.x, cropStart.crop.width + deltaX))
          break
        case 'move': // Di chuyển toàn bộ crop area
          newCrop.x = Math.max(0, Math.min(100 - newCrop.width, cropStart.crop.x + deltaX))
          newCrop.y = Math.max(0, Math.min(100 - newCrop.height, cropStart.crop.y + deltaY))
          break
      }

      // Đảm bảo kích thước tối thiểu
      if (newCrop.width < 5) newCrop.width = 5
      if (newCrop.height < 5) newCrop.height = 5
      if (newCrop.x + newCrop.width > 100) newCrop.x = 100 - newCrop.width
      if (newCrop.y + newCrop.height > 100) newCrop.y = 100 - newCrop.height

      setCropArea(newCrop)
    } else if (isDragging && !cropMode) {
      // Kéo ảnh như cũ
      const deltaX = e.clientX - dragStart.x
      const deltaY = e.clientY - dragStart.y
      
      const sensitivity = 1.5
      const newX = position.x + (deltaX / rect.width) * 100 * sensitivity
      const newY = position.y + (deltaY / rect.height) * 100 * sensitivity

      setPosition({
        x: Math.max(-20, Math.min(120, newX)),
        y: Math.max(-20, Math.min(120, newY))
      })

      setDragStart({ x: e.clientX, y: e.clientY })
    }
  }

  const handleMouseUp = () => {
    setIsDragging(false)
    setIsDraggingCrop(false)
    setDragCropHandle(null)
    setIsDraggingForm(false)
    setIsResizingForm(false)
    setResizeHandle(null)
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

  const handleSave = () => {
    // Đảm bảo chỉ crop khi cropMode = true
    if (cropMode && imageRef.current && canvasRef.current && containerRef.current) {
      // Crop ảnh theo crop area
      console.log('Crop mode ON - sẽ crop ảnh')
      const img = imageRef.current
      const canvas = canvasRef.current
      const container = containerRef.current
      const ctx = canvas.getContext('2d')

      if (!ctx) {
        onSave(originalFile, undefined, {
          x: formPosition.x,
          y: formPosition.y,
          width: formSize.width,
          height: formSize.height
        })
        return
      }

      // Đợi ảnh load xong
      const processCrop = () => {
        const containerWidth = container.offsetWidth
        const containerHeight = container.offsetHeight

        // Tính toán crop area trong pixel
        const cropX = (cropArea.x / 100) * containerWidth
        const cropY = (cropArea.y / 100) * containerHeight
        const cropWidth = (cropArea.width / 100) * containerWidth
        const cropHeight = (cropArea.height / 100) * containerHeight

        // Tính toán vị trí ảnh trên container
        const containerAspect = containerWidth / containerHeight
        const imgAspect = img.naturalWidth / img.naturalHeight
        
        let imgWidth, imgHeight
        if (imgAspect > containerAspect) {
          imgHeight = containerHeight * scale
          imgWidth = imgHeight * imgAspect
        } else {
          imgWidth = containerWidth * scale
          imgHeight = imgWidth / imgAspect
        }

        const offsetX = ((position.x - 50) / 100) * containerWidth * 2
        const offsetY = ((position.y - 50) / 100) * containerHeight * 2
        
        const imgX = (containerWidth / 2) - (imgWidth / 2) + offsetX
        const imgY = (containerHeight / 2) - (imgHeight / 2) + offsetY

        // Tính toán phần ảnh cần crop (trong tọa độ ảnh gốc)
        const scaleX = img.naturalWidth / imgWidth
        const scaleY = img.naturalHeight / imgHeight

        const sourceX = Math.max(0, (cropX - imgX) * scaleX)
        const sourceY = Math.max(0, (cropY - imgY) * scaleY)
        const sourceWidth = Math.min(img.naturalWidth - sourceX, cropWidth * scaleX)
        const sourceHeight = Math.min(img.naturalHeight - sourceY, cropHeight * scaleY)

        // Tạo canvas với kích thước crop
        canvas.width = cropWidth
        canvas.height = cropHeight

        // Vẽ phần ảnh đã crop
        ctx.drawImage(
          img,
          sourceX, sourceY, sourceWidth, sourceHeight, // Source
          0, 0, cropWidth, cropHeight // Destination
        )

        // Chuyển canvas thành blob
        canvas.toBlob((blob) => {
          if (blob) {
            onSave(blob, {
              x: cropX,
              y: cropY,
              width: cropWidth,
              height: cropHeight
            }, {
              x: formPosition.x,
              y: formPosition.y,
              width: formSize.width,
              height: formSize.height
            })
          } else {
            onSave(originalFile, undefined, {
              x: formPosition.x,
              y: formPosition.y,
              width: formSize.width,
              height: formSize.height
            })
          }
        }, 'image/jpeg', 0.92)
      }

      if (!img.complete) {
        img.onload = processCrop
        return
      }
      
      processCrop()
    } else {
      // Upload ảnh gốc - KHÔNG CROP, KHÔNG CHỈNH SỬA
      console.log('Crop mode OFF - upload ảnh gốc nguyên vẹn', {
        fileName: originalFile.name,
        fileSize: originalFile.size,
        fileType: originalFile.type
      })
      onSave(originalFile, undefined, {
        x: formPosition.x,
        y: formPosition.y,
        width: formSize.width,
        height: formSize.height
      })
    }
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

              {/* Crop overlay và handles */}
              {cropMode && (
                <>
                  {/* Overlay tối xung quanh crop area */}
                  <div className="absolute inset-0 bg-black/50 z-5 pointer-events-none">
                    <div 
                      className="absolute border-2 border-blue-500 bg-transparent crop-area"
                      style={{
                        left: `${cropArea.x}%`,
                        top: `${cropArea.y}%`,
                        width: `${cropArea.width}%`,
                        height: `${cropArea.height}%`,
                        pointerEvents: dragCropHandle === 'move' ? 'auto' : 'none',
                        cursor: dragCropHandle === 'move' ? 'move' : 'default',
                      }}
                    >
                      {/* Handles ở 4 góc */}
                      <div
                        data-handle="nw"
                        className="absolute -top-2 -left-2 w-4 h-4 bg-blue-500 border-2 border-white rounded-full cursor-nw-resize hover:bg-blue-600"
                        style={{ pointerEvents: 'auto' }}
                      />
                      <div
                        data-handle="ne"
                        className="absolute -top-2 -right-2 w-4 h-4 bg-blue-500 border-2 border-white rounded-full cursor-ne-resize hover:bg-blue-600"
                        style={{ pointerEvents: 'auto' }}
                      />
                      <div
                        data-handle="sw"
                        className="absolute -bottom-2 -left-2 w-4 h-4 bg-blue-500 border-2 border-white rounded-full cursor-sw-resize hover:bg-blue-600"
                        style={{ pointerEvents: 'auto' }}
                      />
                      <div
                        data-handle="se"
                        className="absolute -bottom-2 -right-2 w-4 h-4 bg-blue-500 border-2 border-white rounded-full cursor-se-resize hover:bg-blue-600"
                        style={{ pointerEvents: 'auto' }}
                      />
                      {/* Handles ở 4 cạnh */}
                      <div
                        data-handle="n"
                        className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-blue-500 border-2 border-white rounded-full cursor-n-resize hover:bg-blue-600"
                        style={{ pointerEvents: 'auto' }}
                      />
                      <div
                        data-handle="s"
                        className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-blue-500 border-2 border-white rounded-full cursor-s-resize hover:bg-blue-600"
                        style={{ pointerEvents: 'auto' }}
                      />
                      <div
                        data-handle="w"
                        className="absolute -left-2 top-1/2 -translate-y-1/2 w-4 h-4 bg-blue-500 border-2 border-white rounded-full cursor-w-resize hover:bg-blue-600"
                        style={{ pointerEvents: 'auto' }}
                      />
                      <div
                        data-handle="e"
                        className="absolute -right-2 top-1/2 -translate-y-1/2 w-4 h-4 bg-blue-500 border-2 border-white rounded-full cursor-e-resize hover:bg-blue-600"
                        style={{ pointerEvents: 'auto' }}
                      />
                    </div>
                  </div>
                </>
              )}

              {/* Form đăng nhập giả lập - có thể kéo và resize */}
              <div 
                ref={formRef}
                className="login-form-container absolute z-10"
                style={{
                  left: `${formPosition.x}%`,
                  top: `${formPosition.y}%`,
                  width: `${formSize.width}%`,
                  height: `${formSize.height}%`,
                  transform: 'translate(-50%, -50%)',
                  pointerEvents: 'auto',
                }}
              >
                <div className="login-form-draggable bg-white/95 backdrop-blur-sm rounded-lg shadow-2xl p-8 h-full w-full relative cursor-move">
                  {/* Resize handles */}
                  <div
                    data-form-handle="nw"
                    className="absolute -top-2 -left-2 w-5 h-5 bg-blue-600 border-2 border-white rounded-full cursor-nw-resize hover:bg-blue-700 z-20"
                  />
                  <div
                    data-form-handle="ne"
                    className="absolute -top-2 -right-2 w-5 h-5 bg-blue-600 border-2 border-white rounded-full cursor-ne-resize hover:bg-blue-700 z-20"
                  />
                  <div
                    data-form-handle="sw"
                    className="absolute -bottom-2 -left-2 w-5 h-5 bg-blue-600 border-2 border-white rounded-full cursor-sw-resize hover:bg-blue-700 z-20"
                  />
                  <div
                    data-form-handle="se"
                    className="absolute -bottom-2 -right-2 w-5 h-5 bg-blue-600 border-2 border-white rounded-full cursor-se-resize hover:bg-blue-700 z-20"
                  />
                  <div
                    data-form-handle="n"
                    className="absolute -top-2 left-1/2 -translate-x-1/2 w-5 h-5 bg-blue-600 border-2 border-white rounded-full cursor-n-resize hover:bg-blue-700 z-20"
                  />
                  <div
                    data-form-handle="s"
                    className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-5 h-5 bg-blue-600 border-2 border-white rounded-full cursor-s-resize hover:bg-blue-700 z-20"
                  />
                  <div
                    data-form-handle="w"
                    className="absolute -left-2 top-1/2 -translate-y-1/2 w-5 h-5 bg-blue-600 border-2 border-white rounded-full cursor-w-resize hover:bg-blue-700 z-20"
                  />
                  <div
                    data-form-handle="e"
                    className="absolute -right-2 top-1/2 -translate-y-1/2 w-5 h-5 bg-blue-600 border-2 border-white rounded-full cursor-e-resize hover:bg-blue-700 z-20"
                  />
                  
                  {/* Form content */}
                  <div className="pointer-events-none">
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
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="space-y-4 mb-6">
            {/* Toggle crop mode */}
            <div className={`flex items-center gap-2 p-3 rounded-lg ${cropMode ? 'bg-yellow-50 border-2 border-yellow-300' : 'bg-gray-50'}`}>
              <input
                type="checkbox"
                id="crop-mode"
                checked={cropMode}
                onChange={(e) => {
                  const newCropMode = e.target.checked
                  setCropMode(newCropMode)
                  if (newCropMode) {
                    alert('⚠️ CẢNH BÁO: Bạn đã bật chế độ crop. Ảnh sẽ bị cắt theo vùng crop khi lưu. Nếu muốn upload ảnh gốc đầy đủ, hãy TẮT chế độ này trước khi lưu!')
                  }
                }}
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
              <label htmlFor="crop-mode" className={`text-sm font-medium cursor-pointer ${cropMode ? 'text-yellow-800 font-bold' : 'text-gray-700'}`}>
                {cropMode ? '⚠️ ĐANG BẬT - Ảnh sẽ bị cắt!' : 'Bật chế độ crop (kéo các cạnh để cắt ảnh)'}
              </label>
            </div>

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

            <div className={`p-4 rounded-lg ${cropMode ? 'bg-yellow-50 border-2 border-yellow-300' : 'bg-blue-50'}`}>
              <p className={`text-sm ${cropMode ? 'text-yellow-800' : 'text-blue-800'}`}>
                <strong>Hướng dẫn:</strong>
                <br />• <strong>Kéo ảnh:</strong> Click và kéo vùng nền để điều chỉnh vị trí ảnh
                <br />• <strong>Phóng to/thu nhỏ ảnh:</strong> Cuộn chuột hoặc dùng thanh trượt
                <br />• <strong>Kéo form đăng nhập:</strong> Click và kéo form để di chuyển vị trí
                <br />• <strong>Điều chỉnh kích thước form:</strong> Kéo các handle màu xanh ở 4 góc và 4 cạnh của form
                <br />• <strong>Chế độ crop:</strong> {cropMode ? (
                  <><span className="font-bold text-red-600">⚠️ ĐANG BẬT - Ảnh sẽ bị cắt theo vùng crop khi lưu!</span> Tắt checkbox để upload ảnh gốc đầy đủ.</>
                ) : (
                  <>Bật checkbox để kích hoạt. Kéo các handle ở 4 góc và 4 cạnh để điều chỉnh vùng crop. Kéo vùng crop để di chuyển.</>
                )}
                <br />• {cropMode ? (
                  <><strong className="text-red-600">⚠️ CẢNH BÁO:</strong> Ảnh sẽ được crop theo vùng đã chọn khi lưu. Nếu muốn upload ảnh gốc đầy đủ, hãy TẮT chế độ crop trước khi lưu!</>
                ) : (
                  <><strong className="text-green-600">✓ An toàn:</strong> Ảnh gốc sẽ được upload đầy đủ, không bị cắt xén</>
                )}
              </p>
            </div>
          </div>

          {/* Canvas ẩn để crop ảnh */}
          <canvas ref={canvasRef} className="hidden" />

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

