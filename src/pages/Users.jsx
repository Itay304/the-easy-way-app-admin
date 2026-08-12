import { useState } from 'react';
import { Search, Trash2 } from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import ErrorBanner from '../components/ErrorBanner.jsx';
import { searchUsers, updateUserRole, deleteUserDoc } from '../lib/api.js';

const ROLES = ['student', 'teacher', 'principal', 'superadmin'];

export default function Users() {
  const [term, setTerm] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [busyUid, setBusyUid] = useState('');

  async function handleSearch(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const users = await searchUsers(term);
      setResults(users);
    } catch (err) {
      console.error('[admin] user search failed:', err);
      setError('שגיאה בחיפוש. נסו שוב.');
    } finally {
      setLoading(false);
    }
  }

  async function handleRoleChange(uid, role) {
    setBusyUid(uid);
    try {
      await updateUserRole(uid, role);
      setResults((prev) => prev.map((u) => (u.uid === uid ? { ...u, role } : u)));
    } catch (err) {
      console.error('[admin] updateUserRole failed:', err);
      setError('שגיאה בעדכון role.');
    } finally {
      setBusyUid('');
    }
  }

  async function handleDelete(uid) {
    if (!window.confirm('למחוק את מסמך המשתמש הזה מ-Firestore? הפעולה בלתי הפיכה.')) return;
    setBusyUid(uid);
    try {
      await deleteUserDoc(uid);
      setResults((prev) => prev.filter((u) => u.uid !== uid));
    } catch (err) {
      console.error('[admin] deleteUserDoc failed:', err);
      setError('שגיאה במחיקת המשתמש.');
    } finally {
      setBusyUid('');
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-brand-text">משתמשים</h1>

      <form onSubmit={handleSearch} className="flex gap-2">
        <input
          type="text"
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          placeholder="אימייל מדויק או UID"
          className="flex-1 rounded-xl border border-brand-border px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-turquoise"
        />
        <button
          type="submit"
          className="flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-l from-brand-turquoise-light to-brand-turquoise text-white font-semibold shrink-0"
        >
          <Search size={17} />
          חפש
        </button>
      </form>

      <p className="text-xs text-brand-grey-text -mt-3">
        מחיקת משתמש כאן מוחקת רק את מסמך Firestore — חשבון ה-Firebase Auth נשאר קיים ודורש מחיקה נפרדת.
      </p>

      {error && <ErrorBanner message={error} />}
      {loading && <LoadingSpinner />}

      {!loading && results && results.length === 0 && (
        <p className="text-brand-grey-text text-center py-8">לא נמצאו משתמשים.</p>
      )}

      {!loading && results && results.length > 0 && (
        <div className="space-y-3">
          {results.map((user) => (
            <div key={user.uid} className="rounded-2xl border border-brand-border bg-white p-4 space-y-2">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div>
                  <p className="font-bold text-brand-text">{user.fullName || '(ללא שם)'}</p>
                  <p className="text-sm text-brand-grey-text">{user.email}</p>
                  <p className="font-mono text-xs text-brand-grey-text mt-1">{user.uid}</p>
                </div>
                <button
                  onClick={() => handleDelete(user.uid)}
                  disabled={busyUid === user.uid}
                  className="flex items-center gap-1 text-red-600 font-semibold text-xs hover:underline disabled:opacity-50"
                >
                  <Trash2 size={14} />
                  מחק משתמש
                </button>
              </div>

              <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-brand-grey-text">
                <span>institutionId: {user.institutionId || '—'}</span>
                <span>XP: {user.totalXp ?? user.xp ?? 0}</span>
                <span>רצף: {user.streak ?? 0}</span>
              </div>

              <div className="flex items-center gap-2">
                <label className="text-sm text-brand-grey-text">role:</label>
                <select
                  value={user.role || ''}
                  disabled={busyUid === user.uid}
                  onChange={(e) => handleRoleChange(user.uid, e.target.value)}
                  className="rounded-lg border border-brand-border px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-turquoise"
                >
                  {ROLES.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
