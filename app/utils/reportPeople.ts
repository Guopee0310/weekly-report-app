import type { PersonInfo } from '~/types/weeklyReport'

// 之後要新增同事,在這裡多加一行就好
export const PEOPLE: Record<string, PersonInfo> = {
  蕭國廷: { title: '前端工程師', filenameLabel: '設計組' },
  林芷妤: { title: '前端工程師', filenameLabel: '設計組' },
  杜佳穎: { title: '前端工程師', filenameLabel: '技術組' },
  張婷: { title: '網頁設計師', filenameLabel: '設計組' },
  彭崇瑋: { title: '網頁設計師', filenameLabel: '設計組' },
  林芳宇: { title: '網頁設計師', filenameLabel: '設計組' },
}

export const FIXED_DIVISION = '雲端技術處'
