export const inputCls = 'w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#00a2ff]';

export function Field({ label, hint, children, className = '' }) {
  return (
    <div className={className}>
      <span className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-gray-500">{label}</span>
      {children}
      {hint && <p className="mt-1 text-[11px] text-gray-400">{hint}</p>}
    </div>
  );
}

export function Choice({ checked, onClick, title, desc }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={checked}
      className={`rounded-xl border p-2.5 text-left transition ${checked ? 'border-[#00a2ff] bg-[#00a2ff]/5' : 'border-gray-200 hover:border-gray-300'}`}
    >
      <span className={`block text-xs font-bold ${checked ? 'text-[#00a2ff]' : 'text-gray-700'}`}>{title}</span>
      {desc && <span className="mt-0.5 block text-[11px] text-gray-400">{desc}</span>}
    </button>
  );
}