import Link from 'next/link'

export default function Home() {
  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-4xl font-bold text-center mb-8">
        Chào mừng đến với Hệ thống Thi Trắc Nghiệm Online
      </h1>
      
      <div className="grid md:grid-cols-2 gap-6 mt-12">
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h2 className="text-2xl font-semibold mb-4">Ngân hàng câu hỏi</h2>
          <p className="text-gray-600 mb-4">
            Quản lý và import câu hỏi từ file Excel hoặc PDF
          </p>
          <Link
            href="/questions"
            className="inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Xem ngân hàng câu hỏi
          </Link>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h2 className="text-2xl font-semibold mb-4">Quản lý bài thi</h2>
          <p className="text-gray-600 mb-4">
            Tạo và quản lý các bài thi trắc nghiệm
          </p>
          <Link
            href="/exams"
            className="inline-block bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
          >
            Xem bài thi
          </Link>
        </div>
      </div>
    </div>
  )
}

