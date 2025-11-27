'use client'

import { useState, useEffect } from 'react'
import ChangePasswordForm from '@/components/settings/ChangePasswordForm'
import CategoryManagementForm from '@/components/settings/CategoryManagementForm'
import UserManagementForm from '@/components/settings/UserManagementForm'

export default function SettingsPage() {
  const [userRole, setUserRole] = useState<string | null>(null)

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
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8">Cài đặt</h1>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Đổi mật khẩu - Tất cả user đều có thể đổi */}
        <ChangePasswordForm />

        {/* Quản lý lĩnh vực - Chỉ dành cho admin */}
        {userRole === 'admin' && (
          <CategoryManagementForm />
        )}
      </div>

      {/* Quản lý người dùng - Chỉ dành cho admin */}
      {userRole === 'admin' && (
        <UserManagementForm />
      )}
    </div>
  )
}
