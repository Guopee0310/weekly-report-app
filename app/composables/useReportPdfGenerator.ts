import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'
import { nextTick, type Ref } from 'vue'
import type { ReportData, ReportPage } from '~/types/weeklyReport'
import { buildReportPages } from '~/utils/reportPagination'

export function useReportPdfGenerator() {
  async function generateAndDownload(
    data: ReportData,
    outStub: string,
    currentPageRef: Ref<ReportPage | null>,
  ): Promise<string> {
    const pages = await buildReportPages(data)
    const pdf = new jsPDF('p', 'mm', 'a4')

    for (let i = 0; i < pages.length; i++) {
      currentPageRef.value = pages[i] ?? null
      await nextTick()
      // 等瀏覽器完成一次繪製,確保 html2canvas 擷取到最新內容。
      // 不用 requestAnimationFrame:分頁不在前景(或瀏覽器把它當背景分頁)時,
      // rAF 會被瀏覽器暫停或延後觸發,導致這裡卡住不會完成。
      await new Promise((resolve) => setTimeout(resolve, 50))

      // .page-render 是 position:fixed,直接查詢它本身,不透過可能量到 0 高度的外層容器
      const el = document.querySelector<HTMLElement>('.page-render')
      if (!el) throw new Error('printable page element not found')

      const canvas = await html2canvas(el, {
        scale: 3,
        useCORS: true,
        backgroundColor: '#ffffff',
      })
      const imgData = canvas.toDataURL('image/jpeg', 0.97)
      if (i > 0) pdf.addPage()
      pdf.addImage(imgData, 'JPEG', 0, 0, 210, 297)
    }

    pdf.save(`${outStub}.pdf`)

    const dataUri = pdf.output('datauristring')
    return dataUri.slice(dataUri.indexOf(',') + 1)
  }

  return { generateAndDownload }
}
