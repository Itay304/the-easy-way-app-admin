// אותו פורמט בדיוק כמו todayKeyIsrael (functions/index.js) ו-toDateKey בצד
// לקוח (student/teacher apps) — en-CA => YYYY-MM-DD, timezone מפורש כדי
// שה"יום" יחושב לפי השעון בישראל, לא UTC.
export function dateKeyIsrael(offsetDays = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jerusalem' }).format(d);
}
