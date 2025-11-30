'use client'

import { useState, useRef, useEffect } from 'react'

interface CheckboxDropdownProps {
  label: string
  items: Array<{ id: string; label: string }>
  selectedIds: string[]
  onSelectionChange: (selectedIds: string[]) => void
  placeholder?: string
}

export default function CheckboxDropdown({
  label,
  items,
  selectedIds,
  onSelectionChange,
  placeholder = 'Chọn...',
}: CheckboxDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

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
      <label className="block mb-2 font-semibold text-gray-700 text-sm">{label}</label>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full input-field text-left flex items-center justify-between"
      >
        <span className={selectedCount === 0 ? 'text-gray-400' : ''}>{displayText}</span>
        <svg
          className={`w-5 h-5 text-gray-500 transition-transform ${isOpen ? 'transform rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          <div className="p-2 space-y-1">
            {items.length === 0 ? (
              <div className="text-sm text-gray-500 p-2">Không có mục nào</div>
            ) : (
              items.map((item) => {
                const isChecked = selectedIds.includes(item.id)
                return (
                  <label
                    key={item.id}
                    className="flex items-center p-2 hover:bg-gray-50 cursor-pointer rounded"
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => toggleItem(item.id)}
                      className="mr-3 rounded"
                    />
                    <span className="text-sm text-gray-700 flex-1">{item.label}</span>
                  </label>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}

