export function readDueDate(value: unknown) {
  if (typeof value !== 'string') return ''
  return /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : ''
}

export function formatTaskDueDate(value: unknown) {
  const dueDate = readDueDate(value)
  if (!dueDate) return null
  const date = new Date(`${dueDate}T12:00:00`)
  if (Number.isNaN(date.getTime())) return null
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

export function formatTaskDueDateLong(value: unknown) {
  const dueDate = readDueDate(value)
  if (!dueDate) return null
  const date = new Date(`${dueDate}T12:00:00`)
  if (Number.isNaN(date.getTime())) return null
  return date.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export function isTaskDueDateOverdue(value: unknown) {
  const dueDate = readDueDate(value)
  if (!dueDate) return false
  const today = new Date()
  const due = new Date(`${dueDate}T23:59:59`)
  return due.getTime() < today.getTime()
}

export function toIsoDate(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

export function parseIsoDate(iso: string) {
  const [year, month, day] = iso.split('-').map(Number)
  return { year: year!, month: month! - 1, day: day! }
}

export function getTodayIsoDate() {
  const today = new Date()
  return toIsoDate(today.getFullYear(), today.getMonth(), today.getDate())
}

export function buildCalendarCells(viewYear: number, viewMonth: number) {
  const firstWeekday = new Date(viewYear, viewMonth, 1).getDay()
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()
  const cells: Array<number | null> = []

  for (let index = 0; index < firstWeekday; index += 1) {
    cells.push(null)
  }
  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push(day)
  }

  return cells
}

export const CALENDAR_WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'] as const

export const CALENDAR_MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
] as const
