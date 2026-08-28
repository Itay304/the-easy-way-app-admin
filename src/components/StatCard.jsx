export default function StatCard({ icon: Icon, label, value }) {
  // ערכים ארוכים (למשל "777 נכונות מתוך 1,289 סה״כ (60.3%)") לא קריאים
  // ב-text-2xl — מקטינים אוטומטית לפי אורך, בלי לשנות את ה-API של הרכיב
  // עבור שימושים קיימים עם ערך מספרי קצר.
  const valueText = String(value);
  const sizeClass = valueText.length > 18 ? 'text-base' : valueText.length > 10 ? 'text-lg' : 'text-2xl';

  return (
    <div className="rounded-2xl border border-brand-border bg-white p-5 flex items-center gap-4">
      <div className="h-11 w-11 rounded-xl bg-gradient-to-l from-brand-turquoise-light to-brand-turquoise flex items-center justify-center text-white shrink-0">
        <Icon size={20} />
      </div>
      <div>
        <p className={`${sizeClass} font-bold text-brand-text`}>{value}</p>
        <p className="text-sm text-brand-grey-text">{label}</p>
      </div>
    </div>
  );
}
