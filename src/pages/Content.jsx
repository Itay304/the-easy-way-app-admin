import { useEffect, useState } from 'react';
import { ExternalLink, BookOpen } from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import ErrorBanner from '../components/ErrorBanner.jsx';
import { getWordListsWithCounts } from '../lib/api.js';

const ADMIN_TOOL_URL = 'https://github.com/Itay304/EasyLex/tree/main/admin-tool';

export default function Content() {
  const [lists, setLists] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setError('');
      try {
        const result = await getWordListsWithCounts();
        if (!cancelled) setLists(result);
      } catch (err) {
        console.error('[admin] Content load failed:', err);
        if (!cancelled) setError('שגיאה בטעינת רשימות המילים.');
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h1 className="text-2xl font-bold text-brand-text">תוכן</h1>
        <a
          href={ADMIN_TOOL_URL}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-grey-light text-brand-text font-semibold text-sm"
        >
          <ExternalLink size={16} />
          כלי ניהול תוכן (admin-tool)
        </a>
      </div>

      {error && <ErrorBanner message={error} />}
      {!lists && !error && <LoadingSpinner />}

      {lists && (
        <div className="rounded-2xl border border-brand-border bg-white overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-brand-grey-text text-xs border-b border-brand-border">
                  <th className="text-right font-semibold px-4 py-3">שם רשימה</th>
                  <th className="text-right font-semibold px-4 py-3">listId</th>
                  <th className="text-right font-semibold px-4 py-3">מספר מילים</th>
                </tr>
              </thead>
              <tbody>
                {lists.map((list) => (
                  <tr key={list.id} className="border-b border-brand-border last:border-0">
                    <td className="px-4 py-3 font-semibold text-brand-text flex items-center gap-2">
                      <BookOpen size={15} className="text-brand-turquoise shrink-0" />
                      {list.name || list.id}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-brand-grey-text">{list.id}</td>
                    <td className="px-4 py-3">{list.wordCount}</td>
                  </tr>
                ))}
                {lists.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-4 py-8 text-center text-brand-grey-text">
                      אין רשימות מילים עדיין.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
