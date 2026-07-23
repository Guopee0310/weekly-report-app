export interface ReportTuning {
  tableCellPB: number // table.doc-table td 的 padding-bottom
  tableCellShiftPx: number // 所有表格儲存格的 translateY(通常是負數)
  tableNonRowspanShiftPx: number // 部門/職稱/姓名/手機這幾個非 rowspan 儲存格的 translateY(取代,不是疊加)
  titlePB: number // .doc-title 的 padding-bottom
  sectionTitlePB: number // .doc-section-title 的 padding-bottom
  boxPB: number // .doc-box(建議改善/工作心得)的 padding-bottom
  weekLinePB: number // .doc-week-line(本週工作重點每一行)的 padding-bottom
  footerPPB: number // 頁尾說明文字每個 <p> 的 padding-bottom
}

export const REPORT_TUNING_DEFAULTS: ReportTuning = {
  tableCellPB: 8,
  tableCellShiftPx: -3,
  tableNonRowspanShiftPx: -6,
  titlePB: 14,
  sectionTitlePB: 14,
  boxPB: 18,
  weekLinePB: 3,
  footerPPB: 8,
}

export function useReportTuning() {
  const tuning = useState<ReportTuning>('report-tuning', () => ({ ...REPORT_TUNING_DEFAULTS }))

  function resetTuning(): void {
    tuning.value = { ...REPORT_TUNING_DEFAULTS }
  }

  return { tuning, resetTuning }
}
