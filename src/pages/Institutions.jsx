import { useEffect, useState } from 'react';
import { Plus, ShieldCheck, Ban, PlayCircle } from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import ErrorBanner from '../components/ErrorBanner.jsx';
import SetPrincipalModal from '../components/SetPrincipalModal.jsx';
import NewInstitutionModal from '../components/NewInstitutionModal.jsx';
import { getAllInstitutions, getInstitutionMemberCounts, setInstitutionDisabled } from '../lib/api.js';

export default function Institutions() {
  const [institutions, setInstitutions] = useState(null);
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);
  const [principalTarget, setPrincipalTarget] = useState(null);
  const [showNew, setShowNew] = useState(false);
  const [busyId, setBusyId] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setError('');
      try {
        const list = await getAllInstitutions();
        const counts = await Promise.all(list.map((inst) => getInstitutionMemberCounts(inst.id)));
        if (cancelled) return;
        setInstitutions(list.map((inst, i) => ({ ...inst, ...counts[i] })));
      } catch (err) {
        console.error('[admin] Institutions load failed:', err);
        if (!cancelled) setError('שגיאה בטעינת רשימת המוסדות.');
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  async function handleToggleDisabled(inst) {
    setBusyId(inst.id);
    try {
      await setInstitutionDisabled(inst.id, !inst.disabled);
      setReloadKey((k) => k + 1);
    } catch (err) {
      console.error('[admin] setInstitutionDisabled failed:', err);
      setError('שגיאה בעדכון סטטוס המוסד.');
    } finally {
      setBusyId('');
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-brand-text">מוסדות</h1>
        <button
          onClick={() => setShowNew(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-l from-brand-turquoise-light to-brand-turquoise text-white font-semibold text-sm shadow-sm"
        >
          <Plus size={17} />
          מוסד חדש
        </button>
      </div>

      {error && <ErrorBanner message={error} onRetry={() => setReloadKey((k) => k + 1)} />}

      {!institutions && !error && <LoadingSpinner />}

      {institutions && (
        <div className="rounded-2xl border border-brand-border bg-white overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-brand-grey-text text-xs border-b border-brand-border">
                  <th className="text-right font-semibold px-4 py-3">שם</th>
                  <th className="text-right font-semibold px-4 py-3">institutionId</th>
                  <th className="text-right font-semibold px-4 py-3">מורים</th>
                  <th className="text-right font-semibold px-4 py-3">תלמידים</th>
                  <th className="text-right font-semibold px-4 py-3">סטטוס</th>
                  <th className="text-right font-semibold px-4 py-3">פעולות</th>
                </tr>
              </thead>
              <tbody>
                {institutions.map((inst) => (
                  <tr key={inst.id} className="border-b border-brand-border last:border-0">
                    <td className="px-4 py-3 font-semibold text-brand-text whitespace-nowrap">{inst.name}</td>
                    <td className="px-4 py-3 font-mono text-xs text-brand-grey-text whitespace-nowrap">{inst.id}</td>
                    <td className="px-4 py-3">{inst.teachers}</td>
                    <td className="px-4 py-3">{inst.students}</td>
                    <td className="px-4 py-3">
                      {inst.disabled ? (
                        <span className="text-xs font-semibold text-red-600 bg-red-50 rounded-full px-2 py-1">
                          מושבת
                        </span>
                      ) : (
                        <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 rounded-full px-2 py-1">
                          פעיל
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 whitespace-nowrap">
                        <button
                          onClick={() => setPrincipalTarget(inst)}
                          className="flex items-center gap-1 text-brand-turquoise font-semibold text-xs hover:underline"
                        >
                          <ShieldCheck size={14} />
                          הגדר מנהל
                        </button>
                        <button
                          onClick={() => handleToggleDisabled(inst)}
                          disabled={busyId === inst.id}
                          className="flex items-center gap-1 text-red-600 font-semibold text-xs hover:underline disabled:opacity-50"
                        >
                          {inst.disabled ? <PlayCircle size={14} /> : <Ban size={14} />}
                          {inst.disabled ? 'הפעל' : 'השבת'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {institutions.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-brand-grey-text">
                      אין מוסדות עדיין.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {principalTarget && (
        <SetPrincipalModal
          institution={principalTarget}
          onClose={() => setPrincipalTarget(null)}
          onDone={() => {
            setPrincipalTarget(null);
            setReloadKey((k) => k + 1);
          }}
        />
      )}

      {showNew && (
        <NewInstitutionModal
          onClose={() => setShowNew(false)}
          onDone={() => {
            setShowNew(false);
            setReloadKey((k) => k + 1);
          }}
        />
      )}
    </div>
  );
}
