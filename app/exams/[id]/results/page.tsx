'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { format } from 'date-fns'
import { vi } from 'date-fns/locale'
import Link from 'next/link'

interface ExamResult {
  id: string
  studentName: string | null
  studentId: string | null
  score: number
  totalQuestions: number
  correctAnswers: number
  timeSpent: number
  attemptNumber: number
  completedAt: string
}


export default function ExamResultsPage() {
  const router = useRouter()
  const params = useParams()
  const examId = params.id as string
  const [allResults, setAllResults] = useState<ExamResult[]>([])
  const [filteredResults, setFilteredResults] = useState<ExamResult[]>([])
  const [loading, setLoading] = useState(true)
  
  // Filter states
  const [filterName, setFilterName] = useState('')
  const [filterId, setFilterId] = useState('')
  const [filterScoreMin, setFilterScoreMin] = useState('')
  const [filterScoreMax, setFilterScoreMax] = useState('')
  const [filterAttempt, setFilterAttempt] = useState('')
  const [filterDateFrom, setFilterDateFrom] = useState('')
  const [filterDateTo, setFilterDateTo] = useState('')

  useEffect(() => {
    fetchResults()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [allResults, filterName, filterId, filterScoreMin, filterScoreMax, filterAttempt, filterDateFrom, filterDateTo])

  const fetchResults = async () => {
    try {
      const res = await fetch(`/api/exams/${examId}/results`)
      const data = await res.json()
      // Đảm bảo data là array
      const resultsArray = Array.isArray(data) ? data : []
      setAllResults(resultsArray)
      setFilteredResults(resultsArray)
    } catch (error) {
      console.error('Error fetching results:', error)
      setAllResults([])
      setFilteredResults([])
    } finally {
      setLoading(false)
    }
  }

  const applyFilters = () => {
    let filtered = [...allResults]

    // Lọc theo tên
    if (filterName.trim()) {
      filtered = filtered.filter(r => 
        r.studentName?.toLowerCase().includes(filterName.toLowerCase().trim())
      )
    }

    // Lọc theo mã nhân viên
    if (filterId.trim()) {
      filtered = filtered.filter(r => 
        r.studentId?.toLowerCase().includes(filterId.toLowerCase().trim())
      )
    }

    // Lọc theo điểm (min)
    if (filterScoreMin.trim()) {
      const min = parseFloat(filterScoreMin)
      if (!isNaN(min)) {
        filtered = filtered.filter(r => r.score >= min)
      }
    }

    // Lọc theo điểm (max)
    if (filterScoreMax.trim()) {
      const max = parseFloat(filterScoreMax)
      if (!isNaN(max)) {
        filtered = filtered.filter(r => r.score <= max)
      }
    }

    // Lọc theo lần làm
    if (filterAttempt.trim()) {
      const attempt = parseInt(filterAttempt)
      if (!isNaN(attempt)) {
        filtered = filtered.filter(r => r.attemptNumber === attempt)
      }
    }

    // Lọc theo thời gian nộp (từ ngày)
    if (filterDateFrom.trim()) {
      const fromDate = new Date(filterDateFrom)
      fromDate.setHours(0, 0, 0, 0)
      filtered = filtered.filter(r => {
        const completedDate = new Date(r.completedAt)
        completedDate.setHours(0, 0, 0, 0)
        return completedDate >= fromDate
      })
    }

    // Lọc theo thời gian nộp (đến ngày)
    if (filterDateTo.trim()) {
      const toDate = new Date(filterDateTo)
      toDate.setHours(23, 59, 59, 999)
      filtered = filtered.filter(r => {
        const completedDate = new Date(r.completedAt)
        return completedDate <= toDate
      })
    }

    setFilteredResults(filtered)
  }

  const clearFilters = () => {
    setFilterName('')
    setFilterId('')
    setFilterScoreMin('')
    setFilterScoreMax('')
    setFilterAttempt('')
    setFilterDateFrom('')
    setFilterDateTo('')
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins} phút ${secs} giây`
  }

  if (loading) {
    return <div className="text-center py-8">Đang tải...</div>
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Kết quả bài thi</h1>
        <Link
          href="/exams"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Về danh sách bài thi
        </Link>
      </div>

      {/* Bộ lọc */}
      <div className="bg-white p-6 rounded-lg shadow-lg mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Bộ lọc</h2>
          <button
            onClick={clearFilters}
            className="text-sm text-blue-600 hover:text-blue-800 underline"
          >
            Xóa bộ lọc
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Lọc theo tên */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Họ và tên
            </label>
            <input
              type="text"
              value={filterName}
              onChange={(e) => setFilterName(e.target.value)}
              placeholder="Nhập tên..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Lọc theo mã nhân viên */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mã nhân viên
            </label>
            <input
              type="text"
              value={filterId}
              onChange={(e) => setFilterId(e.target.value)}
              placeholder="Nhập mã..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Lọc theo điểm (min) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Điểm từ
            </label>
            <input
              type="number"
              step="0.1"
              min="0"
              max="10"
              value={filterScoreMin}
              onChange={(e) => setFilterScoreMin(e.target.value)}
              placeholder="0.0"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Lọc theo điểm (max) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Điểm đến
            </label>
            <input
              type="number"
              step="0.1"
              min="0"
              max="10"
              value={filterScoreMax}
              onChange={(e) => setFilterScoreMax(e.target.value)}
              placeholder="10.0"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Lọc theo lần làm */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Lần làm
            </label>
            <input
              type="number"
              min="1"
              value={filterAttempt}
              onChange={(e) => setFilterAttempt(e.target.value)}
              placeholder="Nhập lần làm..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Lọc theo ngày từ */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Từ ngày
            </label>
            <input
              type="date"
              value={filterDateFrom}
              onChange={(e) => setFilterDateFrom(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Lọc theo ngày đến */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Đến ngày
            </label>
            <input
              type="date"
              value={filterDateTo}
              onChange={(e) => setFilterDateTo(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Hiển thị số kết quả */}
        <div className="mt-4 text-sm text-gray-600">
          Hiển thị <span className="font-semibold">{filteredResults.length}</span> / <span className="font-semibold">{allResults.length}</span> kết quả
        </div>
      </div>

      {filteredResults.length === 0 ? (
        <div className="bg-white p-8 rounded-lg shadow-lg text-center text-gray-500">
          {allResults.length === 0 ? 'Chưa có kết quả nào.' : 'Không tìm thấy kết quả phù hợp với bộ lọc.'}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                  STT
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                  Họ và tên
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                  Mã nhân viên
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                  Điểm
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                  Đúng/Sai
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                  Thời gian
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                  Lần làm
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                  Thời gian nộp
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredResults.map((result, index) => (
                <tr key={result.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm">{index + 1}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    {result.studentName || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {result.studentId || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`text-sm font-semibold ${
                        result.score >= 5 ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      {result.score.toFixed(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className="text-green-600">{result.correctAnswers}</span> /{' '}
                    <span className="text-red-600">
                      {result.totalQuestions - result.correctAnswers}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatTime(result.timeSpent)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {result.attemptNumber}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {format(new Date(result.completedAt), 'dd/MM/yyyy HH:mm', { locale: vi })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

