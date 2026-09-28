import { signOut } from 'firebase/auth';
import { ShieldAlert } from 'lucide-react';
import { auth } from '../firebase.js';

export default function Unauthorized() {
  return (
    <div className="min-h-dvh flex flex-col items-center justify-center px-6 py-12 text-center">
      <div className="h-16 w-16 rounded-full bg-red-50 text-red-500 flex items-center justify-center mb-4">
        <ShieldAlert size={30} />
      </div>
      <h1 className="text-2xl font-bold text-brand-text mb-2">אין הרשאה</h1>
      <p className="text-brand-grey-text mb-10 max-w-sm">
        החשבון הזה אינו מוגדר כסופר-אדמין. אם זו טעות, בקש שיוסיפו לך את ההרשאה במסמך המשתמש שלך.
      </p>
      <button
        onClick={() => signOut(auth)}
        className="text-sm text-brand-grey-text hover:text-brand-text underline"
      >
        התנתק ונסה עם חשבון אחר
      </button>
    </div>
  );
}
