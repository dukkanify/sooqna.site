/** Reserved height while homepage listing rails stream in — avoids a blank jump. */
export function HomeFeedSkeleton() {
  return (
    <section
      aria-busy="true"
      aria-label="جاري تحميل الإعلانات"
      className="border-b border-border/40 bg-background py-8 md:py-10"
    >
      <div className="app-container">
        <div className="mb-5 h-6 w-40 rounded-md skeleton md:mb-6" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 4 }, (_, index) => (
            <div
              key={index}
              className="overflow-hidden rounded-[var(--radius-2xl)] border border-border/60 bg-surface"
            >
              <div className="aspect-[3/2] skeleton" />
              <div className="space-y-2 p-3">
                <div className="h-3 w-2/5 rounded skeleton" />
                <div className="h-3 w-4/5 rounded skeleton" />
                <div className="h-3 w-1/3 rounded skeleton" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
