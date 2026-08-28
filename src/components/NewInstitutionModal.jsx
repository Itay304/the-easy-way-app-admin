import { useState } from 'react';
import { Building2, Copy, Check } from 'lucide-react';
import { createInstitution, getTeacherJoinLink } from '../lib/api.js';

export default function NewInstitutionModal({ onClose, onDone }) {
  const [name, setName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [createdLink, setCreatedLink] = useState(''); // מצב "הצלחה" — מוסד נוצר, מציגים קישור הצטרפות
  const [copied, setCopied] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const ref = await createInstitution(name.trim());
      setCreatedLink(getTeacherJoinLink(ref.id));
    } catch (err) {
      console.error('[admin] createInstitution failed:', err);
      setError('שגיאה ביצירת המוסד. נסו שוב.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(createdLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // כלי ניהול פנימי — אם ההעתקה נכשלת (למשל דפדפן בלי clipboard API),
      // הקישור עדיין מוצג בטקסט וניתן להעתיק ידנית.
    }
  }

  if (createdLink) {
    return (
      <div className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Building2 size={20} className="text-brand-turquoise" />
            <h2 className="text-lg font-bold text-brand-text">המוסד נוצר!</h2>
          </div>
          <p className="text-sm text-brand-grey-text">שתפו את הקישור הזה עם מורים כדי שיצטרפו למוסד:</p>
          <div className="flex items-center gap-2 rounded-xl border border-brand-border px-3 py-2.5 bg-brand-grey-light/40">
            <span className="flex-1 text-xs font-mono break-all">{createdLink}</span>
            <button onClick={handleCopy} className="shrink-0 text-brand-turquoise" aria-label="העתק קישור">
              {copied ? <Check size={17} /> : <Copy size={17} />}
            </button>
          </div>
          {copied && <p className="text-xs text-emerald-700 text-center">הקישור הועתק!</p>}
          <button
            onClick={onDone}
            className="w-full py-3 rounded-xl bg-gradient-to-l from-brand-turquoise-light to-brand-turquoise text-white font-bold"
          >
            סיום
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
        <div className="flex items-center gap-2 mb-4">
          <Building2 size={20} className="text-brand-turquoise" />
          <h2 className="text-lg font-bold text-brand-text">מוסד חדש</h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="text"
            required
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="שם המוסד"
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
              {submitting ? '...' : 'צור'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
