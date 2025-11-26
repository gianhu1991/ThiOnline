import { prisma } from './prisma'
import { compare, hash } from 'bcryptjs'

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  try {
    return await compare(password, hashedPassword)
  } catch {
    return false
  }
}

export async function hashPassword(password: string): Promise<string> {
  return await hash(password, 12)
}

export async function authenticateUser(username: string, password: string) {
  const user = await prisma.user.findUnique({
    where: { username },
  })

  if (!user) {
    return null
  }

  const isValid = await verifyPassword(password, user.password)
  if (!isValid) {
    return null
  }

  return { id: user.id, username: user.username }
}

export async function initAdminUser() {
  const admin = await prisma.user.findUnique({
    where: { username: 'admin' },
  })

  if (!admin) {
    const hashedPassword = await hashPassword('Bdnb@999')
    await prisma.user.create({
      data: {
        username: 'admin',
        password: hashedPassword,
      },
    })
  }
}

