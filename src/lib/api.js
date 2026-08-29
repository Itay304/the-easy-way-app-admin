import {
  collection,
  collectionGroup,
  query,
  where,
  getDocs,
  getCountFromServer,
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
  addDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebase.js';
import { dateKeyIsrael } from './dateUtils.js';

// ── סקירה כללית ─────────────────────────────────────────────────────────

export async function getTotalInstitutions() {
  const snap = await getCountFromServer(collection(db, 'institutions'));
  return snap.data().count;
}

export async function getTotalByRole(role) {
  const q = query(collection(db, 'users'), where('role', '==', role));
  const snap = await getCountFromServer(q);
  return snap.data().count;
}

/** כל התלמידים עם lastActiveDate — משמש גם ל"פעילים השבוע" וגם לגרף 30
 * הימים. שאילתה יחידה (equality על role בלבד, לא range) כדי לא לדרוש
 * אינדקס מורכב; חלוקת התאריכים בפועל מתבצעת ב-JS אחרי השליפה. */
export async function getStudentsActivity() {
  const q = query(collection(db, 'users'), where('role', '==', 'student'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data().lastActiveDate).filter(Boolean);
}

export function countActiveSince(lastActiveDates, sinceKey) {
  return lastActiveDates.filter((dateKey) => dateKey >= sinceKey).length;
}

/** סדרת "משתמשים פעילים ליום" ל-30 הימים האחרונים — סופרת כמה תלמידים
 * ל-lastActiveDate שווה לכל תאריך בטווח (dateKey >= 30 יום אחורה). */
export function buildDailyActivitySeries(lastActiveDates) {
  const days = [];
  for (let i = 29; i >= 0; i--) {
    days.push(dateKeyIsrael(-i));
  }
  const counts = new Map(days.map((d) => [d, 0]));
  lastActiveDates.forEach((dateKey) => {
    if (counts.has(dateKey)) counts.set(dateKey, counts.get(dateKey) + 1);
  });
  return days.map((dateKey) => ({ date: dateKey.slice(5), count: counts.get(dateKey) }));
}

// ── מוסדות ───────────────────────────────────────────────────────────────

export async function getAllInstitutions() {
  const snap = await getDocs(collection(db, 'institutions'));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function getInstitutionMemberCounts(institutionId) {
  const teacherQ = query(
    collection(db, 'users'),
    where('institutionId', '==', institutionId),
    where('role', '==', 'teacher')
  );
  const studentQ = query(
    collection(db, 'users'),
    where('institutionId', '==', institutionId),
    where('role', '==', 'student')
  );
  const [teacherSnap, studentSnap] = await Promise.all([
    getCountFromServer(teacherQ),
    getCountFromServer(studentQ),
  ]);
  return { teachers: teacherSnap.data().count, students: studentSnap.data().count };
}

export async function createInstitution(name) {
  return addDoc(collection(db, 'institutions'), {
    name,
    classes: [],
    disabled: false,
    createdAt: serverTimestamp(),
  });
}

export async function setInstitutionDisabled(institutionId, disabled) {
  return updateDoc(doc(db, 'institutions', institutionId), { disabled });
}

export async function setUserAsPrincipal(uid, institutionId) {
  return updateDoc(doc(db, 'users', uid), { role: 'principal', institutionId });
}

/** קישור הצטרפות למורים למוסד נתון. אפליקציית המורה עדיין לא קוראת את
 * ה-URL param הזה (?institutionCode=) בעת טעינה — נבדק ואושר. יוצרים
 * את הקישור כאן בכל זאת כדי שיהיה מוכן; קליטת הפרמטר בצד אפליקציית
 * המורה היא שינוי נפרד, מחוץ לתחום הכלי הזה. */
export function getTeacherJoinLink(institutionId) {
  return `https://teacher.theeasywayapp.co.il?institutionCode=${institutionId}`;
}

// ── משתמשים ──────────────────────────────────────────────────────────────

/** חיפוש מדויק בלבד (email== או uid) — Firestore לא תומך בחיפוש טקסט
 * חופשי/substring; מספיק לכלי ניהול פנימי. UID נשאר case-exact (מזהה
 * שנוצר ע"י Firebase, רגיש לאותיות באמת) — רק ה-email מנורמל ל-lowercase
 * לפני ההשוואה, כי Firebase Auth שומר אימיילים ב-lowercase, וחיפוש
 * "TRY@gmail.com" מול משתמש שנשמר כ-"try@gmail.com" היה נכשל בשקט
 * (== מדויק, לא case-insensitive) — נבדק ואושר ישירות מול Firestore. */
export async function searchUsers(term) {
  const trimmed = term.trim();
  if (!trimmed) return [];

  const byUidSnap = await getDoc(doc(db, 'users', trimmed));
  if (byUidSnap.exists()) {
    return [{ uid: byUidSnap.id, ...byUidSnap.data() }];
  }

  const q = query(collection(db, 'users'), where('email', '==', trimmed.toLowerCase()));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ uid: d.id, ...d.data() }));
}

