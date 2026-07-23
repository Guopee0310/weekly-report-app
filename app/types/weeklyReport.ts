export interface PersonInfo {
  title: string
  filenameLabel: string
}

export interface ParsedMessage {
  time: string
  lineName: string
  month: number | null
  day: number | null
  body: string[]
}

export interface FilteredEntry {
  date: Date
  time: string
  bodyText: string
}

export interface ReportData {
  division: string
  dateRangeText: string
  targetName: string
  title: string
  suggestion: string
  feeling: string
  weekLines: string[]
}

export interface ReportPage {
  isFirstPage: boolean
  lines: string[]
  boxHeight: number
  showFooter: boolean
  footerOnly?: boolean
}
