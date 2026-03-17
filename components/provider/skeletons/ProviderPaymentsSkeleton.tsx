export function ProviderPaymentsSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <div className="h-8 w-48 bg-muted/30 rounded animate-pulse" />
        <div className="h-4 w-64 bg-muted/20 rounded animate-pulse" />
      </div>

      {/* Status Alert */}
      <div className="h-24 bg-muted/20 rounded-lg animate-pulse" />

      {/* Payment Methods Grid */}
      <div className="grid gap-4 md:grid-cols-2 max-w-4xl">
        {[1, 2].map((i) => (
          <div
            key={i}
            className="h-32 bg-muted/20 rounded-lg animate-pulse"
          />
        ))}
      </div>
    </div>
  );
}
