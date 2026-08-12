export default function StatCard({ icon: Icon, label, value }) {
  return (
    <div className="rounded-2xl border border-brand-border bg-white p-5 flex items-center gap-4">
      <div className="h-11 w-11 rounded-xl bg-gradient-to-l from-brand-turquoise-light to-brand-turquoise flex items-center justify-center text-white shrink-0">
        <Icon size={20} />
      </div>
      <div>
        <p className="text-2xl font-bold text-brand-text">{value}</p>
        <p className="text-sm text-brand-grey-text">{label}</p>
      </div>
    </div>
  );
}
