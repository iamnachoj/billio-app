export default function GroupLoading() {
  return (
    <main className="mx-auto max-w-5xl space-y-8 p-6 md:p-8">
      <header className="relative rounded-3xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-5 shadow-sm md:p-8">
        <div className="absolute right-4 top-4 h-9 w-9 animate-pulse rounded-lg bg-slate-200 md:block" />

        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="space-y-3 w-full md:w-auto">
            <div className="h-3 w-24 animate-pulse rounded-full bg-slate-200" />
            <div className="h-9 w-48 animate-pulse rounded-full bg-slate-200 md:h-10 md:w-72" />
            <div className="h-4 w-full max-w-[18rem] animate-pulse rounded-full bg-slate-200 md:max-w-[22rem]" />
            <div className="h-4 w-full max-w-[15rem] animate-pulse rounded-full bg-slate-200 md:max-w-[20rem]" />
            <div className="h-4 w-full max-w-[13rem] animate-pulse rounded-full bg-slate-200 md:max-w-[18rem]" />
          </div>

          <div className="w-full rounded-2xl border border-slate-200 bg-white p-4 md:min-w-[260px] md:max-w-[260px] lg:mr-6">
            <div className="h-3 w-12 animate-pulse rounded-full bg-slate-200" />
            <div className="mt-3 h-4 w-20 animate-pulse rounded-full bg-slate-200" />
            <div className="mt-4 h-8 w-28 animate-pulse rounded-full bg-slate-200" />
          </div>
        </div>
      </header>

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
