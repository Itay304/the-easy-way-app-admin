import { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase.js';

/**
 * החלפה ל-PasswordGate.jsx הישן (סיסמה משותפת + חשבון שירות חבוי בקוד —
 * ר' audit). כאן זו התחברות Firebase Auth אמיתית של המשתמש הסופר-אדמין
 * עצמו; הגישה בפועל למסך הבאים נקבעת ב-App.jsx לפי ה-Custom Claim
 * (useAdminAuth), לא כאן.
 */
export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch {
      setError('אימייל או סיסמה שגויים.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center px-6">
      <img src="/icons/icon-192.png" alt="EasyLex" className="h-16 w-16 rounded-2xl shadow-md mb-4" />
      <h1 className="text-xl font-bold text-brand-text mb-1">EasyLex — ניהול על</h1>
      <p className="text-brand-grey-text text-sm mb-6">כלי פנימי — התחברות עם חשבון סופר-אדמין</p>

      <form onSubmit={handleSubmit} className="w-full max-w-xs space-y-3">
        <input
          type="email"
          autoFocus
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="אימייל"
          className="w-full rounded-xl border border-brand-border px-4 py-3 text-center focus:outline-none focus:ring-2 focus:ring-brand-turquoise"
        />
        <input
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="סיסמה"
          className="w-full rounded-xl border border-brand-border px-4 py-3 text-center focus:outline-none focus:ring-2 focus:ring-brand-turquoise"
        />
        {error && <p className="text-red-600 text-sm text-center">{error}</p>}
        <button
          type="submit"
          disabled={submitting}
          className="w-full py-3 rounded-xl bg-gradient-to-l from-brand-turquoise-light to-brand-turquoise text-white font-bold hover:opacity-90 transition disabled:opacity-60"
        >
          {submitting ? '...' : 'כניסה'}
        </button>
      </form>
    </div>
  );
}
