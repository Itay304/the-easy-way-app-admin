import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import {
  CalendarDays,
  TrendingUp,
  Gauge,
  Target,
  CheckCircle2,
  Percent,
  Star,
  Flame,
  Layers,
  UserPlus,
  Users,
  UserCheck,
  Repeat,
} from 'lucide-react';
import StatCard from '../components/StatCard.jsx';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import ErrorBanner from '../components/ErrorBanner.jsx';
import {
  getAllUsers,
  getAllInstitutions,
  buildDailyActivitySeries,
  computeDailyActivityStats,
  computeEngagementStats,
  computeModuleUsageStats,
  computeNewUsersPerWeek,
  computeRetentionStats,
  computeInstitutionBreakdown,
} from '../lib/api.js';

function SectionCard({ title, children }) {
  return (
    <div className="rounded-2xl border border-brand-border bg-white p-5 space-y-4">
      <h2 className="font-bold text-brand-text">{title}</h2>
      {children}
    </div>
  );
}

function fmt(n) {
  return Math.round(n).toLocaleString('he-IL');
}

export default function Statistics() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setError('');
      try {
        const [allUsers, institutions, moduleUsage] = await Promise.all([
          getAllUsers(),
          getAllInstitutions(),
          computeModuleUsageStats(),
        ]);
        if (cancelled) return;

        const students = allUsers.filter((u) => u.role === 'student');
        const teachers = allUsers.filter((u) => u.role === 'teacher');

        const dailySeries = buildDailyActivitySeries(students.map((s) => s.lastActiveDate).filter(Boolean));

        setData({
          daily: { series: dailySeries, ...computeDailyActivityStats(dailySeries) },
          engagement: computeEngagementStats(students),
          moduleUsage,
          growth: computeNewUsersPerWeek(allUsers),
          retention: computeRetentionStats(students),
          institutionBreakdown: computeInstitutionBreakdown(institutions, students, teachers),
        });
      } catch (err) {
        console.error('[admin] Statistics load failed:', err);
        if (!cancelled) setError('שגיאה בטעינת הסטטיסטיקות.');
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  if (error) return <ErrorBanner message={error} />;
  if (!data) return <LoadingSpinner label="מחשב אנליטיקות פלטפורמה... (עשוי לקחת רגע)" />;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-brand-text">סטטיסטיקות</h1>

      {/* 1. פעילות יומית */}
      <SectionCard title="פעילות יומית — 30 יום אחרונים">
        <div className="grid grid-cols-3 gap-3">
          <StatCard icon={CalendarDays} label="ימים עם פעילות" value={data.daily.totalActiveDays} />
          <StatCard icon={TrendingUp} label={`שיא יומי (${data.daily.peakDay})`} value={data.daily.peakCount} />
          <StatCard icon={Gauge} label="ממוצע ליום" value={data.daily.avgPerDay.toFixed(1)} />
        </div>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.daily.series} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="count" fill="#0891b2" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </SectionCard>

      {/* 2. מעורבות */}
      <SectionCard title="מעורבות">
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          <StatCard icon={Target} label="סה״כ ניסיונות תרגול" value={fmt(data.engagement.totalAttempts)} />
          <StatCard icon={CheckCircle2} label="סה״כ תשובות נכונות" value={fmt(data.engagement.totalCorrect)} />
          <StatCard icon={Percent} label="דיוק ממוצע בפלטפורמה" value={`${data.engagement.avgAccuracy.toFixed(1)}%`} />
          <StatCard icon={Star} label="XP ממוצע למשתמש" value={fmt(data.engagement.avgXpPerUser)} />
          <StatCard
            icon={Flame}
            label="רצף ממוצע למשתמש פעיל"
            value={data.engagement.avgStreakPerActiveUser.toFixed(1)}
          />
        </div>
      </SectionCard>

      {/* 3. שימוש במודולים */}
      <SectionCard title="שימוש במודולים">
        {data.moduleUsage.available ? (
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.moduleUsage.data} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="module" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="attempts" fill="#0891b2" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="flex items-center gap-3 text-brand-grey-text text-sm py-4">
            <Layers size={18} className="shrink-0" />
            מעקב לפי מודול תרגול לא נשמר עדיין ב-Firestore (אין שדה module במסמכי progress) — אין מה להציג כרגע.
          </div>
        )}
      </SectionCard>

      {/* 4. שימור וצמיחה */}
      <SectionCard title="שימור וצמיחה">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard icon={Users} label="סה״כ תלמידים רשומים" value={data.retention.totalRegistered} />
          <StatCard icon={UserCheck} label="פעילים ב-7 ימים" value={data.retention.active7d} />
          <StatCard icon={UserCheck} label="פעילים ב-30 יום" value={data.retention.active30d} />
          <StatCard icon={Repeat} label="משתמשים חוזרים (>1 יום פעילות)" value={data.retention.returningUsers} />
        </div>

        <div>
          <div className="flex items-center gap-2 mb-2">
            <UserPlus size={16} className="text-brand-turquoise" />
            <h3 className="text-sm font-semibold text-brand-text">משתמשים חדשים לשבוע — 8 שבועות אחרונים</h3>
          </div>
          <p className="text-xs text-brand-grey-text mb-3">
            מבוסס רק על משתמשים עם שדה createdAt ({data.growth.coverage.withCreatedAt} מתוך{' '}
            {data.growth.coverage.total} סה״כ) — משתמשים ישנים שנוצרו לפני שהשדה נוסף לא נכללים.
          </p>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.growth.series} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="week" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#22d3ee" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </SectionCard>

      {/* 5. פילוח מוסדות */}
      <SectionCard title="פילוח מוסדות">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-brand-grey-text text-xs border-b border-brand-border">
                <th className="text-right font-semibold px-3 py-2">מוסד</th>
                <th className="text-right font-semibold px-3 py-2">תלמידים</th>
                <th className="text-right font-semibold px-3 py-2">מורים</th>
                <th className="text-right font-semibold px-3 py-2">XP ממוצע</th>
                <th className="text-right font-semibold px-3 py-2">רצף ממוצע</th>
                <th className="text-right font-semibold px-3 py-2">% פעילים ב-7 ימים</th>
              </tr>
            </thead>
            <tbody>
              {data.institutionBreakdown.map((inst) => (
                <tr key={inst.id} className="border-b border-brand-border last:border-0">
                  <td className="px-3 py-2 font-semibold text-brand-text whitespace-nowrap">{inst.name}</td>
                  <td className="px-3 py-2">{inst.studentCount}</td>
                  <td className="px-3 py-2">{inst.teacherCount}</td>
                  <td className="px-3 py-2">{fmt(inst.avgXp)}</td>
                  <td className="px-3 py-2">{inst.avgStreak.toFixed(1)}</td>
                  <td className="px-3 py-2">{inst.pctActive7d.toFixed(0)}%</td>
                </tr>
              ))}
              {data.institutionBreakdown.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-3 py-8 text-center text-brand-grey-text">
                    אין מוסדות עדיין.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </SectionCard>
    </div>
  );
}
