function SkeletonLine({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded bg-slate-200 dark:bg-white/10 ${className}`} />;
}

export default function PublicLoading() {
  return (
    <main>
      <section className="mx-auto grid max-w-7xl gap-8 px-4 py-16 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:px-8 lg:py-24">
        <div className="space-y-5">
          <SkeletonLine className="h-4 w-28" />
          <SkeletonLine className="h-12 w-full max-w-xl" />
          <SkeletonLine className="h-12 w-4/5 max-w-lg" />
          <div className="space-y-3 pt-2">
            <SkeletonLine className="h-4 w-full max-w-2xl" />
            <SkeletonLine className="h-4 w-11/12 max-w-xl" />
            <SkeletonLine className="h-4 w-2/3 max-w-md" />
          </div>
          <div className="flex flex-wrap gap-3 pt-3">
            <SkeletonLine className="h-11 w-36 rounded-md" />
            <SkeletonLine className="h-11 w-32 rounded-md" />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <SkeletonLine className="h-40 rounded-lg" />
          <SkeletonLine className="h-40 rounded-lg sm:mt-8" />
          <SkeletonLine className="h-40 rounded-lg" />
          <SkeletonLine className="h-40 rounded-lg sm:mt-8" />
        </div>
      </section>

      <section className="border-y border-slate-200 bg-slate-50 py-12 dark:border-white/10 dark:bg-white/[0.02]">
        <div className="mx-auto grid max-w-7xl gap-4 px-4 sm:px-6 md:grid-cols-3 lg:px-8">
          {[0, 1, 2].map((item) => (
            <div key={item} className="rounded-lg border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-white/[0.04]">
              <SkeletonLine className="h-9 w-9 rounded-md" />
              <SkeletonLine className="mt-5 h-5 w-2/3" />
              <SkeletonLine className="mt-3 h-4 w-full" />
              <SkeletonLine className="mt-2 h-4 w-4/5" />
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
