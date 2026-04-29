/**
 * Skeleton placeholder for register pages while their useSearchParams()
 * Suspense boundary resolves. Matches the page chrome (header → toolbar →
 * table) so layout doesn't shift on hydration.
 *
 * No animation library — just a Tailwind animate-pulse on muted blocks.
 */
export function RegisterPageSkeleton() {
  return (
    <div className="animate-pulse">
      {/* Header band */}
      <div className="border-b px-6 py-5">
        <div className="h-5 w-48 rounded bg-muted" />
        <div className="mt-2 h-4 w-72 rounded bg-muted/60" />
      </div>

      <div className="space-y-4 p-6">
        {/* Toolbar row: search + 3 selects + clear */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="h-9 min-w-[14rem] flex-1 rounded-md bg-muted" />
          <div className="h-9 w-[12rem] rounded-md bg-muted" />
          <div className="h-9 w-[10rem] rounded-md bg-muted" />
          <div className="h-9 w-[10rem] rounded-md bg-muted" />
        </div>

        {/* Table skeleton: header row + 8 body rows */}
        <div className="rounded-lg border">
          <div className="border-b bg-muted/50 px-3 py-2">
            <div className="flex gap-3">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-3 w-16 rounded bg-muted" />
              ))}
            </div>
          </div>
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex gap-3 border-b px-3 py-3 last:border-b-0">
              {Array.from({ length: 8 }).map((__, j) => (
                <div
                  key={j}
                  className="h-4 rounded bg-muted/70"
                  style={{ width: `${[20, 32, 16, 16, 12, 24, 14, 18][j]}%` }}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
