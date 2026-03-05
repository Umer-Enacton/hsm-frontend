"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Phone, Mail, MapPin, Globe, FileText } from "lucide-react";

interface BusinessDetailsProps {
  business: any;
}

export function BusinessDetails({ business }: BusinessDetailsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Business Details</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* About Section */}
        <div>
          <h3 className="font-semibold mb-2 flex items-center gap-2">
            <FileText className="h-4 w-4" />
            About
          </h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {business.description || "No description provided."}
          </p>
        </div>

        {/* Contact Information */}
        <div>
          <h3 className="font-semibold mb-3">Contact Information</h3>
          <div className="space-y-3">
            {business.phone && (
              <div className="flex items-center gap-3 p-3 rounded-lg border">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                  <Phone className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground">Phone</p>
                  <a
                    href={`tel:${business.phone}`}
                    className="text-sm font-medium hover:text-primary"
                  >
                    {business.phone}
                  </a>
                </div>
              </div>
            )}

            {business.email && (
              <div className="flex items-center gap-3 p-3 rounded-lg border">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                  <Mail className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground">Email</p>
                  <a
                    href={`mailto:${business.email}`}
                    className="text-sm font-medium hover:text-primary truncate"
                  >
                    {business.email}
                  </a>
                </div>
              </div>
            )}

            {business.address && (
              <div className="flex items-center gap-3 p-3 rounded-lg border">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                  <MapPin className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground">Address</p>
                  <p className="text-sm">{business.address}</p>
                </div>
              </div>
            )}

            {business.website && (
              <div className="flex items-center gap-3 p-3 rounded-lg border">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                  <Globe className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground">Website</p>
                  <a
                    href={business.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-medium text-primary hover:underline"
                  >
                    {business.website.replace(/^https?:\/\//, "")}
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Verification Info */}
        <div className={`p-4 rounded-lg border ${
          business.isVerified
            ? "bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-900"
            : "bg-orange-50 border-orange-200 dark:bg-orange-950 dark:border-orange-900"
        }`}>
          <h4 className={`font-semibold mb-1 ${
            business.isVerified
              ? "text-green-900 dark:text-green-100"
              : "text-orange-900 dark:text-orange-100"
          }`}>
            {business.isVerified ? "✓ Verified Business" : "⏳ Pending Verification"}
          </h4>
          <p className={`text-sm ${
            business.isVerified
              ? "text-green-800 dark:text-green-200"
              : "text-orange-800 dark:text-orange-200"
          }`}>
            {business.isVerified
              ? "Your business is verified and active. Customers can discover and book your services."
              : "Your business is pending verification by admin. This usually takes 1-2 business days. You will be notified once verified."}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
