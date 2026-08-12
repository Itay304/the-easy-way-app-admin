import { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Building2, Users, GraduationCap, Activity } from 'lucide-react';
import StatCard from '../components/StatCard.jsx';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import ErrorBanner from '../components/ErrorBanner.jsx';
import {
  getTotalInstitutions,
  getTotalByRole,
  getStudentsActivity,
  countActiveSince,
  buildDailyActivitySeries,
} from '../lib/api.js';
import { dateKeyIsrael } from '../lib/dateUtils.js';

export default function Overview() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setError('');
      try {
        const [institutions, teachers, students, activityDates] = await Promise.all([
          getTotalInstitutions(),
          getTotalByRole('teacher'),
          getTotalByRole('student'),
          getStudentsActivity(),
        ]);
        if (cancelled) return;
        setData({
          institutions,
          teachers,
          students,
          activeThisWeek: countActiveSince(activityDates, dateKeyIsrael(-6)),
          chartData: buildDailyActivitySeries(activityDates),
        });
      } catch (err) {
        console.error('[admin] Overview load failed:', err);
        if (!cancelled) setError('שגיאה בטעינת נתוני הסקירה.');
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  if (error) return <ErrorBanner message={error} />;
  if (!data) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-brand-text">סקירה כללית</h1>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Building2} label="סה״כ מוסדות" value={data.institutions} />
        <StatCard icon={Users} label="סה״כ מורים" value={data.teachers} />
        <StatCard icon={GraduationCap} label="סה״כ תלמידים" value={data.students} />
        <StatCard icon={Activity} label="תלמידים פעילים השבוע" value={data.activeThisWeek} />
      </div>

      <div className="rounded-2xl border border-brand-border bg-white p-5">
        <h2 className="font-bold text-brand-text mb-4">משתמשים פעילים ליום — 30 יום אחרונים</h2>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data.chartData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Line type="monotone" dataKey="count" stroke="#0891b2" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