export async function updateUserRole(uid, role) {
  return updateDoc(doc(db, 'users', uid), { role });
}

/** מוחקת רק את המסמך ב-Firestore — לא את חשבון ה-Firebase Auth (דורש
 * Admin SDK/Cloud Function, מחוץ לתחום הכלי הזה). מוצג במפורש ב-UI. */
export async function deleteUserDoc(uid) {
  return deleteDoc(doc(db, 'users', uid));
}

// ── סטטיסטיקות ───────────────────────────────────────────────────────────

/** כל המשתמשים, בכל role — שליפה אחת שמשמשת את כל 5 הסעיפים בדף
 * הסטטיסטיקות (במקום שאילתה נפרדת לכל סעיף). role/institutionId
 * מסוננים ב-JS מהתוצאה, לא בשאילתה, כדי לא להכפיל round-trips. */
export async function getAllUsers() {
  const snap = await getDocs(collection(db, 'users'));
  return snap.docs.map((d) => ({ uid: d.id, ...d.data() }));
}

// 1. פעילות יומית — series מגיע מ-buildDailyActivitySeries הקיים (Overview
// כבר משתמש בו על אותם נתונים בדיוק); כאן רק מחשבים סיכומים ממנו.
export function computeDailyActivityStats(series) {
  const activeDays = series.filter((d) => d.count > 0);
  const peak = series.reduce((best, d) => (d.count > best.count ? d : best), { date: '—', count: 0 });
  const avgPerDay = series.length ? series.reduce((sum, d) => sum + d.count, 0) / series.length : 0;
  return { totalActiveDays: activeDays.length, peakDay: peak.date, peakCount: peak.count, avgPerDay };
}

// 2. מעורבות — ממוצעים על פני כל התלמידים, גם אלה שחסרים להם שדות
// (משתמשים ישנים לפני שהשדות האלה נוספו) מטופלים כ-0, לא נזרקים החוצה.
export function computeEngagementStats(students) {
  let totalAttempts = 0;
  let totalCorrect = 0;
  let totalXp = 0;
  let streakSum = 0;
  let activeStreakCount = 0;

  students.forEach((s) => {
    totalAttempts += s.totalAttemptsCount || 0;
    totalCorrect += s.totalCorrectAttempts || 0;
    totalXp += s.totalXp ?? s.xp ?? 0;
    const streak = s.streak || 0;
    if (streak > 0) {
      streakSum += streak;
      activeStreakCount++;
    }
  });

  return {
    totalAttempts,
    totalCorrect,
    avgAccuracy: totalAttempts > 0 ? (totalCorrect / totalAttempts) * 100 : 0,
    avgXpPerUser: students.length > 0 ? totalXp / students.length : 0,
    // "משתמש פעיל" כאן = יש לו streak>0 כרגע; ממוצע רק על אלה, לא כולל
    // תלמידים בלי רצף פעיל (streak=0 היה מוריד את הממוצע באופן מטעה).
    avgStreakPerActiveUser: activeStreakCount > 0 ? streakSum / activeStreakCount : 0,
    activeStreakCount,
  };
}

export const PRACTICE_MODULES = [
  'flashcards',
  'quiz',
  'spelling',
  'matching',
  'whoami',
  'truefalse',
  'whatmeans',
  'fillsentence',
];

