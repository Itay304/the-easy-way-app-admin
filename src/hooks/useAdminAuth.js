import { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase.js';

// עיכוב אפשרי בין כתיבת role: superadmin למסמך users/{uid} לבין שה-Custom
// Claim בפועל מגיע לטוקן (syncUserClaims א-סינכרוני, functions/index.js) —
// אותו דפוס backoff-גדל בדיוק כמו useAuthRole.js באפליקציות התלמיד/מורה.
const CLAIM_RETRY_DELAYS_MS = [300, 800, 1500];

async function hasSuperadminClaim(user) {
  let result = await user.getIdTokenResult();
  if (result.claims.role === 'superadmin') return true;

  for (const delayMs of CLAIM_RETRY_DELAYS_MS) {
    await new Promise((resolve) => setTimeout(resolve, delayMs));
    result = await user.getIdTokenResult(true);
    if (result.claims.role === 'superadmin') return true;
  }
  return false;
}

/**
 * שער כניסה אמיתי (Firebase Auth של המשתמש עצמו, לא סיסמה משותפת/חשבון
 * שירות חבוי — ר' audit: VITE_ADMIN_PASSWORD/VITE_ADMIN_SERVICE_PASSWORD
 * הוסרו). הבדיקה כאן היא *שער UI בלבד* — קובעת מה מוצג למשתמש, לא גבול
 * אבטחה: האכיפה האמיתית היא ב-firestore.rules (isSuperAdmin(), בודקת
 * request.auth.token.role בצד השרת) ובכל Cloud Function רלוונטית. גם אם
 * מישהו יעקוף את הבדיקה הזו בצד לקוח, כל קריאה/כתיבה בפועל עדיין תיחסם.
 *
 * status: 'loading' | 'signed-out' | 'unauthorized' | 'ready'
 */
export default function useAdminAuth() {
  const [status, setStatus] = useState('loading');
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        setUser(null);
        setStatus('signed-out');
        return;
      }
      setStatus('loading');
      const isSuperadmin = await hasSuperadminClaim(firebaseUser);
      setUser(firebaseUser);
      setStatus(isSuperadmin ? 'ready' : 'unauthorized');
    });
    return unsubscribe;
  }, []);

  return { status, user };
}
