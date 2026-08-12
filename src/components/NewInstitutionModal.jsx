import { useState } from 'react';
import { Building2 } from 'lucide-react';
import { createInstitution } from '../lib/api.js';

export default function NewInstitutionModal({ onClose, onDone }) {
  const [name, setName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await createInstitution(name.trim());
      onDone();
    } catch (err) {
      console.error('[admin] createInstitution failed:', err);
      setError('שגיאה ביצירת המוסד. נסו שוב.');
    } finally {
      setSubmitting(false);
    }
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
