'use client'

import { useState, useEffect } from 'react'
import ChangePasswordForm from '@/components/settings/ChangePasswordForm'
import CategoryManagementForm from '@/components/settings/CategoryManagementForm'
import UserManagementForm from '@/components/settings/UserManagementForm'

type SettingsTab = 'password' | 'category' | 'user'

export default function SettingsPage() {
  const [userRole, setUserRole] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<SettingsTab>('password')

  useEffect(() => {
    checkUserRole()
  }, [])

  const checkUserRole = async () => {
    try {
      const res = await fetch('/api/auth/me', {
        credentials: 'include',
      })
      if (res.ok) {
        const data = await res.json()
        setUserRole(data.user?.role || null)
      }
    } catch (error) {
      console.error('Error checking user role:', error)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <h1 className="text-3xl font-bold mb-8">Cài đặt</h1>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Menu bên trái */}
        <div className="w-full md:w-64 flex-shrink-0">
          <div className="card p-0 overflow-hidden">
            <div className="bg-blue-600 text-white px-4 py-3 font-semibold">
              Chức năng
            </div>
            <div className="divide-y divide-gray-200">
              <button
                onClick={() => setActiveTab('password')}
                className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors ${
                  activeTab === 'password' ? 'bg-blue-50 border-l-4 border-blue-600' : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                  </svg>
                  <span className={`font-medium ${activeTab === 'password' ? 'text-blue-600' : 'text-gray-700'}`}>
                    Đổi mật khẩu
                  </span>
                </div>
              </button>

              {userRole === 'admin' && (
                <>
                  <button
                    onClick={() => setActiveTab('category')}
                    className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors ${
                      activeTab === 'category' ? 'bg-blue-50 border-l-4 border-blue-600' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                      </svg>
                      <span className={`font-medium ${activeTab === 'category' ? 'text-blue-600' : 'text-gray-700'}`}>
                        Quản lý lĩnh vực
                      </span>
                    </div>
                  </button>

                  <button
                    onClick={() => setActiveTab('user')}
                    className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors ${
                      activeTab === 'user' ? 'bg-blue-50 border-l-4 border-blue-600' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                      <span className={`font-medium ${activeTab === 'user' ? 'text-blue-600' : 'text-gray-700'}`}>
                        Quản lý người dùng
                      </span>
                    </div>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Nội dung bên phải */}
        <div className="flex-1">
          {activeTab === 'password' && <ChangePasswordForm />}
          {activeTab === 'category' && userRole === 'admin' && <CategoryManagementForm />}
          {activeTab === 'user' && userRole === 'admin' && <UserManagementForm />}
        </div>
      </div>
    </div>
  )
}
