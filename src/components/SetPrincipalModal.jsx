import { useState } from 'react';
import { ShieldCheck } from 'lucide-react';
import { searchUsers, setUserAsPrincipal } from '../lib/api.js';

export default function SetPrincipalModal({ institution, onClose, onDone }) {
  const [term, setTerm] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const results = await searchUsers(term);
      if (results.length === 0) {
        setError('לא נמצא משתמש עם אימייל/UID זה.');
        return;
      }
      await setUserAsPrincipal(results[0].uid, institution.id);
      onDone();
    } catch (err) {
      console.error('[admin] setUserAsPrincipal failed:', err);
      setError('שגיאה בהגדרת המנהל. נסו שוב.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
        <div className="flex items-center gap-2 mb-1">
          <ShieldCheck size={20} className="text-brand-turquoise" />
          <h2 className="text-lg font-bold text-brand-text">הגדר מנהל למוסד</h2>
        </div>
        <p className="text-sm text-brand-grey-text mb-4">{institution.name}</p>

        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="text"
            required
            autoFocus
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            placeholder="אימייל או UID של המשתמש"
            className="w-full rounded-xl border border-brand-border px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-turquoise"
          />

          {error && <p className="text-red-600 text-sm text-center">{error}</p>}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-xl border border-brand-border text-brand-text font-semibold"
            >
              ביטול
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 py-3 rounded-xl bg-gradient-to-l from-brand-turquoise-light to-brand-turquoise text-white font-bold disabled:opacity-60"
            >
              {submitting ? '...' : 'הגדר'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
