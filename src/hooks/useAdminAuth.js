import { useEffect, useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase.js';

const STORAGE_KEY = 'admin_authed';
const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD;
const SERVICE_EMAIL = import.meta.env.VITE_ADMIN_SERVICE_EMAIL;
const SERVICE_PASSWORD = import.meta.env.VITE_ADMIN_SERVICE_PASSWORD;

/**
 * שער סיסמה (VITE_ADMIN_PASSWORD) הוא רק UI — לא גבול אבטחה אמיתי מול
 * Firestore. אחרי שהוא עובר, מתחברים בשקט לחשבון Firebase Auth ייעודי
 * (role: superadmin ב-Firestore, מסונכרן ל-custom claim ע"י syncUserClaims,
 * functions/index.js) כדי ש-firestore.rules יאפשרו בפועל את הקריאות/כתיבות.
 * המשתמש לא רואה מסך login נפרד — רק את מסך הסיסמה.
 */
export default function useAdminAuth() {
  const [passed, setPassed] = useState(() => localStorage.getItem(STORAGE_KEY) === '1');
  const [status, setStatus] = useState('idle'); // 'idle' | 'signing-in' | 'ready' | 'error'
  const [error, setError] = useState('');

  useEffect(() => {
    if (!passed) return;
    let cancelled = false;
    setStatus('signing-in');
    signInWithEmailAndPassword(auth, SERVICE_EMAIL, SERVICE_PASSWORD)
      .then(() => {
        if (!cancelled) setStatus('ready');
      })
      .catch((err) => {
        console.error('[admin] service account sign-in failed:', err);
        if (!cancelled) {
          setStatus('error');
          setError('שגיאה בהתחברות לשרת. נסו לרענן את הדף.');
        }
      });
    return () => {
      cancelled = true;
    };
  }, [passed]);

  function tryPassword(input) {
    if (ADMIN_PASSWORD && input === ADMIN_PASSWORD) {
      localStorage.setItem(STORAGE_KEY, '1');
      setPassed(true);
      return true;
    }
    return false;
  }

  return { passed, status, error, tryPassword };
}
