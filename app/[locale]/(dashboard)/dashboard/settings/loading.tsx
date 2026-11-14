export default function SettingsLoading() {
  return (
    <main className="mx-auto max-w-5xl space-y-8 p-6 md:p-8">
      <div className="flex flex-col gap-4">
        <div className="h-7 w-32 animate-pulse rounded-full bg-slate-200 mb-4" />
        <div className="h-12 md:h-6 w-[200px] animate-pulse rounded-xl bg-slate-200 md:w-[280px]" />
      </div>

      <section className="space-y-4 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm md:p-5">
        <div className="flex items-center justify-between gap-4">
          <div className="h-7 w-32 animate-pulse rounded-full bg-slate-200" />
          <div className="h-10 w-28 animate-pulse rounded-xl bg-slate-200 md:w-32" />
        </div>

        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <article
              key={index}
              className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex-1 space-y-3">
                  <div className="h-5 w-40 animate-pulse rounded-full bg-slate-200" />
                  <div className="h-4 w-full max-w-[14rem] animate-pulse rounded-full bg-slate-200" />
                  <div className="h-4 w-full max-w-[11rem] animate-pulse rounded-full bg-slate-200" />
                </div>

                <div className="w-full space-y-2 sm:w-24 sm:text-right">
                  <div className="h-5 w-20 animate-pulse rounded-full bg-slate-200 sm:ml-auto" />
                  <div className="h-4 w-16 animate-pulse rounded-full bg-slate-200 sm:ml-auto" />
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
