import type { ReportPage } from '~/types/weeklyReport'

const PAGE_W = 794
const PAGE_H = 1123
const PAD_TOP = 20
const PAD_BOTTOM = 76
const CONTENT_H = PAGE_H - PAD_TOP - PAD_BOTTOM
const LOGO_BLOCK_H = 58 + 8 // logo height + its bottom margin
const WEEK_BOX_CHROME = 2 + 6 // border (1px * 2) + padding (上下總和 8px,實際切成 0px/8px + margin-top:-4px 讓文字偏上,見 PrintablePage.vue)
const PROBE_WIDTH = PAGE_W - 76 * 2 // content width inside the page padding

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

async function measureBlockHeight(html: string, width: number): Promise<number> {
  const probe = document.createElement('div')
  probe.style.position = 'fixed'
  probe.style.left = '-9999px'
  probe.style.top = '0'
  probe.style.width = `${width}px`
  probe.style.visibility = 'hidden'
  probe.style.fontFamily = "'DFKai-SB','BiauKai','標楷體',serif"
  // Tailwind preflight 把全域 line-height 設成 1.5,量測要蓋回 normal,才會跟實際渲染的高度一致
  probe.style.lineHeight = '1.2'
  probe.innerHTML = html
  document.body.appendChild(probe)
  const h = probe.offsetHeight
  document.body.removeChild(probe)
  return h
}

interface LineOffset {
  top: number
  bottom: number
}

async function measureWeekLineOffsets(lines: string[]): Promise<LineOffset[]> {
  const probe = document.createElement('div')
  probe.style.position = 'fixed'
  probe.style.left = '-9999px'
  probe.style.top = '0'
  probe.style.width = `${PROBE_WIDTH}px`
  probe.style.fontSize = '16px'
  probe.style.lineHeight = '1.4'
  probe.style.fontFamily = "'DFKai-SB','BiauKai','標楷體',serif"
  probe.style.visibility = 'hidden'
  probe.innerHTML = lines
    .map((l) => `<div class="doc-week-line">${escapeHtml(l) || '&nbsp;'}</div>`)
    .join('')
  document.body.appendChild(probe)
  const items = Array.from(probe.querySelectorAll<HTMLElement>('.doc-week-line'))
  const offsets = items.map((el) => ({ top: el.offsetTop, bottom: el.offsetTop + el.offsetHeight }))
  document.body.removeChild(probe)
  return offsets
}

function fixedBlockHtml(division: string, dateRangeText: string, targetName: string, title: string, suggestion: string, feeling: string): string {
  return `
    <div style="text-align:center;font-size:18.7px;font-weight:700;margin:4px 0 0;padding-bottom:14px;">TKB EC 事業群/部門週報<span style="font-size:10.7px;font-weight:400;margin-left:14px;">版本:20150420</span></div>
    <table style="width:calc(100% + 36px);margin-left:-18px;margin-right:-18px;border-collapse:collapse;margin-bottom:8px;">
      <tr>
        <td style="border:1px solid #000;padding:0px 7.2px 8px 7.2px;font-size:16px;width:8.1%;font-weight:700;text-align:center;">部門</td>
        <td style="border:1px solid #000;padding:0px 7.2px 8px 7.2px;font-size:16px;width:17.7%;text-align:center;">${escapeHtml(division)}</td>
        <td rowspan="2" style="border:1px solid #000;padding:0px 7.2px 8px 7.2px;font-size:16px;width:5.3%;font-weight:700;text-align:center;">期<br>間</td>
        <td rowspan="2" style="border:1px solid #000;padding:0px 7.2px 8px 7.2px;font-size:16px;width:38.2%;text-align:center;">${escapeHtml(dateRangeText)}</td>
        <td style="border:1px solid #000;padding:0px 7.2px 8px 7.2px;font-size:16px;width:9.2%;font-weight:700;text-align:center;">姓名</td>
        <td style="border:1px solid #000;padding:0px 7.2px 8px 7.2px;font-size:16px;width:21.5%;text-align:center;">${escapeHtml(targetName)}</td>
      </tr>
      <tr>
        <td style="border:1px solid #000;padding:0px 7.2px 8px 7.2px;font-size:16px;font-weight:700;text-align:center;">職稱</td>
        <td style="border:1px solid #000;padding:0px 7.2px 8px 7.2px;font-size:16px;text-align:center;">${escapeHtml(title)}</td>
        <td style="border:1px solid #000;padding:0px 7.2px 8px 7.2px;font-size:16px;font-weight:700;text-align:center;">手機</td>
        <td style="border:1px solid #000;padding:0px 7.2px 8px 7.2px;font-size:16px;"></td>
      </tr>
    </table>
    <div style="text-align:center;font-weight:700;font-size:16px;margin:8px 0 0;padding-bottom:14px;">建議改善事項</div>
    <div style="border:1px solid #000;padding:4px 7.2px 18px 7.2px;font-size:16px;white-space:pre-wrap;margin-bottom:2px;min-height:65px;">${escapeHtml(suggestion)}</div>
    <div style="text-align:center;font-weight:700;font-size:16px;margin:8px 0 0;padding-bottom:14px;">工作心得分享</div>
    <div style="border:1px solid #000;padding:4px 7.2px 18px 7.2px;font-size:16px;white-space:pre-wrap;margin-bottom:2px;min-height:35px;">${escapeHtml(feeling)}</div>
    <div style="text-align:center;font-weight:700;font-size:16px;margin:8px 0 0;padding-bottom:14px;">本週工作重點</div>
  `
}

