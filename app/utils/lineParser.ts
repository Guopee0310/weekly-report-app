import type { FilteredEntry, ParsedMessage } from '~/types/weeklyReport'

const THURSDAY = 4 // JS getDay(): 0=日 1=一 2=二 3=三 4=四 5=五 6=六
const THURSDAY_ROLLOVER_HOUR = 23 // 週四要到晚上這個時間之後,才換算成新的一週區間

const HEADER_RE = /^(\d{1,2}:\d{2})\s+(\S+)\s*(.*)$/
const INLINE_DATE_RE = /(\d{1,2})\/(\d{1,2})/
const STANDALONE_DATE_RE = /^(\d{1,2})\/(\d{1,2})$/
// LINE 匯出的日期分隔線,例如「五, 09/27/2024」,標示接下來的訊息屬於哪一天(含正確年份)
const DIVIDER_RE = /^[日一二三四五六],\s*(\d{1,2})\/(\d{1,2})\/(\d{4})$/

function toHalfWidth(s: string): string {
  return s.normalize('NFKC')
}

export function parseMessages(text: string): ParsedMessage[] {
  const lines = text.split(/\r?\n/)
  const messages: ParsedMessage[] = []
  let current: ParsedMessage | null = null
  let pendingYear: number | null = null

  for (const rawLine of lines) {
    const line = rawLine.trim()
    const divider = DIVIDER_RE.exec(toHalfWidth(line))
    if (divider) {
      pendingYear = Number.parseInt(divider[3]!, 10)
      continue
    }
    const m = HEADER_RE.exec(line)
    if (m) {
      if (current) messages.push(current)
      const time = m[1]!
      const lineName = m[2]!
      const rest = m[3]!
      current = { time, lineName, month: null, day: null, year: pendingYear, body: rest ? [rest] : [] }
    } else if (current !== null) {
      current.body.push(rawLine)
    }
  }
  if (current) messages.push(current)

  for (const msg of messages) {
    const firstLine = msg.body[0] ?? ''
    const dm = INLINE_DATE_RE.exec(toHalfWidth(firstLine))
    if (dm) {
      msg.month = Number.parseInt(dm[1]!, 10)
      msg.day = Number.parseInt(dm[2]!, 10)
    } else {
      for (let i = 0; i < msg.body.length; i++) {
        const sm = STANDALONE_DATE_RE.exec(toHalfWidth(msg.body[i]!.trim()))
        if (sm) {
          msg.month = Number.parseInt(sm[1]!, 10)
          msg.day = Number.parseInt(sm[2]!, 10)
          msg.body.splice(i, 1)
          break
        }
      }
    }
  }
  return messages
}

export function dateOnly(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}

export function addDays(d: Date, n: number): Date {
  const r = new Date(d)
  r.setDate(r.getDate() + n)
  return r
}

export function weekRange(now: Date): [Date, Date] {
  const today = dateOnly(now)
  // 週四當天要等到晚上 23 點後,才把這週算成「已完成」換到下一個區間;
  // 23 點之前(包含週四白天)都還算在算前一週,因為大家週四還在陸續回報。
  const isBeforeThursdayRollover = now.getDay() === THURSDAY && now.getHours() < THURSDAY_ROLLOVER_HOUR
  const daysSinceThursday = isBeforeThursdayRollover ? 7 : (now.getDay() - THURSDAY + 7) % 7
  const weekEnd = addDays(today, -daysSinceThursday)
  const weekStart = addDays(weekEnd, -6)
  return [weekStart, weekEnd]
}

export function resolveMessageDate(month: number, day: number, today: Date, year: number | null = null): Date {
  if (year !== null) return new Date(year, month - 1, day)
  let candidate = new Date(today.getFullYear(), month - 1, day)
  if (candidate > addDays(today, 3)) {
    candidate = new Date(today.getFullYear() - 1, month - 1, day)
  }
  return candidate
}

export function fmtYMD(d: Date, sep: string): string {
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}${sep}${mm}${sep}${dd}`
}

export function fmtMD(d: Date): string {
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${mm}/${dd}`
}

export function fmtMNoZero(d: Date): string {
  return `${d.getMonth() + 1}.${d.getDate()}`
}

export function buildWeekLines(filtered: FilteredEntry[]): string[] {
  const lines: string[] = []
  filtered.forEach(({ date, bodyText }, i) => {
    if (i > 0) lines.push('')
    lines.push(fmtMD(date))
    const bodyLines = bodyText.split('\n').filter((l) => l.trim())
    lines.push(...bodyLines)
  })
  return lines
}

export interface FilterResult {
  filtered: FilteredEntry[]
  allDates: Date[]
}

export function filterForPerson(
  messages: ParsedMessage[],
  targetName: string,
  startDate: Date,
  endDate: Date,
  today: Date,
): FilterResult {
  const allDates: Date[] = []
  const filtered: FilteredEntry[] = []

  for (const msg of messages) {
    if (msg.month === null || msg.day === null) continue
    const msgDate = resolveMessageDate(msg.month, msg.day, today, msg.year)
    if (Number.isNaN(msgDate.getTime())) continue
    allDates.push(msgDate)
    if (msgDate < startDate || msgDate > endDate) continue
    const bodyText = msg.body.join('\n').trim()
    const firstLine = msg.body[0] ?? ''
    if (msg.lineName.includes(targetName) || firstLine.includes(targetName)) {
      filtered.push({ date: msgDate, time: msg.time, bodyText })
    }
  }
  filtered.sort((a, b) => a.date.getTime() - b.date.getTime() || a.time.localeCompare(b.time))
  return { filtered, allDates }
}

export function stripSelfTag(filtered: FilteredEntry[], targetName: string): FilteredEntry[] {
  // 內容裡的自我標示有時只打名字、不含姓氏,姓氏以外的部分也要能比對到才會被移除。
  const givenName = targetName.length > 1 ? targetName.slice(1) : targetName
  return filtered.map(({ date, time, bodyText }) => {
    const lines = bodyText.split('\n').filter((l) => l.trim())
    if (lines[0] && (lines[0].includes(targetName) || lines[0].includes(givenName))) lines.shift()
    return { date, time, bodyText: lines.join('\n') }
  })
}
