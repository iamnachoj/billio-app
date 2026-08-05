type ExpenseSearchPanelProps = {
  value: string;
  onChange: (value: string) => void;
};

export default function ExpenseSearchPanel({
  value,
  onChange,
}: ExpenseSearchPanelProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3">
      <label htmlFor="expense-search" className="sr-only">
        Search expenses by name
      </label>
      <input
        id="expense-search"
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Search by expense name"
        className="w-full md:w-1/2 lg:w-1/3 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-500 focus:outline-none"
      />
    </div>
  );
}
