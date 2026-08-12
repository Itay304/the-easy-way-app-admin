import { useState } from 'react';

export default function PasswordGate({ onSubmit }) {
  const [value, setValue] = useState('');
  const [error, setError] = useState('');

  function handleSubmit(e) {
    e.preventDefault();
    const ok = onSubmit(value);
    if (!ok) {
      setError('סיסמה שגויה.');
      setValue('');
    }
  }

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center px-6">
      <img src="/icons/icon-192.png" alt="EasyLex" className="h-16 w-16 rounded-2xl shadow-md mb-4" />
      <h1 className="text-xl font-bold text-brand-text mb-1">EasyLex — ניהול על</h1>
      <p className="text-brand-grey-text text-sm mb-6">כלי פנימי — נדרשת סיסמה</p>

      <form onSubmit={handleSubmit} className="w-full max-w-xs space-y-3">
        <input
          type="password"
          autoFocus
          required
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="סיסמה"
          className="w-full rounded-xl border border-brand-border px-4 py-3 text-center focus:outline-none focus:ring-2 focus:ring-brand-turquoise"
        />
        {error && <p className="text-red-600 text-sm text-center">{error}</p>}
        <button
          type="submit"
          className="w-full py-3 rounded-xl bg-gradient-to-l from-brand-turquoise-light to-brand-turquoise text-white font-bold hover:opacity-90 transition"
        >
          כניסה
        </button>
      </form>
    </div>
  );
}