/** קורא מ-users/{uid}/moduleSessions (the-easy-way-app-student,
 * src/lib/progressSync.js) — מסמך per-attempt עם { module, correct },
 * לא מ-progress (ששם יש רק lastModule, המודול האחרון בלבד, לא סכום
 * ניסיונות לפי מודול). זמינות עדיין נבדקת בפועל (collection ריק =
 * "לא זמין"), לא הנחה קבועה בקוד — אם הכתיבה תיפסק/תשתנה, הסעיף חוזר
 * להציג את ההודעה במקום נתונים ריקים/שגויים. */
export async function computeModuleUsageStats() {
  const snap = await getDocs(collectionGroup(db, 'moduleSessions'));
  if (snap.empty) return { available: false };

  const moduleCounts = new Map();
  snap.forEach((docSnap) => {
    const key = docSnap.data().module || 'unknown';
    moduleCounts.set(key, (moduleCounts.get(key) || 0) + 1);
  });

  return {
    available: true,
    data: PRACTICE_MODULES.map((m) => ({ module: m, attempts: moduleCounts.get(m) || 0 })),
  };
}

// 4. שימור וצמיחה
export function computeNewUsersPerWeek(allUsers) {
  const withCreatedAt = allUsers.filter((u) => u.createdAt && typeof u.createdAt.toDate === 'function');
  const now = Date.now();
  const buckets = Array.from({ length: 8 }, () => 0); // buckets[0] = 0-6 ימים אחורה (השבוע הנוכחי)

  withCreatedAt.forEach((u) => {
    const daysAgo = Math.floor((now - u.createdAt.toDate().getTime()) / (1000 * 60 * 60 * 24));
    const weekIndex = Math.floor(daysAgo / 7);
    if (weekIndex >= 0 && weekIndex < 8) buckets[weekIndex]++;
  });

  const series = buckets.map((count, i) => ({ week: i === 0 ? 'השבוע' : `לפני ${i} שב׳`, count })).reverse();

  return { series, coverage: { withCreatedAt: withCreatedAt.length, total: allUsers.length } };
}

export function computeRetentionStats(students) {
  const since7d = dateKeyIsrael(-6);
  const since30d = dateKeyIsrael(-29);
  return {
    totalRegistered: students.length,
    active7d: students.filter((s) => s.lastActiveDate && s.lastActiveDate >= since7d).length,
    active30d: students.filter((s) => s.lastActiveDate && s.lastActiveDate >= since30d).length,
    returningUsers: students.filter((s) => (s.totalActiveDays || 0) > 1).length,
  };
}

// 5. פילוח מוסדות — מחושב מ-institutions/students/teachers שכבר נשלפו
// פעם אחת (Institutions.jsx שולף institutions בנפרד; כאן groupings ב-JS,
// בלי שאילתת ספירה נוספת per-institution כמו בדף המוסדות).
export function computeInstitutionBreakdown(institutions, students, teachers) {
  const since7d = dateKeyIsrael(-6);
  return institutions.map((inst) => {
    const instStudents = students.filter((s) => s.institutionId === inst.id);
    const instTeachers = teachers.filter((t) => t.institutionId === inst.id);
    const n = instStudents.length;
    const avgXp = n > 0 ? instStudents.reduce((sum, s) => sum + (s.totalXp ?? s.xp ?? 0), 0) / n : 0;
    const avgStreak = n > 0 ? instStudents.reduce((sum, s) => sum + (s.streak || 0), 0) / n : 0;
    const active7dCount = instStudents.filter((s) => s.lastActiveDate && s.lastActiveDate >= since7d).length;
    return {
      id: inst.id,
      name: inst.name,
      studentCount: n,
      teacherCount: instTeachers.length,
      avgXp,
      avgStreak,
      active7dCount,
      pctActive7d: n > 0 ? (active7dCount / n) * 100 : 0,
    };
  });
}

// ── תוכן ─────────────────────────────────────────────────────────────────

export async function getWordListsWithCounts() {
  const snap = await getDocs(collection(db, 'word_lists'));
  const lists = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  const counts = await Promise.all(
    lists.map((list) => getCountFromServer(collection(db, 'word_lists', list.id, 'words')))
  );
  return lists.map((list, i) => ({ ...list, wordCount: counts[i].data().count }));
}
