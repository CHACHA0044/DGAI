export default function SkeletonCard() {
  return (
    <div className="bg-bg-card border border-white/8 rounded-2xl p-5 border-l-4 border-l-white/10 overflow-hidden">
      <div className="animate-pulse space-y-4">
        {/* Header row */}
        <div className="flex items-start justify-between gap-3">
          <div className="h-5 bg-white/8 rounded-lg w-2/3" />
          <div className="h-6 w-16 bg-white/8 rounded-full" />
        </div>

        {/* Badge row */}
        <div className="flex gap-2">
          <div className="h-6 w-20 bg-white/8 rounded-full" />
          <div className="h-6 w-16 bg-white/8 rounded-full" />
          <div className="h-6 w-14 bg-white/8 rounded-full" />
        </div>

        {/* Description lines */}
        <div className="space-y-2">
          <div className="h-4 bg-white/8 rounded w-full" />
          <div className="h-4 bg-white/8 rounded w-5/6" />
        </div>

        {/* Meta row */}
        <div className="flex gap-4 pt-1">
          <div className="h-4 w-24 bg-white/8 rounded" />
          <div className="h-4 w-20 bg-white/8 rounded" />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-white/5">
          <div className="h-4 w-28 bg-white/8 rounded" />
          <div className="h-8 w-24 bg-white/8 rounded-lg" />
        </div>
      </div>
    </div>
  );
}
