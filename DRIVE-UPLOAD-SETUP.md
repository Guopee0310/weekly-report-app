# 交接筆記:週報 PDF 自動上傳 Google Drive(改用 Apps Script 版)

> 這份文件是要貼給「瀏覽器裡操作 Google 畫面的 AI」看的,目的是帶著使用者(不是工程師,是這個專案的維護者)手動點完 script.google.com 的設定畫面。**請不要要求使用者把程式碼裡的 `SHARED_SECRET` 或部署網址貼進這個對話框**——這兩個是機密資訊,只要協助使用者在畫面上點選、貼程式碼、部署就好。

## 背景(前因後果,含之前走過的彎路)

這是一個內部工具「週報產生器」(Nuxt app,`weekly-report-app`),讓同事把 LINE 群組匯出的 txt 檔轉成週報 PDF。目前的痛點:PDF 產生後只會存到使用者本機的下載資料夾,還要使用者自己手動把檔案拖進公司 Google Drive 裡對應週別的子資料夾(例如 `7.17-7.23`)。因為用這工具的人大多不是技術人員,不能要求每個人都多做這個手動搬檔案的動作。

**第一版方案(已放棄)**:原本想用 Google 服務帳號(service account)+ Google Cloud 專案來自動上傳,已經實際做完設定並測試,但卡在一個 Google Drive API 的硬限制:**服務帳號沒有自己的儲存空間額度**,可以讀取資料夾內容、可以建立空資料夾,但沒辦法真的寫入檔案內容到別人的個人資料夾裡(即使那個資料夾開了「知道連結即可編輯」的共用設定也一樣)——因為那個資料夾裡的檔案儲存空間額度,永遠算在資料夾擁有者的個人帳號頭上,服務帳號無法代替消耗。錯誤訊息是:「Service Accounts do not have storage quota. Leverage shared drives, or use OAuth delegation instead.」

**現在改用的方案:Google Apps Script**。這個方案用使用者「自己的」Google 身分去執行程式碼——因為是真人帳號,本來就有儲存空間額度,完全不會遇到上面那個問題。做法是:用一個有權限存取目標 Drive 資料夾的 Google 帳號,在 script.google.com 建一個小腳本專案,部署成「網頁應用程式(Web App)」,取得一個網址。之後 PDF 產生時,前端會呼叫我方伺服器的 API,伺服器再把請求轉發給這個 Apps Script 網址,由它用「執行者本人」的身分把檔案寫進 Drive。

**這一步的關鍵**:Apps Script 網頁應用程式設定「執行身分:我」,代表不管是誰(或哪支程式)呼叫這個網址,實際操作 Drive 的都是**部署這個腳本的人**,不是呼叫者。所以其他使用這個週報工具的同事完全不需要登入 Google、不需要做任何額外操作——他們只要跟平常一樣按「產生 PDF」,上傳這件事會在背景自動完成。

**程式碼那邊已經改完了**(在另一個 AI session、也就是 Claude Code 裡完成的):`server/api/drive-upload.post.ts` 現在會把 PDF 轉發給 Apps Script 網址。**這份文件要幫的,就是建立、部署那個 Apps Script,並把網址和一組共用密鑰交給我。**

## 需要帶使用者完成的步驟

### 1. 開新的 Apps Script 專案
- 前往 https://script.google.com
- **用有權限存取目標 Drive 資料夾的 Google 帳號登入**(通常就是平常會手動把 PDF 拖進 Drive 資料夾的那個帳號)
- 「新增專案」,專案名稱隨意,例如「週報自動上傳」

### 2. 貼上以下程式碼(整份取代編輯器裡預設的空白內容)

