type Props = { label: string; active: boolean; onToggle: () => void; };
export default function FilterChip({ label, active, onToggle }: Props) {
  return (
    <button
      onClick={onToggle}
      className={`rounded-full px-3 py-1 text-sm ring-1 ${
        active
          ? "bg-amber-600 text-white ring-amber-600"
          : "text-zinc-700 ring-zinc-300"
      }`}
    >
      {label}
    </button>
  );
}
