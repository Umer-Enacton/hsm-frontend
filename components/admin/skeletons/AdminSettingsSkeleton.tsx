export function AdminSettingsSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <div className="h-8 w-32 bg-muted/30 rounded animate-pulse" />
        <div className="h-4 w-48 bg-muted/20 rounded animate-pulse" />
      </div>

      {/* Settings Sections */}
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-32 bg-muted/20 rounded-lg animate-pulse" />
        ))}
      </div>
    </div>
  );
}
