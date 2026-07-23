import 'dotenv/config'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../app/generated/prisma/client'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter })

const PEOPLE = [
  { name: '蕭國廷', title: '前端工程師', filenameLabel: '設計組' },
  { name: '林芷妤', title: '前端工程師', filenameLabel: '設計組' },
  { name: '杜佳穎', title: '前端工程師', filenameLabel: '技術組' },
  { name: '張婷', title: '網頁設計師', filenameLabel: '設計組' },
  { name: '彭崇瑋', title: '網頁設計師', filenameLabel: '設計組' },
  { name: '林芳宇', title: '網頁設計師', filenameLabel: '設計組' },
]

async function main(): Promise<void> {
  for (const person of PEOPLE) {
    await prisma.person.upsert({
      where: { name: person.name },
      update: person,
      create: person,
    })
  }
  console.log(`已寫入 ${PEOPLE.length} 筆人員資料`)
}

main()
  .catch((err) => {
    console.error(err)
    process.exitCode = 1
  })
  .finally(() => prisma.$disconnect())
