export default function RootLoading() {
  return (
    <div className="container-page py-8 animate-pulse">
      <div className="h-8 w-48 rounded-xl bg-gray-200/80 dark:bg-navy-800/80" />
      <div className="mt-4 h-4 w-72 rounded-lg bg-gray-100 dark:bg-navy-900/60" />
      <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="flex flex-col gap-3 rounded-2xl border border-gray-100 p-4 dark:border-navy-800/60 dark:bg-navy-900/40"
          >
            <div className="aspect-[4/3] w-full rounded-xl bg-gray-100 dark:bg-navy-950/60" />
            <div className="h-5 w-3/4 rounded-lg bg-gray-200/70 dark:bg-navy-800/60" />
            <div className="h-4 w-1/2 rounded-md bg-gray-100 dark:bg-navy-900/50" />
            <div className="mt-2 h-6 w-1/3 rounded-lg bg-gray-200/80 dark:bg-navy-800/70" />
          </div>
        ))}
      </div>
    </div>
  );
}
