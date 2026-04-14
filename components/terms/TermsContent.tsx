"use client";

import { FileText, AlertCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { QUERY_KEYS } from "@/lib/queries/query-keys";
import { api, API_ENDPOINTS } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { TermsSkeleton } from "@/components/terms/skeletons/TermsSkeleton";

export function TermsContent() {
  const { data: terms, isLoading, error } = useQuery({
    queryKey: [QUERY_KEYS.GLOBAL_TERMS_CONDITIONS],
    queryFn: async () => {
      const response = await api.get<{
        version: string;
        content: string;
        effectiveDate: string;
      }>(API_ENDPOINTS.TERMS_ACTIVE);
      return response;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  if (isLoading) {
    return <TermsSkeleton />;
  }

  if (error || !terms) {
    return (
      <Card>
        <CardContent className="flex items-center gap-3 py-12">
          <AlertCircle className="h-5 w-5 text-destructive" />
          <p className="text-muted-foreground">{error?.message || "No terms & conditions available"}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-2">
            <FileText className="h-6 w-6" />
            Terms & Conditions
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base mt-1">
            Version {terms.version} • Effective{" "}
            {terms.effectiveDate
              ? new Date(terms.effectiveDate).toLocaleDateString()
              : "N/A"}
          </p>
        </div>
      </div>

      {/* Content */}
      <Card>
        <CardContent className="p-6">
          <div
            className="prose prose-sm sm:prose-base dark:prose-invert max-w-none"
            dangerouslySetInnerHTML={{ __html: terms.content }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
