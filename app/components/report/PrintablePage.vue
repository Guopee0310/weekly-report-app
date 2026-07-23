<script setup lang="ts">
import type { ReportData, ReportPage } from '~/types/weeklyReport'

const props = defineProps<{
  page: ReportPage
  data: ReportData
}>()
</script>

<template>
  <div class="page-render">
    <img class="doc-logo" src="/logo.jpeg" alt="" />

    <template v-if="!props.page.footerOnly">
      <template v-if="props.page.isFirstPage">
        <div class="doc-title">
          TKB EC 事業群/部門週報<span class="ver">版本:20150420</span>
        </div>
        <table class="doc-table doc-header-table">
          <tbody>
            <tr>
              <td class="label"><div class="cell-wrap">部門</div></td>
              <td class="value"><div class="cell-wrap">{{ props.data.division }}</div></td>
              <td class="label" rowspan="2"><div class="cell-wrap">期<br />間</div></td>
              <td class="value" rowspan="2"><div class="cell-wrap cell-wrap--daterange">{{ props.data.dateRangeText }}</div></td>
              <td class="label"><div class="cell-wrap">姓名</div></td>
              <td class="value"><div class="cell-wrap">{{ props.data.targetName }}</div></td>
            </tr>
            <tr>
              <td class="label"><div class="cell-wrap">職稱</div></td>
              <td class="value"><div class="cell-wrap">{{ props.data.title }}</div></td>
              <td class="label"><div class="cell-wrap">手機</div></td>
              <td class="value"><div class="cell-wrap"></div></td>
            </tr>
          </tbody>
        </table>
        <div class="doc-section-title">建議改善事項</div>
        <div class="doc-box suggestion">{{ props.data.suggestion }}</div>
        <div class="doc-section-title">工作心得分享</div>
        <div class="doc-box feeling">{{ props.data.feeling }}</div>
        <div class="doc-section-title">本週工作重點</div>
      </template>

      <div class="doc-week-box" :style="{ height: `${props.page.boxHeight}px` }">
        <div v-for="(line, i) in props.page.lines" :key="i" class="doc-week-line">
          {{ line || ' ' }}
        </div>
      </div>

      <div v-if="props.page.showFooter" class="doc-footer">
        <p class="ft-title">填表說明:</p>
        <p>1. 填寫完畢後,應於規定時間前寄發週工作進度給單位主管及部門主管,最遲規定時間為周日晚上12點前。</p>
        <p>2. 預計請假事宜,不以週報上為準,必需填寫請假單呈給單位主管及部門主管簽核過,始可視為手續完備。</p>
      </div>
    </template>

    <div v-else class="doc-footer">
      <p class="ft-title">填表說明:</p>
      <p>1. 填寫完畢後,應於規定時間前寄發週工作進度給單位主管及部門主管,最遲規定時間為周日晚上12點前。</p>
      <p>2. 預計請假事宜,不以週報上為準,必需填寫請假單呈給單位主管及部門主管簽核過,始可視為手續完備。</p>
    </div>
  </div>
</template>

