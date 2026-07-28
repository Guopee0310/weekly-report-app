# 交接筆記:週報產生器(給家裡的 AI / 給自己對照用)

> 最後更新:2026-07-28。這份文件原本是「加後端」的交接筆記,當時卡在公司連不上 Supabase。
> 那個問題已經解決,後端已經在跑了——這次更新把過時的部分改掉,並補上後來才發現、原文件沒提到的坑。

## 背景

這個專案(`weekly-report-app`,GitHub: `Guopee0310/weekly-report-app`)原本是純前端 Nuxt app(上傳 LINE 匯出的 txt → 產生週報 PDF)。後來加了後端,把兩件事搬到資料庫:

1. 人員資料(姓名/職稱/檔名縮寫/部門)——原本寫死在 `app/utils/reportPeople.ts`,現在改成 API(`/api/people`)。
2. 每週共用的 LINE 匯出 txt——原本每個人都要自己上傳一次,現在改成任一人上傳後存到後端(`/api/weekly-upload`),其他人打開頁面會自動偵測到本週已有上傳,不用重傳。

技術選型:PostgreSQL(架在 Supabase)+ Nuxt 內建的 Nitro server routes(`server/api/*`,沒有另外拉獨立後端專案)+ Prisma ORM v7。

## 現在的狀態(已完成)

- **Supabase 連線問題已解決**(原本卡在公司網路擋 5432/6543 埠,回家用自己的網路就通了)。本機 `.env` 已建好,`prisma migrate dev` 已經成功跑過兩次:
  - `20260723153807_init` — 建出 `Person`、`WeeklyUpload` 兩張表
  - `20260723160149_add_department` — 幫 `Person` 加上 `department` 欄位
- `prisma/seed.ts` 現在寫了 **14 筆人員資料**(原文件寫「6 筆/6 個名字」已過時,後來補了課務客服處的人):蕭國廷、林芷妤、杜佳穎、張婷、彭崇瑋、林芳宇(雲端技術處/設計組)、黃竹瑜、黃竹瑋、李沅霖(雲端技術處/程式組)、謝亞靜、吳承芸、葉大榮、蔡欣儒、朱玉娟(課務客服處/課務客服組)。
- `/api/people`、`/api/weekly-upload`(GET/POST)都已實作並接上前端,平常開發就是 `npm run dev` 直接可用,不用再重跑 migrate。

## ⚠️ 發現一個過時/沒接上的地方:`login.vue` 和 `auth.ts` store

`app/pages/login.vue` 和 `app/stores/auth.ts` 這兩個檔案其實是**從最初的純前端 commit 就存在**的舊東西(不是這次後端工作加的),但目前**完全沒有被接到任何地方**——沒有 route middleware、`app/pages/index.vue` 和 `app/layouts/default.vue` 都沒有引用 `useAuthStore()`。也就是說:

- 使用者現在打開網站**不會被導去登入頁**,`login.vue` 是個孤立、沒人連結過去的頁面。
- `auth.ts` store 只是把名字存進 `localStorage`,連前端內部都沒人用它。

如果之後要做「登入/多人帳號」,可以參考這兩個檔案當起點,但要先決定:是要繼續走純前端 localStorage 這種假登入,還是要做真的後端 session/帳號(目前 `Person` 表沒有密碼欄位,`/api/people` 也沒有任何驗證)。**這次更新沒有動這兩個檔案**,只是記錄下來避免以後誤以為登入功能已經在運作。

## 部署

已經部署在 **Vercel**(`nuxt.config.ts` 裡的 og:url 寫死 `https://weekly-report-app-kappa.vercel.app/`)。Nuxt 對 Vercel 有原生 preset,不用額外設定檔;但記得 Vercel 專案的環境變數要設 `DATABASE_URL` 和 `DIRECT_URL`(跟本機 `.env` 分開設定,不會自動同步)。

## 在新機器上開發要做的步驟(照順序)

```bash
git pull
npm install
```

建立 `.env`(參考 repo 裡的 `.env.example`),去 Supabase 專案的 **Connect → ORM → Prisma** 分頁複製:

```env
# 給 app 執行期查詢用(走 pgbouncer 連線池,6543 埠)
DATABASE_URL="postgresql://postgres.[YOUR-PROJECT-REF]:[YOUR-PASSWORD]@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true"

# 給 prisma migrate 用的直連(5432 埠,不走連線池)
DIRECT_URL="postgresql://postgres.[YOUR-PROJECT-REF]:[YOUR-PASSWORD]@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres"
```

> 密碼裡如果有 `?`、`$`、`@`、`:`、`/`、`#` 這類符號,要做 URL 百分號編碼(例如 `?` → `%3F`,`$` → `%24`),不然連線字串會被切錯位置解析失敗。

資料庫這邊表已經建好,**不需要再跑 `db:migrate`**(除非要改 schema)。直接:

```bash
npx prisma generate
npm run dev
```

如果是全新的 Supabase 專案(例如要換一個資料庫),才需要:

```bash
npm run db:migrate   # 第一次會問 migration 名稱,建完表後會自動跑 seed
```

## 驗證方式

1. 開 `http://localhost:3000`,「我是」下拉選單應該要有 14 個名字——代表 `/api/people` 有正常從資料庫撈到資料。
2. 上傳一個 txt,畫面應該顯示上傳中/上傳完成,能正常產生 PDF。
3. 重新整理頁面(模擬另一個人打開),應該直接看到「本週已由其他人上傳:xxx.txt」,不會再看到上傳框,選個名字就能直接產生 PDF。
4. 點「檔案有誤?」會先跳確認視窗,按「確定」後才會清空共用檔案並自動跳出選檔案視窗(這是 `f626d25` 這個 commit 加的,避免誤觸)。

如果 `/api/people` 打開後顯示「找不到人員資料,請確認後端資料庫連線設定」,通常是 `.env` 沒填對或該資料庫還沒跑過 migrate。

## Prisma v7 的坑(改 schema 時要記得,這段仍然有效)

- v7 的 `prisma-client` generator 不再產生到 `node_modules`,而是產生到 `app/generated/prisma`(在 `.gitignore` 裡排除)。
- v7 **不支援**在 `schema.prisma` 的 `datasource` 區塊寫 `directUrl`(會報 `P1012`)。正確做法:
  - `prisma.config.ts` 裡的 `datasource.url` 設成 `DIRECT_URL`(給 CLI 的 migrate/studio/seed 用)。
  - **App 執行期的 `PrismaClient` 一定要透過 driver adapter 建立**,已經在 `server/utils/prisma.ts` 和 `prisma/seed.ts` 裡用 `@prisma/adapter-pg` 的 `PrismaPg({ connectionString: process.env.DATABASE_URL })` 處理好了,用的是 `DATABASE_URL`(走連線池)。
- 簡單說:**CLI 操作(migrate/studio/seed)用 `DIRECT_URL`,App 執行期用 `DATABASE_URL`**,兩個 env 變數都要設,缺一個都不行。

## 完整計畫文件

更完整的原始規劃(Prisma schema 設計理由、API 設計、前端整合細節)存在這裡:
`C:\Users\TKB-USER\.claude\plans\dreamy-percolating-duckling.md`

如果家裡的 Claude Code 是新的 session、看不到這份對話紀錄,把這份 `HANDOFF.md` 貼給它就有足夠的上下文接著做。
