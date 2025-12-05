'use client'

import { useState, useRef, useEffect } from 'react'

interface CheckboxDropdownProps {
  label: string
  items: Array<{ id: string; label: string }>
  selectedIds: string[]
  onSelectionChange: (selectedIds: string[]) => void
  placeholder?: string
  onOpen?: () => void // Callback khi mở dropdown (lazy load)
}

export default function CheckboxDropdown({
  label,
  items,
  selectedIds,
  onSelectionChange,
  placeholder = 'Chọn...',
  onOpen,
}: CheckboxDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setSearchTerm('') // Reset search when closing
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])
  
  // Reset search term when dropdown closes
  useEffect(() => {
    if (!isOpen) {
      setSearchTerm('')
    }
  }, [isOpen])

  const toggleItem = (id: string) => {
    if (selectedIds.includes(id)) {
      onSelectionChange(selectedIds.filter(selectedId => selectedId !== id))
    } else {
      onSelectionChange([...selectedIds, id])
    }
  }

  const selectedCount = selectedIds.length
  const displayText = selectedCount === 0 
    ? placeholder 
    : selectedCount === 1
    ? items.find(item => item.id === selectedIds[0])?.label || `${selectedCount} mục đã chọn`
    : `${selectedCount} mục đã chọn`

  return (
    <div className="relative" ref={dropdownRef}>
      {label && <label className="block mb-2 font-semibold text-gray-700 text-sm">{label}</label>}
      <button
        type="button"
        onClick={() => {
          if (!isOpen && onOpen) {
            onOpen() // Lazy load khi mở dropdown
          }
          setIsOpen(!isOpen)
        }}
        className={`w-full px-4 py-2.5 text-left flex items-center justify-between bg-white border-2 rounded-lg transition-all ${
          isOpen 
            ? 'border-blue-500 shadow-md' 
            : selectedCount > 0
            ? 'border-blue-300 shadow-sm'
            : 'border-gray-300 hover:border-gray-400'
        }`}
      >
        <span className={`text-sm flex-1 truncate ${selectedCount === 0 ? 'text-gray-400' : 'text-gray-700 font-medium'}`}>
          {displayText}
        </span>
        <svg
          className={`w-5 h-5 text-gray-500 transition-transform flex-shrink-0 ml-2 ${isOpen ? 'transform rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-white border-2 border-gray-200 rounded-lg shadow-xl max-h-60 flex flex-col">
          {/* Search box */}
          <div className="p-2 border-b border-gray-200 sticky top-0 bg-white">
            <input
              type="text"
              placeholder="Tìm kiếm..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
          
          {/* Items list with scroll */}
          <div className="overflow-y-auto flex-1">
            <div className="p-2">
              {(() => {
                const filteredItems = items.filter(item =>
                  item.label.toLowerCase().includes(searchTerm.toLowerCase())
                )
                
                if (filteredItems.length === 0) {
                  return (
                    <div className="text-sm text-gray-500 p-3 text-center">
                      {searchTerm ? 'Không tìm thấy' : 'Không có mục nào'}
                    </div>
                  )
                }
                
                return filteredItems.map((item) => {
                  const isChecked = selectedIds.includes(item.id)
                  return (
                    <label
                      key={item.id}
                      className={`flex items-center p-2.5 cursor-pointer rounded transition-colors ${
                        isChecked ? 'bg-blue-50' : 'hover:bg-gray-50'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleItem(item.id)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                      />
                      <span className={`text-sm ml-3 flex-1 ${isChecked ? 'text-blue-900 font-medium' : 'text-gray-700'}`}>
                        {item.label}
                      </span>
                    </label>
                  )
                })
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

