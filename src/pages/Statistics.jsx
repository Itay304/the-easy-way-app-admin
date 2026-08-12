import { useEffect, useState } from 'react';
import { BookMarked, Layers, Flame, ListX } from 'lucide-react';
import StatCard from '../components/StatCard.jsx';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import ErrorBanner from '../components/ErrorBanner.jsx';
import { computeStatistics } from '../lib/api.js';

export default function Statistics() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setError('');
      try {
        const result = await computeStatistics();
        if (!cancelled) setData(result);
      } catch (err) {
        console.error('[admin] Statistics load failed:', err);
        if (!cancelled) setError('שגיאה בחישוב הסטטיסטיקות.');
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  if (error) return <ErrorBanner message={error} />;
  if (!data) return <LoadingSpinner label="מחשב סטטיסטיקות פלטפורמה... (עשוי לקחת רגע)" />;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-brand-text">סטטיסטיקות פלטפורמה</h1>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard icon={BookMarked} label="מילים שנשלטו (סה״כ)" value={data.masteredWords} />
        <StatCard icon={Layers} label="ה-band הפופולרי ביותר" value={data.mostPopularBand || '—'} />
        <StatCard icon={ListX} label="המודול הנפוץ ביותר" value="לא נשמר בפלטפורמה" />
      </div>

      <div className="rounded-2xl border border-brand-border bg-white p-5">
        <div className="flex items-center gap-2 mb-4">
          <Flame size={18} className="text-brand-turquoise" />
          <h2 className="font-bold text-brand-text">10 המילים הקשות ביותר — פלטפורמה כולה</h2>
        </div>

        {data.hardestWords.length === 0 ? (
          <p className="text-brand-grey-text text-sm">אין מספיק נתונים עדיין.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-brand-grey-text text-xs border-b border-brand-border">
                <th className="text-right font-semibold px-3 py-2">#</th>
                <th className="text-right font-semibold px-3 py-2">מילה</th>
                <th className="text-right font-semibold px-3 py-2">ניסיונות</th>
                <th className="text-right font-semibold px-3 py-2">טעויות</th>
              </tr>
            </thead>
            <tbody>
              {data.hardestWords.map((w, i) => (
                <tr key={w.word} className="border-b border-brand-border last:border-0">
                  <td className="px-3 py-2 text-brand-grey-text">{i + 1}</td>
                  <td className="px-3 py-2 font-semibold text-brand-text">{w.word}</td>
                  <td className="px-3 py-2">{w.attempts}</td>
                  <td className="px-3 py-2 text-red-600 font-semibold">{w.errors}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
