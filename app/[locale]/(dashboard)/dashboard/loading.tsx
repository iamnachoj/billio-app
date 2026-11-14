export default function DashboardLoading() {
  return (
    <main className="min-h-[calc(100vh-4rem)] bg-linear-to-br from-[#eef8f3] via-[#f5f8f6] to-[#edf4f7] font-sans">
      <div className="mx-auto max-w-6xl px-4 pb-16 pt-8 sm:px-6 sm:pt-10 lg:px-8">
        <header className="flex flex-col gap-5 border-b border-slate-200 pb-4 sm:flex-row sm:items-end sm:justify-between sm:gap-8">
          <div>
            <div className="h-3 w-28 animate-pulse rounded-full bg-slate-200" />
            <div className="mt-3 h-9 w-48 animate-pulse rounded-full bg-slate-200" />
            <div className="mt-3 h-5 w-56 animate-pulse rounded-full bg-slate-200" />
          </div>
        </header>

        <section className="pt-4">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <div className="h-7 w-32 animate-pulse rounded-full bg-slate-200" />
              <div className="mt-2 h-4 w-44 animate-pulse rounded-full bg-slate-200" />
            </div>
            <div className="h-5 w-24 animate-pulse rounded-full bg-slate-200" />
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div
                key={index}
                className="rounded-2xl border border-slate-200 bg-white p-5"
              >
                <div className="h-6 w-2/3 animate-pulse rounded-full bg-slate-200" />
                <div className="mt-2 h-4 w-5/6 animate-pulse rounded-full bg-slate-100" />
              </div>
            ))}
          </div>
          <div className="mt-6 h-12 w-full animate-pulse rounded-xl bg-slate-200 sm:w-36" />
        </section>
      </div>
    </main>
  );
}
