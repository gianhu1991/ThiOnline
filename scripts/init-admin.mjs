import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const admin = await prisma.user.findUnique({
    where: { username: 'admin' },
  })

  if (!admin) {
    const hashedPassword = await bcrypt.hash('Bdnb@999', 12)
    await prisma.user.create({
      data: {
        username: 'admin',
        password: hashedPassword,
      },
    })
    console.log('✅ Admin user created successfully!')
    console.log('Username: admin')
    console.log('Password: Bdnb@999')
  } else {
    console.log('ℹ️ Admin user already exists')
  }
}

main()
  .catch((e) => {
    console.error('Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

