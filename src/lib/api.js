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

// ── משתמשים ──────────────────────────────────────────────────────────────

/** חיפוש מדויק בלבד (email== או uid) — Firestore לא תומך בחיפוש טקסט
 * חופשי/substring; מספיק לכלי ניהול פנימי. */
export async function searchUsers(term) {
  const trimmed = term.trim();
  if (!trimmed) return [];

  const byUidSnap = await getDoc(doc(db, 'users', trimmed));
  if (byUidSnap.exists()) {
    return [{ uid: byUidSnap.id, ...byUidSnap.data() }];
  }

  const q = query(collection(db, 'users'), where('email', '==', trimmed));
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

/** שאילתת collectionGroup בלי where/orderBy — לא דורשת אינדקס ייעודי.
 * שלושת הסטטיסטיקות (מילים שנשלטו, band פופולרי, מילים קשות) מחושבות
 * מאותה שליפה אחת כדי לא להוריד את כל ה-progress הפלטפורמה פעמיים. */
export async function computeStatistics() {
  const snap = await getDocs(collectionGroup(db, 'progress'));

  let masteredWords = 0;
  const bandCounts = new Map();
  const wordStats = new Map();

  snap.forEach((docSnap) => {
    const p = docSnap.data();
    const correct = typeof p.correctAttempts === 'number' ? p.correctAttempts : 0;
    const total = typeof p.totalAttempts === 'number' ? p.totalAttempts : 0;
    const word = p.englishWord;

    if (correct >= 3) masteredWords++;

    if (p.sourceListId) {
      bandCounts.set(p.sourceListId, (bandCounts.get(p.sourceListId) || 0) + 1);
    }

    if (word && total > 0) {
      const errors = Math.max(0, total - correct);
      const entry = wordStats.get(word) || { word, attempts: 0, errors: 0 };
      entry.attempts += total;
      entry.errors += errors;
      wordStats.set(word, entry);
    }
  });

  let mostPopularBand = null;
  let bestCount = 0;
  bandCounts.forEach((count, band) => {
    if (count > bestCount) {
      bestCount = count;
      mostPopularBand = band;
    }
  });

  const hardestWords = [...wordStats.values()]
    .sort((a, b) => b.errors - a.errors)
    .slice(0, 10);

  return { masteredWords, mostPopularBand, hardestWords };
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
