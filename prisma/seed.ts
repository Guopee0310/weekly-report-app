import 'dotenv/config'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../app/generated/prisma/client'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter })

const PEOPLE = [
  { name: '蕭國廷', title: '前端工程師', filenameLabel: '設計組', department: '雲端技術處' },
  { name: '林芷妤', title: '前端工程師', filenameLabel: '設計組', department: '雲端技術處' },
  { name: '杜佳穎', title: '前端工程師', filenameLabel: '設計組', department: '雲端技術處' },
  { name: '張婷', title: '網頁設計師', filenameLabel: '設計組', department: '雲端技術處' },
  { name: '彭崇瑋', title: '網頁設計師', filenameLabel: '設計組', department: '雲端技術處' },
  { name: '林芳宇', title: '網頁設計師', filenameLabel: '設計組', department: '雲端技術處' },
  { name: '黃竹瑜', title: '後端工程師', filenameLabel: '程式組', department: '雲端技術處' },
  { name: '黃竹瑋', title: '後端工程師', filenameLabel: '程式組', department: '雲端技術處' },
  { name: '李沅霖', title: '後端工程師', filenameLabel: '程式組', department: '雲端技術處' },
  { name: '謝亞靜', title: '客服', filenameLabel: '課務客服組', department: '課務客服處' },
  { name: '吳承芸', title: '教務', filenameLabel: '課務客服組', department: '課務客服處' },
  { name: '葉大榮', title: '主任', filenameLabel: '課務客服組', department: '課務客服處' },
  { name: '蔡欣儒', title: '課務／PM', filenameLabel: '課務客服組', department: '課務客服處' },
  { name: '朱玉娟', title: '剪輯', filenameLabel: '課務客服組', department: '課務客服處' },
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