function footerHtml(): string {
  return `
    <div style="font-size:13.3px;margin-top:10px;line-height:1.5;">
      <p style="font-weight:700;margin:0;padding-bottom:8px;">填表說明:</p>
      <p style="margin:0;padding-bottom:8px;">1. 填寫完畢後,應於規定時間前寄發週工作進度給單位主管及部門主管,最遲規定時間為周日晚上12點前。</p>
      <p style="margin:0;padding-bottom:8px;">2. 預計請假事宜,不以週報上為準,必需填寫請假單呈給單位主管及部門主管簽核過,始可視為手續完備。</p>
    </div>
  `
}

export interface PaginationInput {
  division: string
  dateRangeText: string
  targetName: string
  title: string
  suggestion: string
  feeling: string
  weekLines: string[]
}

export async function buildReportPages(input: PaginationInput): Promise<ReportPage[]> {
  const weekLines = input.weekLines.length ? input.weekLines : ['這段期間沒有找到符合的訊息。']
  const offsets = await measureWeekLineOffsets(weekLines)

  const fixedHtml = fixedBlockHtml(
    input.division,
    input.dateRangeText,
    input.targetName,
    input.title,
    input.suggestion,
    input.feeling,
  )
  const fixedBlockH = await measureBlockHeight(fixedHtml, PROBE_WIDTH)
  const footerH = await measureBlockHeight(footerHtml(), PROBE_WIDTH)

  const pages: ReportPage[] = []
  let idx = 0
  let isFirstPage = true

  while (true) {
    const preambleH = isFirstPage ? fixedBlockH : LOGO_BLOCK_H
    const available = CONTENT_H - preambleH - WEEK_BOX_CHROME

    const chunkStartTop = idx > 0 ? offsets[idx]!.top : 0

    let endIdx = idx
    while (endIdx < offsets.length && offsets[endIdx]!.bottom - chunkStartTop <= available) {
      endIdx++
    }
    if (endIdx === idx && endIdx < offsets.length) endIdx = idx + 1

    const isLastChunk = endIdx >= offsets.length
    const chunkLines = weekLines.slice(idx, endIdx)
    const chunkH = isLastChunk
      ? (endIdx > idx ? offsets[endIdx - 1]!.bottom - chunkStartTop : 0)
      : available

    let footerOnThisPage = false
    if (isLastChunk) {
      const usedH = preambleH + chunkH + WEEK_BOX_CHROME
      footerOnThisPage = CONTENT_H - usedH >= footerH
    }

    let boxHeight = Math.max(40, chunkH + WEEK_BOX_CHROME)
    if (isFirstPage && isLastChunk) {
      // 模仿 Word 表格最後一列撐滿整頁的效果:內容沒有塞滿第一頁時,
      // 框框仍延伸到頁尾(扣掉頁尾說明文字的話,延伸到它上緣)。第二頁起不套用這個規則。
      const fillTargetOuter = CONTENT_H - preambleH - (footerOnThisPage ? footerH : 0)
      boxHeight = Math.max(boxHeight, fillTargetOuter)
    }

    pages.push({
      isFirstPage,
      lines: chunkLines,
      boxHeight,
      showFooter: isLastChunk && footerOnThisPage,
    })

    if (isLastChunk) {
      if (!footerOnThisPage) {
        pages.push({ isFirstPage: false, lines: [], boxHeight: 0, showFooter: true, footerOnly: true })
      }
      break
    }
    idx = endIdx
    isFirstPage = false
  }

  return pages
}
