export default function DashboardLoading() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-12 md:px-8">
      <header className="mb-6 flex items-center justify-between gap-4">
        <div className="h-8 w-44 animate-pulse rounded-full bg-slate-200" />
        <div className="h-10 w-32 animate-pulse rounded-xl bg-slate-200" />
      </header>

      <div className="my-4 h-px w-full bg-slate-200" />

      <section>
        <div className="mb-6 flex items-center justify-between">
          <div className="h-7 w-32 animate-pulse rounded-full bg-slate-200" />
          <div className="h-6 w-24 animate-pulse rounded-full bg-slate-200" />
        </div>

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              key={index}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
            >
              <div className="h-7 w-2/3 animate-pulse rounded-full bg-slate-200" />
              <div className="mt-4 h-4 w-full animate-pulse rounded-full bg-slate-200" />
              <div className="mt-2 h-4 w-5/6 animate-pulse rounded-full bg-slate-200" />
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
