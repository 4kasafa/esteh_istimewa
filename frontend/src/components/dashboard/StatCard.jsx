export default function StatCard({ label, value, icon, color, hint }) {
  return (
    <div className="bg-white p-5 sm:p-6 rounded-[28px] border border-brand-green/5 card-shadow group hover:border-brand-green/20 transition-all duration-300">
      <div className="flex justify-between items-start mb-3">
        <div className={`w-12 h-12 rounded-2xl ${color} bg-opacity-10 flex items-center justify-center text-xl group-hover:scale-110 transition-transform`}>
          {icon}
        </div>
        {hint && (
          <div className="px-2 py-1 bg-brand-bg rounded-lg text-[10px] font-black text-brand-muted/70 uppercase tracking-wider">
            {hint}
          </div>
        )}
      </div>
      <div>
        <p className="text-[11px] font-bold text-brand-muted uppercase tracking-widest mb-1">{label}</p>
        <h3 className="text-2xl font-black text-brand-green-dark tracking-tight leading-none">
          {value}
        </h3>
      </div>
    </div>
  );
}