<style>
/* 刻意不用 scoped:量測用的 DOM probe (reportPagination.ts) 需要共用同一套 class 才能量出一致的高度 */
.page-render {
  position: fixed;
  left: -9999px;
  top: 0;
  width: 794px;
  height: 1123px;
  background: #ffffff;
  box-sizing: border-box;
  padding: 20px 76px 76px 76px; /* 把整頁內容(含表格、本週工作重點)一起往上移,見 reportPagination.ts 的 PAD_TOP 要同步改 */
  font-family: 'DFKai-SB', 'BiauKai', '標楷體', serif;
  color: #000;
  overflow: hidden;
  /* Tailwind preflight 把 line-height 設成 1.5,比純 HTML 版本的瀏覽器預設值高,會把文字往下推、壓到框線。
     這裡用明確數值蓋回來,不用 "normal" 關鍵字,因為 html2canvas 對 "normal" 的文字量測不準,
     會導致擷取出來的 PDF 文字整個被畫歪、跟框線重疊。 */
  line-height: 1.2;
}
.page-render p {
  margin: 0;
  padding-bottom: 8px; /* 跟其他文字元素一樣,用 padding-bottom 把文字往上頂,校正 html2canvas 偏下的問題 */
}
.doc-logo {
  width: 521px;
  height: 58px;
  display: block;
  margin: 0 0 8px;
}
.doc-title {
  text-align: center;
  font-size: 18.7px;
  font-weight: 700;
  margin: -8px 0 0; /* 跟前面 logo 的 margin-bottom(8px)是相鄰 margin,瀏覽器會取兩者疊合後的值,
     不是直接相加;算下來這樣設才會讓標題貼齊 logo 下緣,達到明顯往上移的效果 */
  padding-bottom: 14px; /* 從原本 margin-bottom 挪一部分過來當 padding-bottom,把文字往上頂 */
}
.doc-title .ver {
  font-size: 10.7px;
  font-weight: 400;
  margin-left: 14px;
}
table.doc-table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 8px;
}
table.doc-table td {
  border: 1px solid #000;
  padding: 6px 7.2px 10px 7.2px;
  font-size: 16px;
  vertical-align: middle;
}
/* html2canvas 對 <td> 本身的 transform 完全沒有效果(實測過),而且用 padding 校正
   vertical-align:middle 最多只能推到 padding-top:0,還是不夠、文字仍然偏下。
   實際跑完整個 app(不是獨立測試頁)量測 production 的 html2canvas 輸出才發現:
   儲存格內容包一層 <div> 之後,對這層 div 用 margin-top 才是有效果的校正方式。
   -14px 是對「單行儲存格」量出來的值;「期間」欄位的日期範圍那格因為是唯一
   塞在 rowspan=2 高格子裡的單行內容,反應的幅度不一樣,需要單獨給比較小的 -6px,
   否則會反過來被推得太高。之後如果改動這個表格的字型大小/行高,要重新實測校正,
   不能只靠獨立測試頁面推算(那邊量出來的數字跟真的 app 裡不一樣)。 */
.cell-wrap {
  margin-top: -14px;
}
.cell-wrap--daterange {
  margin-top: -6px;
}
.doc-header-table {
  width: calc(100% + 36px) !important;
  margin-left: -18px;
  margin-right: -18px;
}
.doc-header-table td {
  background: #f2dbdb;
}
.doc-header-table td.label {
  font-weight: 700;
  text-align: center;
  white-space: nowrap;
}
.doc-header-table td.value {
  text-align: center;
}
.doc-header-table td:nth-child(1) {
  width: 8.1%;
}
.doc-header-table td:nth-child(2) {
  width: 17.7%;
}
.doc-header-table td:nth-child(3) {
  width: 5.3%;
}
.doc-header-table td:nth-child(4) {
  width: 38.2%;
}
.doc-header-table td:nth-child(5) {
  width: 9.2%;
}
.doc-header-table td:nth-child(6) {
  width: 21.5%;
}
.doc-section-title {
  text-align: center;
  font-weight: 700;
  font-size: 16px;
  margin: 8px 0 0;
  padding-bottom: 14px;
}
.doc-box {
  border: 1px solid #000;
  padding: 4px 7.2px 18px 7.2px;
  font-size: 16px;
  white-space: pre-wrap;
  margin-bottom: 2px;
}
.doc-box.suggestion {
  min-height: 65px;
}
.doc-box.feeling {
  min-height: 35px;
}
.doc-week-box {
  border: 1px solid #000;
  /* 上下不對稱的 padding 讓文字整體往上移;上下總和維持 8px 不變,
     reportPagination.ts 的 WEEK_BOX_CHROME 常數才不用跟著調整。
     額外用 margin-top 把整個框再往上推一點(不佔用計算過的內容高度)。 */
  padding: 0px 7.2px 8px 7.2px;
  font-size: 16px;
  line-height: 1.4;
  overflow: hidden;
}
.doc-week-box > :first-child {
  margin-top: -6px;
}
.doc-week-line {
  white-space: pre-wrap;
  padding-bottom: 3px; /* 每行都會疊加,所以只給一點點,不然整頁行距會被拉開很多 */
}
.doc-footer {
  font-size: 13.3px;
  margin-top: 10px;
  line-height: 1.5;
}
.doc-footer .ft-title {
  font-weight: 700;
}
</style>
