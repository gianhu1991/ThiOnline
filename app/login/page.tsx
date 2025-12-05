import { prisma } from '@/lib/prisma'
import LoginForm from './LoginForm'


// Generate static params for static export
export function generateStaticParams() {
  return []
}

export default async function LoginPage() {
  // Fetch background data từ server trước khi render
  let backgroundUrl: string | null = null
  let formPosition: { x: number; y: number; width: number; height: number } | null = null
  let subtitle = 'TTVT Nho Quan - Phần mềm đào tạo kỹ thuật'

  try {
    const [backgroundSetting, formPositionSetting, subtitleSetting] = await Promise.all([
      prisma.settings.findUnique({ where: { key: 'login_background' } }),
      prisma.settings.findUnique({ where: { key: 'login_form_position' } }),
      prisma.settings.findUnique({ where: { key: 'login_subtitle' } }),
    ])

    backgroundUrl = backgroundSetting?.value || null
    
    if (formPositionSetting?.value) {
      try {
        formPosition = JSON.parse(formPositionSetting.value)
      } catch (e) {
        console.error('Error parsing formPosition:', e)
      }
    }

    subtitle = subtitleSetting?.value || 'TTVT Nho Quan - Phần mềm đào tạo kỹ thuật'
  } catch (error) {
    console.error('Error fetching login background:', error)
  }

  return (
    <LoginForm 
      initialBackgroundUrl={backgroundUrl}
      initialFormPosition={formPosition}
      initialSubtitle={subtitle}
    />
  )
}