```javascript
const PARENT_FOLDER_ID = '1d8YiGsEiyt7b_7Cxv0Ludy6iSmrqM0UX'
const SHARED_SECRET = '請把這裡換成一串自己亂打的英數字,例如 8f3kD9xQmZ2pL7vR'

function doPost(e) {
  const body = JSON.parse(e.postData.contents)

  if (body.secret !== SHARED_SECRET) {
    return ContentService.createTextOutput(JSON.stringify({ error: 'unauthorized' }))
      .setMimeType(ContentService.MimeType.JSON)
  }

  const parent = DriveApp.getFolderById(PARENT_FOLDER_ID)
  const existing = parent.getFoldersByName(body.weekLabel)
  const weekFolder = existing.hasNext() ? existing.next() : parent.createFolder(body.weekLabel)

  const bytes = Utilities.base64Decode(body.pdfBase64)
  const blob = Utilities.newBlob(bytes, 'application/pdf', body.fileName)
  const file = weekFolder.createFile(blob)

  return ContentService.createTextOutput(JSON.stringify({ fileId: file.getId(), url: file.getUrl() }))
    .setMimeType(ContentService.MimeType.JSON)
}
```

**提醒使用者**:一定要把 `SHARED_SECRET` 那一行的值換成自己亂打的一串英數字(不要用範例裡的字串),這是防止這個網址外流之後被別人亂上傳檔案用的密鑰。換完之後**記住這串值**(等一下要填進專案的 `.env`,而且要跟這裡填的完全一樣)。

`PARENT_FOLDER_ID` 已經是正確的目標資料夾 ID,不用改。

### 3. 部署成網頁應用程式(Web App)
- 右上角「部署」→「新增部署作業」
- 類型選「網頁應用程式」
- 執行身分:**我**
- 誰可以存取:**任何人**
- 按「部署」
- 過程中會跳出 Google 的授權畫面(因為這個腳本要存取你自己的 Drive),選「進階」→「前往[專案名稱](不安全)」→ 允許——這是正常的,因為是自己寫的腳本存取自己的 Drive,Google 對所有沒送審的 Apps Script 都會顯示這個警告
- 部署完成後,會顯示一個「網頁應用程式網址」,結尾是 `/exec`,**把這個網址記下來**

### 4. 把網址跟密鑰交回來

把下面兩樣東西給我(或直接自己填進專案根目錄 `C:\Users\TKB-USER\weekly-report-app\.env`):
- 步驟 3 拿到的部署網址 → 填進 `.env` 的 `GAS_DRIVE_UPLOAD_URL`
- 步驟 2 設定的 `SHARED_SECRET` 值 → 填進 `.env` 的 `GAS_SHARED_SECRET`(兩邊要一模一樣)

## 完成後怎麼確認

1. 回到 Claude Code,請它跑一次 `npm run dev`,實際選人、產生一份週報 PDF。
2. 確認畫面上的狀態訊息從「正在自動上傳到雲端硬碟...」變成「已自動上傳到雲端硬碟的對應週資料夾」,而不是顯示上傳失敗。
3. 用有這個資料夾權限的帳號登入瀏覽器,打開 https://drive.google.com/drive/folders/1d8YiGsEiyt7b_7Cxv0Ludy6iSmrqM0UX ,確認裡面出現一個像 `7.17-7.23` 的子資料夾,裡面有剛才產生的 PDF。

## 收尾:第一版方案留下的東西(已處理)

之前建立的 GCP 專案(`weekly-report-upload`)**已經刪除**。如果下載資料夾裡還留著 `weekly-report-upload-13ad06731a66.json` 這個金鑰檔,也可以順手刪掉(專案刪了,這個檔案本身已經失效,留著也無妨,單純只是不需要了)。

## 完整技術規劃文件(給接手的工程 AI 看,不需要拿給使用者)

更完整的程式碼實作細節、設計決策存在這裡:
`C:\Users\TKB-USER\.claude\plans\mutable-foraging-aho.md`
（該文件寫的是第一版服務帳號方案,已被本文件取代;程式碼實作的部分——`fmtMNoZero`、`useReportPdfGenerator.ts` 改回傳 base64、`index.vue` 的 `handleGenerate` 軟失敗處理——仍然有效,唯一改變的是 `server/api/drive-upload.post.ts` 內部怎麼把檔案送到 Drive。）
