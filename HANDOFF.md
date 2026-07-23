# 交接筆記:週報產生器加後端(給家裡的 AI / 給自己對照用)

## 背景

這個專案(`weekly-report-app`,GitHub: `Guopee0310/weekly-report-app`)原本是純前端 Nuxt app(上傳 LINE 匯出的 txt → 產生週報 PDF)。這次改動要加後端,把兩件事搬到資料庫:

1. 人員資料(姓名/職稱/檔名縮寫)——原本寫死在 `app/utils/reportPeople.ts`,現在改成 API(`/api/people`)。
2. 每週共用的 LINE 匯出 txt——原本每個人都要自己上傳一次,現在改成任一人上傳後存到後端(`/api/weekly-upload`),其他人打開頁面會自動偵測到本週已有上傳,不用重傳。

**這次不做登入/多人帳號**(之後才要做)。

技術選型:PostgreSQL(架在 Supabase)+ Nuxt 內建的 Nitro server routes(`server/api/*`,沒有另外拉獨立後端專案)+ Prisma ORM。

所有程式碼已經寫完、`vue-tsc --noEmit` 型別檢查過關、已經 commit 並 push 到 `origin/master`(commit `ce043a3`)。**卡住的地方只有一個:在公司電腦(遠端連進公司網路)連不上 Supabase 的 Postgres,5432/6543 這兩個埠被擋了,只有 443 通**——這是網路層的問題,不是程式碼問題。猜測回家用自己的網路就不會被擋。

## 現在的狀態

- `git pull` 就會拿到所有後端程式碼(schema、API routes、前端整合)。
- **`.env` 沒有進 git**(本來就該排除,裡面是資料庫密碼),要自己在家裡重建。
- Prisma 裝的是最新的 **v7**,架構跟舊版不一樣,細節見下面「Prisma v7 的坑」。
- Supabase 資料庫目前是**全新、還沒建表**的狀態(`prisma migrate dev` 卡在連線失敗那一步,一次都還沒跑成功過)。

## 在家要做的步驟(照順序)

```bash
git pull

npm install
```

接著建立 `.env`(參考已經在 repo 裡的 `.env.example`),內容長這樣(`[YOUR-PROJECT-REF]` 和 `[YOUR-PASSWORD]` 換成你 Supabase 專案的實際值,去 Supabase 專案的 **Connect → ORM → Prisma** 分頁複製):

```env
# 給 app 執行期查詢用(走 pgbouncer 連線池,6543 埠)
DATABASE_URL="postgresql://postgres.[YOUR-PROJECT-REF]:[YOUR-PASSWORD]@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true"

# 給 prisma migrate 用的直連(5432 埠,不走連線池)
DIRECT_URL="postgresql://postgres.[YOUR-PROJECT-REF]:[YOUR-PASSWORD]@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres"
```

> 密碼裡如果有 `?`、`$`、`@`、`:`、`/`、`#` 這類符號,要做 URL 百分號編碼(例如 `?` → `%3F`,`$` → `%24`),不然連線字串會被切錯位置解析失敗。之前在公司這台機器上設定時,密碼裡就有 `?` 導致連線字串解析錯誤,是編碼過後才正常的——這組密碼先前在對話裡明碼貼過一次,建議找時間去 Supabase 專案設定重設一組新的,兩處 `.env` 都要換,比較保險。**這份檔案不要把實際密碼寫進來**,`.env` 本身已經被 `.gitignore` 排除,只有它可以放真正的值。

然後:

```bash
npx prisma generate
npm run db:migrate
```

`npm run db:migrate` 第一次執行會問 migration 名稱,隨便打一個像 `init` 就好。這個指令會:
1. 在 Supabase 建出 `Person`、`WeeklyUpload` 兩張表
2. 自動跑 `prisma/seed.ts`,把 6 筆人員資料寫進 `Person` 表

跑完之後啟動:

```bash
npm run dev
```

## 驗證方式

1. 開 `http://localhost:3000`,「我是」下拉選單應該要有 6 個名字(蕭國廷/林芷妤/杜佳穎/張婷/彭崇瑋/林芳宇)——這代表 `/api/people` 有正常從資料庫撈到資料。
2. 上傳一個 txt,畫面應該顯示上傳中/上傳完成,能正常產生 PDF。
3. 重新整理頁面(模擬另一個人打開),應該直接看到「本週已由其他人上傳:xxx.txt」,不會再看到上傳框,選個名字就能直接產生 PDF。
4. 點「改用自己的檔案上傳」應該能換掉本週的檔案重新上傳。

如果 `/api/people` 打開後顯示「找不到人員資料,請確認後端資料庫連線設定」,通常是 `.env` 沒填對或 migrate 還沒跑過。

## Prisma v7 的坑(如果之後要改 schema,這些要記得)

- v7 的 `prisma-client` generator 不再產生到 `node_modules`,而是產生到 `app/generated/prisma`(已經在 `.gitignore` 裡排除)。
- v7 **不支援**在 `schema.prisma` 的 `datasource` 區塊寫 `directUrl`(舊版可以,新版會報 `P1012` 錯誤)。正確做法:
  - `prisma.config.ts` 裡的 `datasource.url` 設成 `DIRECT_URL`(給 CLI 的 migrate/studio/seed 用,這些工具用的是 schema engine,需要不經過連線池的直連)。
  - **App 執行期的 `PrismaClient` 一定要透過 driver adapter 建立**(v7 拿掉了直接吃連線字串的 constructor 用法),已經在 `server/utils/prisma.ts` 和 `prisma/seed.ts` 裡用 `@prisma/adapter-pg` 的 `PrismaPg({ connectionString: process.env.DATABASE_URL })` 處理好了,用的是 `DATABASE_URL`(走連線池)。
- 簡單說:**CLI 操作(migrate/studio/seed)用 `DIRECT_URL`,App 執行期用 `DATABASE_URL`**,兩個 env 變數都要設,缺一個都不行。

## 完整計畫文件

更完整的原始規劃(Prisma schema 設計理由、API 設計、前端整合細節)存在這裡:
`C:\Users\TKB-USER\.claude\plans\dreamy-percolating-duckling.md`

如果家裡的 Claude Code 是新的 session、看不到這份對話紀錄,把這份 `HANDOFF.md` 貼給它就有足夠的上下文接著做。
