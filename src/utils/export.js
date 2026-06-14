import { getDateForDay, getTodayStr } from './date'

function csvCell(value) {
  const s = String(value ?? '')
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`
  return s
}

function csvRow(cells) {
  return cells.map(csvCell).join(',')
}

/**
 * 生成单个测试员的 CSV 并触发下载
 */
export function downloadTesterCsv(tester) {
  const lines = []

  lines.push(csvRow(['G20 Export']))
  lines.push('')
  lines.push(csvRow(['Field', 'Value']))
  lines.push(csvRow(['Name', tester.name]))
  lines.push(csvRow(['Platform', tester.platform || '']))
  lines.push(csvRow(['Description', tester.description || '']))
  lines.push(csvRow(['Type', tester.type || '']))
  lines.push(csvRow(['Tags', (tester.tags || []).join('; ')]))
  lines.push(csvRow(['Joined', tester.joinedAt]))
  lines.push(csvRow(['Required Days', tester.totalDays]))
  lines.push(csvRow(['Dropped', tester.dropped ? 'yes' : 'no']))
  lines.push('')
  lines.push(csvRow(['Date', 'Day', 'Partner Active', 'My Reply']))
  lines.push(csvRow(['', '(they test me)', '(I test them)']))

  for (let day = 1; day <= tester.totalDays; day++) {
    const date = getDateForDay(tester.joinedAt, day)
    const check = tester.checks[date] || {}
    lines.push(csvRow([
      date,
      day,
      check.activeToday ? 'yes' : 'no',
      check.iReplied ? 'yes' : 'no',
    ]))
  }

  // 回测可能发生在要求天数之外，补充仅有 iReplied 的额外日期
  const streakDates = new Set(
    Array.from({ length: tester.totalDays }, (_, i) => getDateForDay(tester.joinedAt, i + 1))
  )
  const extraReplyDates = Object.entries(tester.checks || {})
    .filter(([date, c]) => c.iReplied && !streakDates.has(date))
    .map(([date]) => date)
    .sort()

  if (extraReplyDates.length) {
    lines.push('')
    lines.push(csvRow(['Extra reply dates (outside required streak)']))
    for (const date of extraReplyDates) {
      lines.push(csvRow([date, '', '', 'yes']))
    }
  }

  const bom = '\uFEFF'
  const blob = new Blob([bom + lines.join('\n')], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  const safeName = (tester.name || 'tester').replace(/[^\w\u4e00-\u9fff-]+/g, '_').slice(0, 40)
  a.href = url
  a.download = `tester-${safeName}-${getTodayStr()}.csv`
  a.click()
  URL.revokeObjectURL(url)
}
