import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";

export function ProviderSubscriptionSkeleton() {
  return (
    <div className="space-y-6 pb-24">
      {/* Header */}
      <div className="text-center space-y-4">
        <Skeleton className="h-10 w-64 mx-auto" />
        <Skeleton className="h-4 w-96 mx-auto" />
      </div>

      {/* Billing Cycle Tabs */}
      <div className="flex justify-center mt-8">
        <div className="bg-muted/50 p-1 rounded-lg flex gap-2">
          <Skeleton className="h-10 w-28 rounded-md" />
          <Skeleton className="h-10 w-28 rounded-md" />
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
        {[1, 2, 3].map((i) => (
          <Card
            key={i}
            className="flex flex-col rounded-xl border border-zinc-200 dark:border-zinc-800 h-full relative"
          >
            {/* Badge for middle card */}
            {i === 2 && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                <Skeleton className="h-6 w-24 rounded-full" />
              </div>
            )}

            <CardHeader className="pb-2 pt-5 space-y-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-8 w-32" />
              <div className="flex items-end gap-1 mt-4 mb-3">
                <Skeleton className="h-10 w-24" />
                <Skeleton className="h-4 w-16 mb-1" />
              </div>
            </CardHeader>

            <div className="w-full h-px bg-zinc-200 dark:bg-zinc-800 mb-6"></div>

            <CardContent className="flex flex-col flex-1 pb-5 pt-0 space-y-0">
              {/* Platform Fee Box */}
              <div className="flex items-center justify-between rounded-md p-3 mb-6 bg-zinc-50 dark:bg-[#252525]">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-12" />
              </div>

              {/* Benefits list */}
              <div className="flex-1 space-y-4 mb-4">
                {[1, 2, 3, 4, 5].map((j) => (
                  <div key={j} className="flex items-center gap-3">
                    <Skeleton className="h-5 w-5 rounded-full shrink-0" />
                    <Skeleton className="h-4 w-full" />
                  </div>
                ))}
              </div>

              {/* Limits Table */}
              <div className="rounded-lg bg-zinc-50 dark:bg-[#252525] border border-zinc-200 dark:border-zinc-800 p-4 space-y-3 mt-auto">
                <div className="flex justify-between items-center">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-16" />
                </div>
                <div className="flex justify-between items-center">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-4 w-12" />
                </div>
                <div className="flex justify-between items-center">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-4" />
                </div>
              </div>
            </CardContent>

            <CardFooter className="pb-6 pt-0 mt-auto flex-col">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-4 w-32 mx-auto mt-4" />
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
